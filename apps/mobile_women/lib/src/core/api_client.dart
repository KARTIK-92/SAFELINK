import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_dart/shared_dart.dart';
import 'storage_service.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return ApiClient(storage: storage);
});

class ApiClient {
  final StorageService _storage;
  late final Dio dio;

  static String get defaultBaseUrl {
    const envUrl = String.fromEnvironment('API_URL');
    if (envUrl.isNotEmpty) return envUrl;
    if (kIsWeb) return 'http://localhost:8000/api/v1';
    // Use production deployed backend API on Render; falls back gracefully
    return 'https://safelink-api.onrender.com/api/v1';
  }

  ApiClient({required StorageService storage, String? baseUrl})
      : _storage = storage {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl ?? defaultBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        contentType: 'application/json',
        responseType: ResponseType.json,
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            // Token expired or invalid
            await _storage.clearAll();
          }
          return handler.next(error);
        },
      ),
    );
  }

  // Auth Endpoints
  Future<Response> login(String identifier, String password) async {
    return await dio.post(
      ApiConstants.endpointLogin,
      data: {'identifier': identifier, 'password': password},
    );
  }

  // SOS Endpoints
  Future<Response> startSOS({
    required double latitude,
    required double longitude,
    required double accuracyMeters,
    String? addressHint,
  }) async {
    return await dio.post(
      ApiConstants.endpointSosStart,
      data: {
        'latitude': latitude,
        'longitude': longitude,
        'accuracy_meters': accuracyMeters,
        'address_hint': addressHint,
      },
    );
  }

  Future<Response> sendLocationUpdate({
    required String incidentId,
    required double latitude,
    required double longitude,
    required double accuracyMeters,
    double? batteryLevel,
  }) async {
    return await dio.post(
      ApiConstants.endpointSosLocation,
      data: {
        'incident_id': incidentId,
        'latitude': latitude,
        'longitude': longitude,
        'accuracy_meters': accuracyMeters,
        'battery_level': batteryLevel,
      },
    );
  }

  Future<Response> cancelSOS({
    required String incidentId,
    String? reason,
  }) async {
    return await dio.post(
      ApiConstants.endpointSosCancel,
      data: {
        'incident_id': incidentId,
        'reason': reason ?? 'User marked self safe',
      },
    );
  }

  Future<Response> getActiveSOS() async {
    return await dio.get('/sos/active');
  }

  Future<Response> getSOSStatus(String incidentId) async {
    return await dio.get('/sos/$incidentId/status');
  }

  Future<Response> getSOSResponders(String incidentId) async {
    return await dio.get('/sos/$incidentId/responders');
  }

  Future<Response> getEmergencyContacts() async {
    return await dio.get('/contacts');
  }
}
