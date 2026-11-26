import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

class StorageService {
  final FlutterSecureStorage _secureStorage;

  StorageService({FlutterSecureStorage? storage})
      : _secureStorage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: false),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  static const keyAccessToken = 'safelink_vol_access_token';
  static const keyRefreshToken = 'safelink_vol_refresh_token';
  static const keyUserData = 'safelink_vol_user_data';
  static const keyActiveIncidentId = 'safelink_vol_active_incident_id';
  static const keyNotifiedIncidentIds = 'safelink_vol_notified_incidents';
  static const keyBaseUrl = 'safelink_custom_base_url';

  Future<String?> _readKey(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final val = prefs.getString(key);
      if (val != null && val.isNotEmpty) return val;
    } catch (_) {}
    try {
      return await _secureStorage.read(key: key);
    } catch (_) {
      return null;
    }
  }

  Future<void> _writeKey(String key, String value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(key, value);
    } catch (_) {}
    try {
      await _secureStorage.write(key: key, value: value);
    } catch (_) {}
  }

  Future<void> _deleteKey(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(key);
    } catch (_) {}
    try {
      await _secureStorage.delete(key: key);
    } catch (_) {}
  }

  Future<String?> getBaseUrl() async => await _readKey(keyBaseUrl);
  Future<void> setBaseUrl(String url) async => await _writeKey(keyBaseUrl, url.trim());
  Future<void> clearBaseUrl() async => await _deleteKey(keyBaseUrl);

  Future<String?> getAccessToken() async => await _readKey(keyAccessToken);
  Future<void> setAccessToken(String token) async => await _writeKey(keyAccessToken, token);

  Future<String?> getRefreshToken() async => await _readKey(keyRefreshToken);
  Future<void> setRefreshToken(String token) async => await _writeKey(keyRefreshToken, token);

  Future<Map<String, dynamic>?> getUserData() async {
    final raw = await _readKey(keyUserData);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> saveUserData(Map<String, dynamic> data) async =>
      await _writeKey(keyUserData, jsonEncode(data));

  Future<String?> getActiveIncidentId() async => await _readKey(keyActiveIncidentId);

  Future<void> setActiveIncidentId(String? id) async {
    if (id == null) {
      await _deleteKey(keyActiveIncidentId);
    } else {
      await _writeKey(keyActiveIncidentId, id);
    }
  }

  Future<void> clearAll() async {
    final savedUrl = await getBaseUrl();
    await _deleteKey(keyAccessToken);
    await _deleteKey(keyRefreshToken);
    await _deleteKey(keyUserData);
    await _deleteKey(keyActiveIncidentId);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(keyNotifiedIncidentIds);
    } catch (_) {}
    try {
      await _secureStorage.deleteAll();
    } catch (_) {}
    if (savedUrl != null) {
      await setBaseUrl(savedUrl);
    }
  }
}
