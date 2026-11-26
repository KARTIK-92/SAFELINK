import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/api_client.dart';
import '../../core/location_service.dart';
import '../../core/notification_service.dart';
import '../../core/storage_service.dart';

class VolunteerState {
  final bool isAvailable;
  final bool isLoading;
  final Map<String, dynamic>? profile;
  final List<Map<String, dynamic>> candidateIncidents;
  final Map<String, dynamic>? activeIncident;
  final Position? lastPosition;
  final String? errorMessage;

  const VolunteerState({
    this.isAvailable = true,
    this.isLoading = false,
    this.profile,
    this.candidateIncidents = const [],
    this.activeIncident,
    this.lastPosition,
    this.errorMessage,
  });

  VolunteerState copyWith({
    bool? isAvailable,
    bool? isLoading,
    Map<String, dynamic>? profile,
    List<Map<String, dynamic>>? candidateIncidents,
    Map<String, dynamic>? activeIncident,
    bool clearActiveIncident = false,
    Position? lastPosition,
    String? errorMessage,
  }) {
    return VolunteerState(
      isAvailable: isAvailable ?? this.isAvailable,
      isLoading: isLoading ?? this.isLoading,
      profile: profile ?? this.profile,
      candidateIncidents: candidateIncidents ?? this.candidateIncidents,
      activeIncident: clearActiveIncident
          ? null
          : (activeIncident ?? this.activeIncident),
      lastPosition: lastPosition ?? this.lastPosition,
      errorMessage: errorMessage,
    );
  }
}

final volunteerControllerProvider =
    StateNotifierProvider<VolunteerController, VolunteerState>((ref) {
  final api = ref.watch(apiClientProvider);
  final location = ref.watch(locationServiceProvider);
  final storage = ref.watch(storageServiceProvider);
  return VolunteerController(api: api, location: location, storage: storage);
});

class VolunteerController extends StateNotifier<VolunteerState> {
  final ApiClient _api;
  final LocationService _location;
  final StorageService _storage;

  Timer? _incidentPollTimer;
  bool _isDisposed = false;

  VolunteerController({
    required ApiClient api,
    required LocationService location,
    required StorageService storage,
  })  : _api = api,
        _location = location,
        _storage = storage,
        super(const VolunteerState(isAvailable: true, isLoading: true)) {
    _initialize();
  }

  Future<void> _initialize() async {
    _api.preWarmBackend();
    final token = await _storage.getAccessToken();
    final refresh = await _storage.getRefreshToken();
    if ((token == null || token.isEmpty) &&
        (refresh == null || refresh.isEmpty)) {
      if (!_isDisposed) {
        state = state.copyWith(isLoading: false);
      }
      return;
    }

    // Start radar and GPS reporting immediately in always-available mode
    _startLocationReporting();
    _startIncidentPolling();
    await loadProfile();
    await _restoreActiveIncidentIfStored();
  }

  Future<void> _restoreActiveIncidentIfStored() async {
    if (state.activeIncident != null) return;
    final storedId = await _storage.getActiveIncidentId();
    if (storedId == null || storedId.isEmpty) return;

    try {
      final detailsRes = await _api.getIncidentDetails(storedId);
      final details = Map<String, dynamic>.from(detailsRes.data as Map);
      details['response_status'] ??= 'accepted';
      if (!_isDisposed) {
        state = state.copyWith(activeIncident: details);
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 404 || e.response?.statusCode == 403) {
        await _storage.setActiveIncidentId(null);
      }
    } catch (_) {}
  }

  Future<void> loadProfile() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _api.getVolunteerProfile();
      final data = Map<String, dynamic>.from(res.data as Map);
      final backendAvail = data['is_available'] as bool? ?? false;

      if (!backendAvail) {
        try {
          await _api.toggleAvailability(true, reason: 'Always available responder mode');
          data['is_available'] = true;
        } catch (_) {}
      }

      if (!_isDisposed) {
        state = state.copyWith(
          isAvailable: true,
          isLoading: false,
          profile: data,
        );
      }

      _startLocationReporting();
      _startIncidentPolling();
    } catch (_) {
      if (!_isDisposed) {
        state = state.copyWith(isAvailable: true, isLoading: false);
      }
    }
  }

  Future<void> toggleAvailability(bool isAvailable, {String? reason}) async {
    try {
      await _api.toggleAvailability(isAvailable, reason: reason);
      if (!_isDisposed) {
        state = state.copyWith(isAvailable: isAvailable);
      }
    } catch (_) {}
  }

  Future<void> reportCurrentPosition(Position pos) async {
    if (!_isDisposed) {
      state = state.copyWith(lastPosition: pos);
    }
    try {
      await _api.updateLocation(
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracyMeters: pos.accuracy,
        speed: pos.speed,
        heading: pos.heading,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 400) {
        try {
          await _api.toggleAvailability(true);
          await _api.updateLocation(
            latitude: pos.latitude,
            longitude: pos.longitude,
            accuracyMeters: pos.accuracy,
            speed: pos.speed,
            heading: pos.heading,
          );
        } catch (_) {}
      }
    } catch (_) {}
  }

  void _startLocationReporting() {
    _location.startPeriodicReporter(
      onPositionReady: (pos) async {
        reportCurrentPosition(pos);
      },
    );
  }

  void _startIncidentPolling() {
    _incidentPollTimer?.cancel();
    _fetchIncidents();
    _incidentPollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      _fetchIncidents();
    });
  }

  Future<void> _fetchIncidents() async {
    if (_isDisposed) return;

    // 1. Poll nearby candidate & accepted incidents
    try {
      final res = await _api.getNearbyIncidents();
      if (res.data is List) {
        final rawList = List<Map<String, dynamic>>.from(res.data as List);

        final acceptedList = rawList.where((i) {
          final st = i['status'] as String?;
          return st == 'accepted' || st == 'on_the_way' || st == 'reached_location';
        }).toList();

        final candidates = rawList.where((i) {
          final st = i['status'] as String?;
          return st == 'alert_received';
        }).toList();

        // Trigger Android system notification bar alert for newly arrived requests
        for (final item in candidates) {
          final incId = item['incident_id'] as String?;
          final dist = (item['approximate_distance_meters'] as num?)?.toInt() ?? 400;
          final address = item['address_hint'] as String?;
          if (incId != null && incId.isNotEmpty) {
            NotificationService.showEmergencyAlertIfNew(
              incidentId: incId,
              distanceMeters: dist,
              addressHint: address,
            );
          }
        }

        // Recover active assignment if missing from state
        Map<String, dynamic>? recoveredActive;
        if (state.activeIncident == null && acceptedList.isNotEmpty) {
          final accepted = acceptedList.first;
          final incId = accepted['incident_id'] as String;
          try {
            final detailsRes = await _api.getIncidentDetails(incId);
            recoveredActive = Map<String, dynamic>.from(detailsRes.data as Map);
            recoveredActive['response_status'] ??= accepted['status'] ?? 'accepted';
            await _storage.setActiveIncidentId(incId);
          } catch (_) {}
        }

        if (!_isDisposed) {
          state = state.copyWith(
            candidateIncidents: candidates,
            activeIncident: recoveredActive,
          );
        }
      }
    } catch (_) {}

    // 2. Refresh active dispatch details (live coordinates) while responding
    final currentActive = state.activeIncident;
    if (currentActive != null) {
      final activeId = currentActive['incident_id'] as String?;
      if (activeId != null && activeId.isNotEmpty) {
        try {
          final detailsRes = await _api.getIncidentDetails(activeId);
          final freshDetails = Map<String, dynamic>.from(detailsRes.data as Map);
          freshDetails['response_status'] ??= currentActive['response_status'] ?? 'accepted';
          if (!_isDisposed) {
            state = state.copyWith(activeIncident: freshDetails);
          }
        } on DioException catch (e) {
          if (e.response?.statusCode == 404 || e.response?.statusCode == 403) {
            // Incident ended or reached safety
            await _storage.setActiveIncidentId(null);
            if (!_isDisposed) {
              state = state.copyWith(clearActiveIncident: true);
            }
          }
        } catch (_) {}
      }
    }
  }

  /// Volunteer Accepts Nearby Incident
  Future<bool> acceptIncident(String incidentId) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      // 1. Send accept command to API
      await _api.acceptIncident(incidentId);

      // 2. Fetch authorized precise dispatch details
      final detailsRes = await _api.getIncidentDetails(incidentId);
      final details = Map<String, dynamic>.from(detailsRes.data as Map);
      details['response_status'] ??= 'accepted';

      await _storage.setActiveIncidentId(incidentId);

      if (!_isDisposed) {
        state = state.copyWith(
          isLoading: false,
          activeIncident: details,
          candidateIncidents: state.candidateIncidents
              .where((i) => i['incident_id'] != incidentId)
              .toList(),
        );
      }
      return true;
    } on DioException catch (e) {
      String msg = 'Failed to accept incident dispatch.';
      if (e.response?.data is Map && e.response?.data['detail'] != null) {
        msg = e.response?.data['detail'].toString() ?? msg;
      }
      if (!_isDisposed) {
        state = state.copyWith(isLoading: false, errorMessage: msg);
      }
      return false;
    } catch (e) {
      if (!_isDisposed) {
        state = state.copyWith(isLoading: false, errorMessage: 'Unexpected error: $e');
      }
      return false;
    }
  }

  /// Volunteer Declines Incident (simply won't help with this specific request)
  Future<void> declineIncident(String incidentId) async {
    try {
      await _api.declineIncident(incidentId);
      if (!_isDisposed) {
        state = state.copyWith(
          candidateIncidents: state.candidateIncidents
              .where((i) => i['incident_id'] != incidentId)
              .toList(),
        );
      }
    } catch (_) {}
  }

  /// Update volunteer milestone
  Future<bool> updateResponseStatus(String status) async {
    final active = state.activeIncident;
    if (active == null) return false;

    final incidentId = active['incident_id'] as String;
    state = state.copyWith(isLoading: true);

    try {
      await _api.updateResponseStatus(incidentId, status);
      if (status == 'assistance_completed') {
        await _storage.setActiveIncidentId(null);
        if (!_isDisposed) {
          state = state.copyWith(
            isLoading: false,
            clearActiveIncident: true,
          );
        }
        loadProfile(); // refresh response count
      } else {
        final updated = Map<String, dynamic>.from(active);
        updated['response_status'] = status;
        if (!_isDisposed) {
          state = state.copyWith(
            isLoading: false,
            activeIncident: updated,
          );
        }
      }
      return true;
    } catch (e) {
      if (!_isDisposed) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Failed to update milestone: $e',
        );
      }
      return false;
    }
  }

  /// Open Turn-by-Turn Navigation in Google Maps (Android 11+ resilient)
  Future<bool> openGoogleMapsNavigation(double lat, double lon) async {
    final candidates = <Uri>[
      Uri.parse('google.navigation:q=$lat,$lon&mode=d'),
      Uri.parse('geo:$lat,$lon?q=$lat,$lon'),
      Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lon'),
    ];

    for (final uri in candidates) {
      try {
        final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
        if (launched) return true;
      } catch (_) {}
    }

    // Fallback to in-app/default browser for HTTPS maps URL
    try {
      final webUri = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lon');
      return await launchUrl(webUri, mode: LaunchMode.platformDefault);
    } catch (_) {
      return false;
    }
  }

  /// Call Police Helpline 112
  Future<void> call112() async {
    final uri = Uri.parse('tel:112');
    try {
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched) {
        await launchUrl(uri, mode: LaunchMode.platformDefault);
      }
    } catch (_) {
      try {
        await launchUrl(uri);
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    _isDisposed = true;
    _location.stopPeriodicReporter();
    _incidentPollTimer?.cancel();
    super.dispose();
  }
}
