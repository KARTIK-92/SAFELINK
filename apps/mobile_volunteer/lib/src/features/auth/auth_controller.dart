import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../core/background_service.dart';
import '../../core/storage_service.dart';

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final Map<String, dynamic>? user;
  final String? errorMessage;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.user,
    this.errorMessage,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    Map<String, dynamic>? user,
    String? errorMessage,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      errorMessage: errorMessage,
    );
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  final storage = ref.watch(storageServiceProvider);
  final api = ref.watch(apiClientProvider);
  return AuthController(storage: storage, api: api);
});

class AuthController extends StateNotifier<AuthState> {
  final StorageService _storage;
  final ApiClient _api;

  AuthController({required StorageService storage, required ApiClient api})
      : _storage = storage,
        _api = api,
        super(const AuthState(isLoading: true)) {
    _api.onSessionExpired = () {
      if (mounted) {
        VolunteerBackgroundService.stop();
        state = const AuthState(isAuthenticated: false, isLoading: false);
      }
    };
    checkAuthStatus();
  }

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final token = await _storage.getAccessToken();
      final refreshToken = await _storage.getRefreshToken();
      if ((token != null && token.isNotEmpty) ||
          (refreshToken != null && refreshToken.isNotEmpty)) {
        final userData = await _storage.getUserData();
        state = state.copyWith(
          isAuthenticated: true,
          isLoading: false,
          user: userData,
        );
        VolunteerBackgroundService.startIfAuthenticated();
      } else {
        state = state.copyWith(isAuthenticated: false, isLoading: false);
      }
    } catch (_) {
      state = state.copyWith(isAuthenticated: false, isLoading: false);
    }
  }

  Future<bool> login(String identifier, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final response = await _api.login(identifier, password);
      final data = response.data as Map<String, dynamic>;

      final token = data['access_token'] as String;
      final refreshToken = data['refresh_token'] as String?;
      final userMap = data['user'] as Map<String, dynamic>?;

      // Restrict volunteer mobile app to registered volunteer accounts
      final role = userMap?['role'] as String?;
      if (role != null && role != 'volunteer') {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Access restricted to registered volunteers. If you are seeking emergency protection, please use the SafeLink Emergency app.',
        );
        return false;
      }

      await _storage.setAccessToken(token);
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _storage.setRefreshToken(refreshToken);
      }
      if (userMap != null) {
        await _storage.saveUserData(userMap);
      }

      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        user: userMap,
      );

      await VolunteerBackgroundService.startIfAuthenticated();
      return true;
    } on DioException catch (e) {
      String msg = 'Login failed. Please verify your volunteer credentials.';
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.connectionError) {
        msg = 'Cannot connect to server. Please check your internet connection.';
      } else if (e.response?.statusCode == 404) {
        msg = 'Authentication service temporarily unavailable. Please try again later.';
      } else if (e.response?.data is Map && e.response?.data['detail'] != null) {
        msg = e.response?.data['detail'].toString() ?? msg;
      }
      state = state.copyWith(isLoading: false, errorMessage: msg);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Unexpected error: $e');
      return false;
    }
  }

  Future<void> logout() async {
    await VolunteerBackgroundService.stop();
    await _storage.clearAll();
    state = const AuthState(isAuthenticated: false, isLoading: false);
  }
}
