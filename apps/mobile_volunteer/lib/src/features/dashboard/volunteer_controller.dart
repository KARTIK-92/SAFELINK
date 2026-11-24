import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/api_client.dart';
import '../../core/location_service.dart';
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
    this.isAvailable = false,
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
    Position? lastPosition,
    String? errorMessage,
  }) {
    return VolunteerState(
      isAvailable: isAvailable ?? this.isAvailable,
      isLoading: isLoading ?? this.isLoading,
      profile: profile ?? this.profile,
      candidateIncidents: candidateIncidents ?? this.candidateIncidents,
      activeIncident: activeIncident,
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

  VolunteerController({
    required ApiClient api,
    required LocationService location,
    required StorageService storage,
  })  : _api = api,
        _location = location,
        _storage = storage,
        super(const VolunteerState(isLoading: true)) {
    loadProfile();
  }

  Future<void> loadProfile() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _api.getVolunteerProfile();
      final data = res.data as Map<String, dynamic>;
      final isAvail = data['is_available'] as bool? ?? false;

      state = state.copyWith(
        isAvailable: isAvail,
        isLoading: false,
        profile: data,
      );

      if (isAvail) {
        _startLocationReporting();
        _startIncidentPolling();
      }
    } catch (_) {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> toggleAvailability(bool isAvailable) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      await _api.toggleAvailability(isAvailable);
      state = state.copyWith(
        isAvailable: isAvailable,
        isLoading: false,
      );

      if (isAvailable) {
        _startLocationReporting();
        _startIncidentPolling();
      } else {
        _location.stopPeriodicReporter();
        _incidentPollTimer?.cancel();
        _incidentPollTimer = null;
        state = state.copyWith(candidateIncidents: []);
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to update availability status: $e',
      );
    }
  }

  Future<void> reportCurrentPosition(Position pos) async {
    state = state.copyWith(lastPosition: pos);
    if (!state.isAvailable) return;
    try {
      await _api.updateLocation(
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracyMeters: pos.accuracy,
        speed: pos.speed,
        heading: pos.heading,
      );
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
    if (!state.isAvailable) return;
    try {
      final res = await _api.getNearbyIncidents();
      if (res.data is List) {
        final list = List<Map<String, dynamic>>.from(res.data as List);
        state = state.copyWith(candidateIncidents: list);
      }
    } catch (_) {}
  }

  /// Volunteer Accepts Nearby Incident
  Future<bool> acceptIncident(String incidentId) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      // 1. Send accept command to API (enforces 3 responder limit)
      await _api.acceptIncident(incidentId);

      // 2. Fetch authorized precise dispatch details (now unlocked)
      final detailsRes = await _api.getIncidentDetails(incidentId);
      final details = detailsRes.data as Map<String, dynamic>;

      await _storage.setActiveIncidentId(incidentId);

      state = state.copyWith(
        isLoading: false,
        activeIncident: details,
        candidateIncidents: state.candidateIncidents
            .where((i) => i['incident_id'] != incidentId)
            .toList(),
      );
      return true;
    } on DioException catch (e) {
      String msg = 'Failed to accept incident dispatch.';
      if (e.response?.data is Map && e.response?.data['detail'] != null) {
        msg = e.response?.data['detail'].toString() ?? msg;
      }
      state = state.copyWith(isLoading: false, errorMessage: msg);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Unexpected error: $e');
      return false;
    }
  }

  /// Volunteer Declines Incident
  Future<void> declineIncident(String incidentId) async {
    try {
      await _api.declineIncident(incidentId);
      state = state.copyWith(
        candidateIncidents: state.candidateIncidents
            .where((i) => i['incident_id'] != incidentId)
            .toList(),
      );
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
        state = state.copyWith(
          isLoading: false,
          activeIncident: null,
        );
        loadProfile(); // refresh response count
      } else {
        final updated = Map<String, dynamic>.from(active);
        updated['response_status'] = status;
        state = state.copyWith(
          isLoading: false,
          activeIncident: updated,
        );
      }
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to update milestone: $e',
      );
      return false;
    }
  }

  /// Open Navigation in Google Maps
  Future<void> openGoogleMapsNavigation(double lat, double lon) async {
    final uri = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lon');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  /// Call Police Helpline 112
  Future<void> call112() async {
    final uri = Uri.parse('tel:112');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  void dispose() {
    _location.stopPeriodicReporter();
    _incidentPollTimer?.cancel();
    super.dispose();
  }
}
