import 'package:flutter/material.dart';
import 'package:shared_dart/shared_dart.dart';

class SafeLinkTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: const Color(SafeLinkColors.bgWarmLight),
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(SafeLinkColors.brandPrimary),
        primary: const Color(SafeLinkColors.brandPrimary),
        secondary: const Color(SafeLinkColors.brandNavy),
        error: const Color(SafeLinkColors.emergencyRed),
        surface: const Color(SafeLinkColors.bgSurface),
      ),
      fontFamily: 'Inter',
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(SafeLinkColors.bgWarmLight),
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: Color(SafeLinkColors.textMidnight),
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        iconTheme: IconThemeData(color: Color(SafeLinkColors.textMidnight)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: const Color(SafeLinkColors.brandPrimary),
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
