import 'dart:async';
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
  VoidCallback? onSessionExpired;
  Completer<String?>? _refreshCompleter;

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
    return 'https://safelink-api-zuiu.onrender.com/api/v1';
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
        connectTimeout: const Duration(seconds: 25),
        receiveTimeout: const Duration(seconds: 25),
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
          final status = error.response?.statusCode;
          final path = error.requestOptions.path;
          final alreadyRetried = error.requestOptions.extra['_retried'] == true;

          if (status == 401 &&
              !alreadyRetried &&
              !path.contains(ApiConstants.endpointLogin) &&
              !path.contains(ApiConstants.endpointRefresh)) {
            final newToken = await _refreshAccessToken(error.requestOptions.baseUrl);
            if (newToken != null && newToken.isNotEmpty) {
              final opts = error.requestOptions;
              opts.headers['Authorization'] = 'Bearer $newToken';
              opts.extra['_retried'] = true;
              try {
                final retryRes = await dio.fetch(opts);
                return handler.resolve(retryRes);
              } on DioException catch (retryErr) {
                return handler.next(retryErr);
              }
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<String?> _refreshAccessToken(String baseUrl) async {
    if (_refreshCompleter != null) {
      return await _refreshCompleter!.future;
    }
    _refreshCompleter = Completer<String?>();
    try {
      final refreshToken = await _storage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        // Legacy session without refresh token -> clear expired access token cleanly
        await _storage.clearAll();
        onSessionExpired?.call();
        _refreshCompleter!.complete(null);
        return null;
      }

      final refreshDio = Dio(BaseOptions(
        baseUrl: baseUrl.isNotEmpty ? baseUrl : defaultBaseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        contentType: 'application/json',
      ));

      final res = await refreshDio.post(
        ApiConstants.endpointRefresh,
        data: {'refresh_token': refreshToken},
      );

      final data = res.data as Map<String, dynamic>;
      final newAccess = data['access_token'] as String?;
      final newRefresh = data['refresh_token'] as String?;

      if (newAccess != null && newAccess.isNotEmpty) {
        await _storage.setAccessToken(newAccess);
        if (newRefresh != null && newRefresh.isNotEmpty) {
          await _storage.setRefreshToken(newRefresh);
        }
        _refreshCompleter!.complete(newAccess);
        return newAccess;
      }

      _refreshCompleter!.complete(null);
      return null;
    } on DioException catch (e) {
      final code = e.response?.statusCode;
      // Clear local session ONLY when backend explicitly rejects refresh token (401/403)
      if (code == 401 || code == 403) {
        await _storage.clearAll();
        onSessionExpired?.call();
      }
      _refreshCompleter!.complete(null);
      return null;
    } catch (_) {
      _refreshCompleter!.complete(null);
      return null;
    } finally {
      _refreshCompleter = null;
    }
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

  Future<Response> createEmergencyContact({
    required String name,
    required String phone,
    required String relationship,
    String? email,
  }) async {
    return await dio.post(
      '/contacts',
      data: {
        'name': name,
        'phone': phone,
        'relationship': relationship,
        if (email != null && email.isNotEmpty) 'email': email,
        'preferred_channels': ['sms', 'whatsapp'],
        'priority_order': 1,
      },
    );
  }

  Future<Response> deleteEmergencyContact(String contactId) async {
    return await dio.delete('/contacts/$contactId');
  }

  Future<void> preWarmBackend() async {
    try {
      await dio.get('/health');
    } catch (_) {}
  }
}
