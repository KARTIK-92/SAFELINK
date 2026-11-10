import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

class LocationService {
  StreamSubscription<Position>? _positionStreamSub;

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

  /// Get rapid current GPS fix with fallback
  Future<Position?> getCurrentPosition() async {
    final enabled = await isLocationEnabled();
    if (!enabled) {
      return null;
    }

    var permission = await checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await requestPermission();
      if (permission == LocationPermission.denied) {
        return null;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return null;
    }

    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 8),
      );
    } catch (_) {
      // Return last known position as fast fallback if device GPS lock takes too long
      return await Geolocator.getLastKnownPosition();
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
      onLocationUpdate(position);
    });
  }

  /// Halts location streaming immediately (Zero 24/7 background tracking)
  void stopEmergencyLocationStream() {
    _positionStreamSub?.cancel();
    _positionStreamSub = null;
  }
}
