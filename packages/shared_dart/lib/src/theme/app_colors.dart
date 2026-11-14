import 'package:flutter/material.dart';

/// SafeLink Unified Design Tokens for Flutter
/// Matches the web design system: Warm off-white background, deep midnight ink navy,
/// restrained brand teal, and dedicated emergency red.

class AppColors {
  static const Color canvasCream = Color(0xFFFDFCF7);
  static const Color midnightNavy = Color(0xFF0F172A);
  static const Color brandTeal = Color(0xFF0F766E);
  static const Color slateNeutral = Color(0xFF64748B);
  static const Color emergencyRed = Color(0xFFE11D48);
  static const Color emerald = Color(0xFF059669);
  static const Color emeraldDark = Color(0xFF065F46);
}

class SafeLinkColors {
  // Backgrounds
  static const int bgWarmLight = 0xFFFDFCF7;
  static const int bgSurface = 0xFFFFFFFF;
  static const int bgMuted = 0xFFF1F5F9;

  // Text & Foregrounds
  static const int textMidnight = 0xFF0B132B;
  static const int textSecondary = 0xFF64748B;
  static const int textMuted = 0xFF94A3B8;

  // Brand Accents
  static const int brandPrimary = 0xFF0F766E; // Trustworthy Deep Teal
  static const int brandNavy = 0xFF1E3A8A;    // Midnight Navy Indigo
  static const int brandAccentLight = 0xFFCCFBF1;

  // Emergency Red (Strictly reserved for SOS actions)
  static const int emergencyRed = 0xFFDC2626;
  static const int emergencyRedDark = 0xFF991B1B;
  static const int emergencyRedLight = 0xFFFEE2E2;

  // Status Colors
  static const int statusSuccess = 0xFF16A34A;
  static const int statusWarning = 0xFFD97706;
  static const int statusBorder = 0xFFE2E8F0;
}
