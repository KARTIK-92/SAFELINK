import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

class LocationService {
  Timer? _locationTimer;

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

  Future<Position?> getCurrentPosition() async {
    final enabled = await isLocationEnabled();
    if (!enabled) return null;

    var permission = await checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await requestPermission();
      if (permission == LocationPermission.denied) return null;
    }
    if (permission == LocationPermission.deniedForever) return null;

    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
        timeLimit: const Duration(seconds: 8),
      );
    } catch (_) {
      return await Geolocator.getLastKnownPosition();
    }
  }

  /// Battery-aware periodic position reporting while volunteer is AVAILABLE
  void startPeriodicReporter({
    required Function(Position position) onPositionReady,
    Duration interval = const Duration(minutes: 3),
  }) {
    stopPeriodicReporter();

    // Trigger immediate first fix
    getCurrentPosition().then((pos) {
      if (pos != null) onPositionReady(pos);
    });

    // Schedule background interval
    _locationTimer = Timer.periodic(interval, (_) async {
      final pos = await getCurrentPosition();
      if (pos != null) {
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
