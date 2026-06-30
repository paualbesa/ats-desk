import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Sistema de diseño ATS Desk — squircles, naranja corporativo, tipografía moderna.
class AtsDesign {
  AtsDesign._();

  // ── Marca naranja ─────────────────────────────────────────────────────────
  static const Color accent = Color(0xFFE8762E);
  static const Color accentLight = Color(0xFFFF9A4D);
  static const Color accentDark = Color(0xFFC45E1A);
  static const Color accentHover = Color(0xFFD96A24);
  static const Color accentSubtle = Color(0x1AE8762E);
  static const Color accent50 = Color(0x77E8762E);
  static const Color accent80 = Color(0xCCE8762E);

  // ── Modo claro ────────────────────────────────────────────────────────────
  static const Color lightBg = Color(0xFFF2F2F7);
  static const Color lightPanel = Color(0xFFFFFFFF);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightBorder = Color(0xFFE5E5EA);
  static const Color lightText = Color(0xFF1C1C1E);
  static const Color lightTextSecondary = Color(0xFF8E8E93);

  // ── Modo oscuro ───────────────────────────────────────────────────────────
  static const Color darkBg = Color(0xFF0D0D0F);
  static const Color darkPanel = Color(0xFF1C1C1E);
  static const Color darkSurface = Color(0xFF2C2C2E);
  static const Color darkBorder = Color(0xFF3A3A3C);
  static const Color darkText = Color(0xFFF2F2F7);
  static const Color darkTextSecondary = Color(0xFF8E8E93);

  // ── Estado ──────────────────────────────────────────────────────────────────
  static const Color danger = Color(0xFFFF453A);
  static const Color success = Color(0xFF30D158);
  static const Color warning = Color(0xFFFF9F0A);
  static const Color info = Color(0xFF64D2FF);
  static const Color statusReady = Color(0xFF30D158);

  // ── Radios squircle (Apple continuous corners) ────────────────────────────
  static const double radiusXs = 8;
  static const double radiusSm = 12;
  static const double radiusMd = 16;
  static const double radiusLg = 20;
  static const double radiusXl = 24;

  /// Borde squircle estilo Apple (`ContinuousRectangleBorder`).
  static OutlinedBorder squircle({
    double radius = radiusMd,
    BorderSide side = BorderSide.none,
  }) =>
      ContinuousRectangleBorder(
        borderRadius: BorderRadius.circular(radius),
        side: side,
      );

  static BorderRadius borderRadius([double radius = radiusMd]) =>
      BorderRadius.circular(radius);

  static ClipRRect squircleClip({
    required Widget child,
    double radius = radiusMd,
  }) =>
      ClipRRect(
        borderRadius: borderRadius(radius),
        child: child,
      );

  // ── Animaciones ───────────────────────────────────────────────────────────
  static const Duration animFast = Duration(milliseconds: 140);
  static const Duration animNormal = Duration(milliseconds: 260);
  static const Duration animSlow = Duration(milliseconds: 420);
  static const Duration animStagger = Duration(milliseconds: 55);
  static const Curve animCurve = Curves.easeOutCubic;
  static const Curve animSpring = Curves.easeOutBack;

  // ── Tipografía ────────────────────────────────────────────────────────────
  static String? get fontFamily => GoogleFonts.plusJakartaSans().fontFamily;
  static String? get monoFamily => GoogleFonts.jetBrainsMono().fontFamily;

  static TextTheme textTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final fg = isDark ? darkText : lightText;
    final fg2 = isDark ? darkTextSecondary : lightTextSecondary;
    final base = TextTheme(
      displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: fg, letterSpacing: -0.5),
      displayMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: fg, letterSpacing: -0.4),
      headlineLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: fg, letterSpacing: -0.3),
      headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: fg),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: fg),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: fg),
      titleSmall: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: fg),
      bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: fg, height: 1.4),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: fg, height: 1.35),
      bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: fg2, height: 1.3),
      labelLarge: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: accent),
      labelMedium: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: fg2),
      labelSmall: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: fg2, letterSpacing: 0.3),
    );
    return GoogleFonts.plusJakartaSansTextTheme(base);
  }

  static TextStyle monoStyle({
    required Brightness brightness,
    double fontSize = 14,
    FontWeight weight = FontWeight.w500,
    Color? color,
  }) {
    final isDark = brightness == Brightness.dark;
    return GoogleFonts.jetBrainsMono(
      fontSize: fontSize,
      fontWeight: weight,
      color: color ?? (isDark ? darkText : lightText),
      letterSpacing: 1.2,
    );
  }

  static BoxDecoration cardDecoration({
    required BuildContext context,
    double radius = radiusMd,
    bool elevated = true,
    Color? color,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return BoxDecoration(
      color: color ?? (isDark ? darkSurface : lightSurface),
      borderRadius: borderRadius(radius),
      border: Border.all(
        color: isDark ? darkBorder.withOpacity(0.6) : lightBorder,
        width: 0.5,
      ),
      boxShadow: elevated
          ? [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.35 : 0.06),
                blurRadius: isDark ? 16 : 20,
                offset: const Offset(0, 4),
              ),
            ]
          : null,
    );
  }
}
