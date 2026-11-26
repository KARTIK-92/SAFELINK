import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/api_client.dart';
import '../../core/location_service.dart';
import '../../core/storage_service.dart';

class EmergencyState {
  final bool isActive;
  final bool isLoading;
  final String? incidentId;
  final String? trackingToken;
  final String? trackingUrl;
  final int contactsNotified;
  final int volunteersNotified;
  final List<Map<String, dynamic>> responders;
  final Position? lastPosition;
  final DateTime? startedAt;
  final String? errorMessage;

  const EmergencyState({
    this.isActive = false,
    this.isLoading = false,
    this.incidentId,
    this.trackingToken,
    this.trackingUrl,
    this.contactsNotified = 0,
    this.volunteersNotified = 0,
    this.responders = const [],
    this.lastPosition,
    this.startedAt,
    this.errorMessage,
  });

  EmergencyState copyWith({
    bool? isActive,
    bool? isLoading,
    String? incidentId,
    String? trackingToken,
    String? trackingUrl,
    int? contactsNotified,
    int? volunteersNotified,
    List<Map<String, dynamic>>? responders,
    Position? lastPosition,
    DateTime? startedAt,
    String? errorMessage,
  }) {
    return EmergencyState(
      isActive: isActive ?? this.isActive,
      isLoading: isLoading ?? this.isLoading,
      incidentId: incidentId ?? this.incidentId,
      trackingToken: trackingToken ?? this.trackingToken,
      trackingUrl: trackingUrl ?? this.trackingUrl,
      contactsNotified: contactsNotified ?? this.contactsNotified,
      volunteersNotified: volunteersNotified ?? this.volunteersNotified,
      responders: responders ?? this.responders,
      lastPosition: lastPosition ?? this.lastPosition,
      startedAt: startedAt ?? this.startedAt,
      errorMessage: errorMessage,
    );
  }
}

final emergencyControllerProvider =
    StateNotifierProvider<EmergencyController, EmergencyState>((ref) {
  final api = ref.watch(apiClientProvider);
  final location = ref.watch(locationServiceProvider);
  final storage = ref.watch(storageServiceProvider);
  return EmergencyController(api: api, location: location, storage: storage);
});

class EmergencyController extends StateNotifier<EmergencyState> {
  final ApiClient _api;
  final LocationService _location;
  final StorageService _storage;

  Timer? _statusPollTimer;

  EmergencyController({
    required ApiClient api,
    required LocationService location,
    required StorageService storage,
  })  : _api = api,
        _location = location,
        _storage = storage,
        super(const EmergencyState()) {
    _api.preWarmBackend();
    checkActiveEmergency();
    _warmUpLocation();
  }

  String _normalizeTrackingUrl(String? rawUrl, String? token) {
    final apiRoot = _api.dio.options.baseUrl.replaceAll(RegExp(r'/api/v1/?$'), '');
    final publicRoot = (apiRoot.contains('localhost') || apiRoot.contains('127.0.0.1'))
        ? 'https://safelink-api-zuiu.onrender.com'
        : apiRoot;

    if (rawUrl != null && rawUrl.trim().isNotEmpty) {
      final clean = rawUrl.trim();
      if (clean.contains('localhost') || clean.contains('127.0.0.1')) {
        final uri = Uri.tryParse(clean);
        if (uri != null && uri.path.isNotEmpty) {
          return '$publicRoot${uri.path}';
        }
        if (token != null && token.isNotEmpty) {
          return '$publicRoot/t/$token';
        }
      }
      return clean;
    }

    if (token != null && token.isNotEmpty) {
      return '$publicRoot/t/$token';
    }
    return '';
  }

  void _warmUpLocation() {
    _location.warmUpLocation().then((pos) {
      if (pos != null) {
        state = state.copyWith(lastPosition: pos);
      }
    });
  }

  void updateCachedPosition(Position pos) {
    state = state.copyWith(lastPosition: pos);
  }

  /// Check if user has an existing active emergency on server
  Future<void> checkActiveEmergency() async {
    try {
      final token = await _storage.getAccessToken();
      if (token == null || token.isEmpty) return;

      final res = await _api.getActiveSOS();
      final data = res.data as Map<String, dynamic>;
      if (data['active'] == true) {
        final id = data['incident_id'] as String;
        final storedUrl = await _storage.getActiveTrackingUrl();
        final serverUrl = data['tracking_url'] as String?;
        final rawToken = data['tracking_token'] as String?;
        final resolvedUrl = _normalizeTrackingUrl(serverUrl ?? storedUrl, rawToken);
        if (resolvedUrl.isNotEmpty) {
          await _storage.setActiveTrackingUrl(resolvedUrl);
        }

        state = state.copyWith(
          isActive: true,
          incidentId: id,
          trackingUrl: resolvedUrl.isNotEmpty ? resolvedUrl : state.trackingUrl,
          startedAt: DateTime.tryParse(data['started_at'] as String? ?? ''),
        );
        _startLocationStreaming(id);
        _startStatusPolling(id);
      } else {
        await _storage.setActiveIncidentId(null);
        await _storage.setActiveTrackingUrl(null);
      }
    } catch (_) {
      // Ignore network errors on initial passive check
    }
  }

  /// Trigger Rapid Emergency Alert (<1s latency)
  Future<bool> startEmergency() async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    // 1. Obtain instant GPS position (pre-warmed or fast lookup)
    Position? position = state.lastPosition ?? _location.cachedPosition;
    if (position == null) {
      position = await _location.getCurrentPosition(fastOnly: true);
    }
    if (position == null) {
      position = await _location.getCurrentPosition(fastOnly: false);
    }

    // Default fallback only if hardware completely lacks GPS
    position ??= Position(
      latitude: 12.9716,
      longitude: 77.5946,
      timestamp: DateTime.now(),
      accuracy: 10.0,
      altitude: 0.0,
      altitudeAccuracy: 0.0,
      heading: 0.0,
      headingAccuracy: 0.0,
      speed: 0.0,
      speedAccuracy: 0.0,
    );

    try {
      final res = await _api.startSOS(
        latitude: position.latitude,
        longitude: position.longitude,
        accuracyMeters: position.accuracy,
        addressHint: 'Mobile Emergency Trigger',
      );

      final data = res.data as Map<String, dynamic>;
      final incidentId = data['incident_id'] as String;
      final trackingToken = data['tracking_token'] as String?;
      final trackingUrl = _normalizeTrackingUrl(data['tracking_url'] as String?, trackingToken);
      final contactsCount = data['contacts_notified_count'] as int? ?? 0;
      final volunteersCount = data['volunteers_notified_count'] as int? ?? 0;

      await _storage.setActiveIncidentId(incidentId);
      if (trackingUrl.isNotEmpty) {
        await _storage.setActiveTrackingUrl(trackingUrl);
      }

      state = state.copyWith(
        isActive: true,
        isLoading: false,
        incidentId: incidentId,
        trackingToken: trackingToken,
        trackingUrl: trackingUrl,
        contactsNotified: contactsCount,
        volunteersNotified: volunteersCount,
        lastPosition: position,
        startedAt: DateTime.now(),
      );

      // Start continuous location streaming & status updates
      _startLocationStreaming(incidentId);
      _startStatusPolling(incidentId);
      return true;
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        // Concurrency check: already active
        state = state.copyWith(
          isActive: true,
          isLoading: false,
          errorMessage: 'An emergency alert is already active for your account.',
        );
        checkActiveEmergency();
        return true;
      }
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Emergency alert failed to dispatch. Call 112 immediately.',
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Emergency alert failed: $e. Call 112 immediately.',
      );
      return false;
    }
  }

  /// Continuous GPS breadcrumbs streaming during emergency
  void _startLocationStreaming(String incidentId) {
    _location.startEmergencyLocationStream(
      onLocationUpdate: (pos) async {
        state = state.copyWith(lastPosition: pos);
        try {
          await _api.sendLocationUpdate(
            incidentId: incidentId,
            latitude: pos.latitude,
            longitude: pos.longitude,
            accuracyMeters: pos.accuracy,
          );
        } catch (_) {}
      },
    );
  }

  /// Poll assigned responders progress
  void _startStatusPolling(String incidentId) {
    _statusPollTimer?.cancel();
    _statusPollTimer = Timer.periodic(const Duration(seconds: 4), (_) async {
      if (!state.isActive) {
        _statusPollTimer?.cancel();
        return;
      }
      try {
        final res = await _api.getSOSResponders(incidentId);
        if (res.data is List) {
          final list = List<Map<String, dynamic>>.from(res.data as List);
          state = state.copyWith(responders: list);
        }
      } catch (_) {}
    });
  }

  /// Safely cancel emergency
  Future<bool> cancelEmergency([String reason = 'User marked safe']) async {
    final incidentId = state.incidentId;
    if (incidentId == null) return false;

    state = state.copyWith(isLoading: true);

    // Stop location updates & polling immediately
    _location.stopEmergencyLocationStream();
    _statusPollTimer?.cancel();
    _statusPollTimer = null;

    try {
      await _api.cancelSOS(incidentId: incidentId, reason: reason);
    } catch (_) {}

    await _storage.setActiveIncidentId(null);
    await _storage.setActiveTrackingUrl(null);

    state = const EmergencyState(
      isActive: false,
      isLoading: false,
    );
    return true;
  }

  /// Direct Emergency Phone Call 112
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
    _location.stopEmergencyLocationStream();
    _statusPollTimer?.cancel();
    super.dispose();
  }
}
