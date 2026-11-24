import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

class LocationService {
  Timer? _locationTimer;
  Position? _cachedPosition;

  Position? get cachedPosition => _cachedPosition;

  Future<bool> isLocationEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  Future<LocationPermission> checkPermission() async {
    return await Geolocator.checkPermission();
  }

  Future<LocationPermission> requestPermission() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission;
  }

  /// Ensure permissions are requested early in the foreground
  Future<bool> ensurePermission() async {
    final enabled = await isLocationEnabled();
    if (!enabled) return false;

    LocationPermission permission = await checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await requestPermission();
    }
    final granted = permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
    if (granted) {
      warmUpLocation();
    }
    return granted;
  }

  /// Pre-warm GPS fix in background
  Future<Position?> warmUpLocation() async {
    try {
      final last = await Geolocator.getLastKnownPosition();
      if (last != null) _cachedPosition = last;
      final cur = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
        timeLimit: const Duration(seconds: 3),
      );
      _cachedPosition = cur;
      return cur;
    } catch (_) {
      return _cachedPosition;
    }
  }

  /// Rapid current GPS fix (<1s) with cached fallback
  Future<Position?> getCurrentPosition({bool fastOnly = false}) async {
    final enabled = await isLocationEnabled();
    if (!enabled) return _cachedPosition;

    var permission = await checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await requestPermission();
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return _cachedPosition;
      }
    }

    if (fastOnly && _cachedPosition != null) {
      return _cachedPosition;
    }

    // Fast last known hardware fix (<20ms)
    try {
      final lastKnown = await Geolocator.getLastKnownPosition();
      if (lastKnown != null) {
        _cachedPosition = lastKnown;
      }
    } catch (_) {}

    // Rapid network/cell/GPS fix with 2-second timeout
    try {
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
        timeLimit: const Duration(seconds: 2),
      );
      _cachedPosition = pos;
      return pos;
    } catch (_) {
      return _cachedPosition;
    }
  }

  /// Battery-aware periodic position reporting while volunteer is AVAILABLE
  void startPeriodicReporter({
    required Function(Position position) onPositionReady,
    Duration interval = const Duration(minutes: 1),
  }) {
    stopPeriodicReporter();

    // Trigger immediate first fix
    getCurrentPosition(fastOnly: false).then((pos) {
      if (pos != null) {
        _cachedPosition = pos;
        onPositionReady(pos);
      }
    });

    // Schedule periodic update
    _locationTimer = Timer.periodic(interval, (_) async {
      final pos = await getCurrentPosition(fastOnly: false);
      if (pos != null) {
        _cachedPosition = pos;
        onPositionReady(pos);
      }
    });
  }

  /// Stop location updates immediately (preserves privacy while offline)
  void stopPeriodicReporter() {
    _locationTimer?.cancel();
    _locationTimer = null;
  }
}
