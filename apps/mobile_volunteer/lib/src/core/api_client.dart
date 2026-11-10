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
    if (kIsWeb) return 'http://localhost:8000/api/v1';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8000/api/v1';
    }
    return 'http://localhost:8000/api/v1';
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
            await _storage.clearAll();
          }
          return handler.next(error);
        },
      ),
    );
  }

  // Auth
  Future<Response> login(String identifier, String password) async {
    return await dio.post(
      ApiConstants.endpointLogin,
      data: {'identifier': identifier, 'password': password},
    );
  }

  // Volunteer Profile & Availability
  Future<Response> getVolunteerProfile() async {
    return await dio.get('/volunteer/me');
  }

  Future<Response> toggleAvailability(bool isAvailable, {String? reason}) async {
    return await dio.post(
      ApiConstants.endpointVolunteerAvailability,
      data: {'is_available': isAvailable, 'reason': reason},
    );
  }

  // Battery-aware Location Reporting
  Future<Response> updateLocation({
    required double latitude,
    required double longitude,
    required double accuracyMeters,
    double? speed,
    double? heading,
  }) async {
    return await dio.post(
      ApiConstants.endpointVolunteerLocation,
      data: {
        'latitude': latitude,
        'longitude': longitude,
        'accuracy_meters': accuracyMeters,
        'speed': speed,
        'heading': heading,
      },
    );
  }

  // Incident Operations
  Future<Response> getNearbyIncidents() async {
    return await dio.get(ApiConstants.endpointVolunteerIncidents);
  }

  Future<Response> acceptIncident(String incidentId) async {
    return await dio.post('/volunteer/incidents/$incidentId/accept');
  }

  Future<Response> declineIncident(String incidentId) async {
    return await dio.post('/volunteer/incidents/$incidentId/decline');
  }

  Future<Response> updateResponseStatus(String incidentId, String status) async {
    return await dio.patch(
      '/volunteer/incidents/$incidentId/status',
      data: {'status': status},
    );
  }

  Future<Response> getIncidentDetails(String incidentId) async {
    return await dio.get('/volunteer/incidents/$incidentId/details');
  }
}
