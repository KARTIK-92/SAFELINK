import 'dart:typed_data';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'storage_service.dart';

class NotificationService {
  static const String radarChannelId = 'safelink_radar_channel';
  static const String emergencyChannelId = 'safelink_emergency_alert_v2';

  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  static bool _initialized = false;

  static Future<void> ensureInitialized() async {
    if (_initialized) return;

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);
    await _plugin.initialize(initSettings);

    final androidPlugin = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();

    if (androidPlugin != null) {
      // Quiet low-importance channel for ongoing background radar service
      const radarChannel = AndroidNotificationChannel(
        radarChannelId,
        'SafeLink Radar Background Service',
        description: 'Keeps SafeLink alert listener active for nearby SOS signals.',
        importance: Importance.low,
        playSound: false,
        enableVibration: false,
      );
      await androidPlugin.createNotificationChannel(radarChannel);

      // Urgent max-priority channel for incoming SOS alerts in notification bar
      final emergencyChannel = AndroidNotificationChannel(
        emergencyChannelId,
        'Emergency SOS Help Alerts',
        description: 'High-priority alerts when a nearby woman activates SOS.',
        importance: Importance.max,
        playSound: true,
        enableVibration: true,
        vibrationPattern: Int64List.fromList([0, 600, 250, 600, 250, 900]),
      );
      await androidPlugin.createNotificationChannel(emergencyChannel);
    }

    _initialized = true;
  }

  static Future<bool> requestPermission() async {
    await ensureInitialized();
    final androidPlugin = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    if (androidPlugin != null) {
      return await androidPlugin.requestNotificationsPermission() ?? true;
    }
    return true;
  }

  /// Display high-priority Android Notification Bar alert once per incident ID
  static Future<void> showEmergencyAlertIfNew({
    required String incidentId,
    required int distanceMeters,
    String? addressHint,
  }) async {
    await ensureInitialized();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.reload();
      final notified = prefs.getStringList(StorageService.keyNotifiedIncidentIds) ?? [];
      if (notified.contains(incidentId)) {
        return;
      }
      final updated = [...notified, incidentId];
      if (updated.length > 50) {
        updated.removeRange(0, updated.length - 50);
      }
      await prefs.setStringList(StorageService.keyNotifiedIncidentIds, updated);
    } catch (_) {}

    final locationNote =
        (addressHint != null && addressHint.trim().isNotEmpty)
            ? addressHint.trim()
            : 'Nearby location';

    final androidDetails = AndroidNotificationDetails(
      emergencyChannelId,
      'Emergency SOS Help Alerts',
      channelDescription: 'High-priority alerts when a nearby woman activates SOS.',
      importance: Importance.max,
      priority: Priority.max,
      category: AndroidNotificationCategory.alarm,
      visibility: NotificationVisibility.public,
      playSound: true,
      enableVibration: true,
      vibrationPattern: Int64List.fromList([0, 600, 250, 600, 250, 900]),
      fullScreenIntent: true,
      ticker: 'EMERGENCY SOS NEARBY',
    );

    final details = NotificationDetails(android: androidDetails);
    final notifId = incidentId.hashCode & 0x7FFFFFFF;

    await _plugin.show(
      notifId == 888 ? 889 : notifId,
      'EMERGENCY SOS (~${distanceMeters}m away)',
      'Someone needs immediate help near $locationNote. Tap to open and accept or decline.',
      details,
    );
  }
}
