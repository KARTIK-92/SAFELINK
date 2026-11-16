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

  static String normalizeUrl(String input) {
    var clean = input.trim();
    if (clean.endsWith('/')) {
      clean = clean.substring(0, clean.length - 1);
    }
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://$clean';
    }
    if (!clean.endsWith('/api/v1')) {
      clean = '$clean/api/v1';
    }
    return clean;
  }

  static String get defaultBaseUrl {
    const envUrl = String.fromEnvironment('API_URL');
    if (envUrl.isNotEmpty) return normalizeUrl(envUrl);
    if (kIsWeb) return 'http://localhost:8000/api/v1';
    return 'https://safelink-api.onrender.com/api/v1';
  }

  Future<String> getEffectiveBaseUrl() async {
    final customUrl = await _storage.getBaseUrl();
    if (customUrl != null && customUrl.trim().isNotEmpty) {
      return customUrl.trim();
    }
    return defaultBaseUrl;
  }

  ApiClient({required StorageService storage, String? baseUrl})
      : _storage = storage {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl ?? defaultBaseUrl,
        connectTimeout: const Duration(seconds: 12),
        receiveTimeout: const Duration(seconds: 12),
        contentType: 'application/json',
        responseType: ResponseType.json,
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final customUrl = await _storage.getBaseUrl();
          if (customUrl != null && customUrl.trim().isNotEmpty) {
            options.baseUrl = customUrl.trim();
          }
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

  Future<String> resolveAndSetBaseUrl(String input) async {
    var clean = input.trim();
    if (clean.endsWith('/')) {
      clean = clean.substring(0, clean.length - 1);
    }
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://$clean';
    }

    // If input is web portal URL, probe /api/config for configured API_URL
    if (!clean.endsWith('/api/v1')) {
      try {
        final probeDio = Dio(BaseOptions(connectTimeout: const Duration(seconds: 5)));
        final configRes = await probeDio.get('$clean/api/config');
        if (configRes.statusCode == 200 && configRes.data is Map && configRes.data['api_url'] != null) {
          clean = configRes.data['api_url'].toString();
        }
      } catch (_) {
        // Fall back to appending /api/v1
      }
    }

    final normalized = normalizeUrl(clean);
    await _storage.setBaseUrl(normalized);
    dio.options.baseUrl = normalized;
    return normalized;
  }

  Future<Map<String, dynamic>> testConnection([String? candidateUrl]) async {
    final target = (candidateUrl != null && candidateUrl.trim().isNotEmpty)
        ? normalizeUrl(candidateUrl.trim())
        : await getEffectiveBaseUrl();

    try {
      final probeDio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 6),
        receiveTimeout: const Duration(seconds: 6),
      ));
      final res = await probeDio.get('$target/health');
      if (res.statusCode == 200) {
        return {'success': true, 'data': res.data, 'url': target};
      }
      return {'success': false, 'error': 'Server returned HTTP ${res.statusCode}', 'url': target};
    } catch (e) {
      return {'success': false, 'error': e.toString(), 'url': target};
    }
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
