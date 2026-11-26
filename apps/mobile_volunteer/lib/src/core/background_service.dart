import 'dart:async';
import 'dart:ui';
import 'package:dio/dio.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:shared_dart/shared_dart.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';
import 'notification_service.dart';
import 'storage_service.dart';

class VolunteerBackgroundService {
  static bool _configured = false;

  static Future<void> initialize() async {
    await NotificationService.ensureInitialized();
    if (_configured) return;

    final service = FlutterBackgroundService();
    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onVolunteerBackgroundStart,
        autoStart: false,
        autoStartOnBoot: false,
        isForegroundMode: true,
        notificationChannelId: NotificationService.radarChannelId,
        initialNotificationTitle: 'SafeLink Responder Active',
        initialNotificationContent: 'Listening for nearby emergency alerts',
        foregroundServiceNotificationId: 888,
        foregroundServiceTypes: [AndroidForegroundType.dataSync],
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: onVolunteerBackgroundStart,
        onBackground: onIosBackground,
      ),
    );
    _configured = true;
  }

  static Future<void> startIfAuthenticated() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(StorageService.keyAccessToken);
      final refresh = prefs.getString(StorageService.keyRefreshToken);
      if ((token == null || token.isEmpty) &&
          (refresh == null || refresh.isEmpty)) {
        return;
      }

      await initialize();
      final service = FlutterBackgroundService();
      final running = await service.isRunning();
      if (!running) {
        await service.startService();
      }
    } catch (_) {}
  }

  static Future<void> stop() async {
    try {
      final service = FlutterBackgroundService();
      if (await service.isRunning()) {
        service.invoke('stopService');
      }
    } catch (_) {}
  }
}

@pragma('vm:entry-point')
Future<bool> onIosBackground(ServiceInstance service) async => true;

@pragma('vm:entry-point')
void onVolunteerBackgroundStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();
  await NotificationService.ensureInitialized();

  Timer? pollTimer;

  service.on('stopService').listen((_) {
    pollTimer?.cancel();
    service.stopSelf();
  });

  Future<void> pollAlerts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.reload();

      String? token = prefs.getString(StorageService.keyAccessToken);
      String? refreshToken = prefs.getString(StorageService.keyRefreshToken);
      if ((token == null || token.isEmpty) &&
          (refreshToken == null || refreshToken.isEmpty)) {
        return;
      }

      final storedBaseUrl = prefs.getString(StorageService.keyBaseUrl);
      final baseUrl = (storedBaseUrl != null && storedBaseUrl.trim().isNotEmpty)
          ? storedBaseUrl.trim()
          : ApiClient.defaultBaseUrl;

      final dio = Dio(BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        contentType: 'application/json',
      ));

      Response? res;
      try {
        res = await dio.get(
          ApiConstants.endpointVolunteerIncidents,
          options: Options(headers: {'Authorization': 'Bearer ${token ?? ''}'}),
        );
      } on DioException catch (e) {
        if (e.response?.statusCode == 401 &&
            refreshToken != null &&
            refreshToken.isNotEmpty) {
          try {
            final refreshRes = await dio.post(
              ApiConstants.endpointRefresh,
              data: {'refresh_token': refreshToken},
            );
            final data = refreshRes.data as Map<String, dynamic>;
            final newAccess = data['access_token'] as String?;
            final newRefresh = data['refresh_token'] as String?;
            if (newAccess != null && newAccess.isNotEmpty) {
              await prefs.setString(StorageService.keyAccessToken, newAccess);
              if (newRefresh != null && newRefresh.isNotEmpty) {
                await prefs.setString(StorageService.keyRefreshToken, newRefresh);
              }
              res = await dio.get(
                ApiConstants.endpointVolunteerIncidents,
                options: Options(headers: {'Authorization': 'Bearer $newAccess'}),
              );
            }
          } catch (_) {}
        }
      }

      if (res != null && res.data is List) {
        final list = List<Map<String, dynamic>>.from(res.data as List);
        for (final item in list) {
          final status = item['status'] as String?;
          if (status == 'alert_received') {
            final incId = item['incident_id'] as String?;
            final dist = (item['approximate_distance_meters'] as num?)?.toInt() ?? 400;
            final addressHint = item['address_hint'] as String?;
            if (incId != null && incId.isNotEmpty) {
              await NotificationService.showEmergencyAlertIfNew(
                incidentId: incId,
                distanceMeters: dist,
                addressHint: addressHint,
              );
            }
          }
        }
      }
    } catch (_) {}
  }

  // Trigger initial background poll immediately, then every 5 seconds
  await pollAlerts();
  pollTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
    await pollAlerts();
  });
}
