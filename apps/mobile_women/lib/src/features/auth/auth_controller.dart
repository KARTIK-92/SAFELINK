import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
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
    checkAuthStatus();
  }

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final token = await _storage.getAccessToken();
      if (token != null && token.isNotEmpty) {
        final userData = await _storage.getUserData();
        state = state.copyWith(
          isAuthenticated: true,
          isLoading: false,
          user: userData,
        );
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
      final userMap = data['user'] as Map<String, dynamic>?;

      // Restrict women's mobile app to registered women accounts
      final role = userMap?['role'] as String?;
      if (role != null && role != 'woman') {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'This app is dedicated for registered women accounts. Volunteers should use the SafeLink Volunteer app.',
        );
        return false;
      }

      await _storage.setAccessToken(token);
      if (userMap != null) {
        await _storage.saveUserData(userMap);
      }

      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        user: userMap,
      );
      return true;
    } on DioException catch (e) {
      String msg = 'Login failed. Please verify your credentials.';
      if (e.response?.data is Map && e.response?.data['detail'] != null) {
        msg = e.response?.data['detail'].toString() ?? msg;
      }
      state = state.copyWith(isLoading: false, errorMessage: msg);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'An unexpected error occurred: $e');
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.clearAll();
    state = const AuthState(isAuthenticated: false, isLoading: false);
  }
}
