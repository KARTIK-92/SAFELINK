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

  static const _keyAccessToken = 'safelink_access_token';
  static const _keyRefreshToken = 'safelink_refresh_token';
  static const _keyUserData = 'safelink_user_data';
  static const _keyActiveIncidentId = 'safelink_active_incident_id';
  static const _keyActiveTrackingUrl = 'safelink_active_tracking_url';
  static const _keyBaseUrl = 'safelink_custom_base_url';

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

  Future<String?> getBaseUrl() async => await _readKey(_keyBaseUrl);
  Future<void> setBaseUrl(String url) async => await _writeKey(_keyBaseUrl, url.trim());
  Future<void> clearBaseUrl() async => await _deleteKey(_keyBaseUrl);

  Future<String?> getAccessToken() async => await _readKey(_keyAccessToken);
  Future<void> setAccessToken(String token) async => await _writeKey(_keyAccessToken, token);

  Future<String?> getRefreshToken() async => await _readKey(_keyRefreshToken);
  Future<void> setRefreshToken(String token) async => await _writeKey(_keyRefreshToken, token);

  Future<Map<String, dynamic>?> getUserData() async {
    final raw = await _readKey(_keyUserData);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> saveUserData(Map<String, dynamic> data) async =>
      await _writeKey(_keyUserData, jsonEncode(data));

  Future<String?> getActiveIncidentId() async => await _readKey(_keyActiveIncidentId);

  Future<void> setActiveIncidentId(String? id) async {
    if (id == null) {
      await _deleteKey(_keyActiveIncidentId);
    } else {
      await _writeKey(_keyActiveIncidentId, id);
    }
  }

  Future<String?> getActiveTrackingUrl() async => await _readKey(_keyActiveTrackingUrl);

  Future<void> setActiveTrackingUrl(String? url) async {
    if (url == null) {
      await _deleteKey(_keyActiveTrackingUrl);
    } else {
      await _writeKey(_keyActiveTrackingUrl, url);
    }
  }

  Future<void> clearAll() async {
    final savedUrl = await getBaseUrl();
    await _deleteKey(_keyAccessToken);
    await _deleteKey(_keyRefreshToken);
    await _deleteKey(_keyUserData);
    await _deleteKey(_keyActiveIncidentId);
    await _deleteKey(_keyActiveTrackingUrl);
    try {
      await _secureStorage.deleteAll();
    } catch (_) {}
    if (savedUrl != null) {
      await setBaseUrl(savedUrl);
    }
  }
}
