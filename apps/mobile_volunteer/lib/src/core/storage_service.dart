import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

class StorageService {
  final FlutterSecureStorage _storage;

  StorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  static const _keyAccessToken = 'safelink_vol_access_token';
  static const _keyRefreshToken = 'safelink_vol_refresh_token';
  static const _keyUserData = 'safelink_vol_user_data';
  static const _keyActiveIncidentId = 'safelink_vol_active_incident_id';

  Future<String?> getAccessToken() async => await _storage.read(key: _keyAccessToken);
  Future<void> setAccessToken(String token) async =>
      await _storage.write(key: _keyAccessToken, value: token);

  Future<String?> getRefreshToken() async => await _storage.read(key: _keyRefreshToken);
  Future<void> setRefreshToken(String token) async =>
      await _storage.write(key: _keyRefreshToken, value: token);

  Future<void> saveUserData(Map<String, dynamic> data) async =>
      await _storage.write(key: _keyUserData, value: jsonEncode(data));

  Future<Map<String, dynamic>?> getUserData() async {
    final raw = await _storage.read(key: _keyUserData);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<String?> getActiveIncidentId() async =>
      await _storage.read(key: _keyActiveIncidentId);

  Future<void> setActiveIncidentId(String? id) async {
    if (id == null) {
      await _storage.delete(key: _keyActiveIncidentId);
    } else {
      await _storage.write(key: _keyActiveIncidentId, value: id);
    }
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
