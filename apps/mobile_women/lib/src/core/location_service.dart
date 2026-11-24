import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

class LocationService {
  StreamSubscription<Position>? _positionStreamSub;
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

  /// Ensure location permissions are granted early in the foreground
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
      // Warm up position cache immediately
      warmUpLocation();
    }
    return granted;
  }

  /// Pre-warm GPS fix in background without blocking UI
  Future<Position?> warmUpLocation() async {
    try {
      final lastKnown = await Geolocator.getLastKnownPosition();
      if (lastKnown != null) {
        _cachedPosition = lastKnown;
      }
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
        timeLimit: const Duration(seconds: 3),
      );
      _cachedPosition = pos;
      return pos;
    } catch (_) {
      return _cachedPosition;
    }
  }

  /// Rapid current GPS fix (<1s) with cached fallback
  Future<Position?> getCurrentPosition({bool fastOnly = false}) async {
    final enabled = await isLocationEnabled();
    if (!enabled) {
      return _cachedPosition;
    }

    var permission = await checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await requestPermission();
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return _cachedPosition;
      }
    }

    // Fast check: return cached position immediately if requested
    if (fastOnly && _cachedPosition != null) {
      return _cachedPosition;
    }

    // Check last known hardware position (<20ms)
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

  /// Stream position breadcrumbs during active emergency ONLY
  void startEmergencyLocationStream({
    required Function(Position position) onLocationUpdate,
    int intervalSeconds = 4,
  }) {
    stopEmergencyLocationStream();

    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 5, // report update every 5 meters moved
    );

    _positionStreamSub = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen((position) {
      _cachedPosition = position;
      onLocationUpdate(position);
    });
  }

  /// Halts location streaming immediately (Zero 24/7 background tracking)
  void stopEmergencyLocationStream() {
    _positionStreamSub?.cancel();
    _positionStreamSub = null;
  }
}
