import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

import 'package:flutter_hbb/common.dart';
import 'package:flutter_hbb/common/ats_design.dart';

/// Entrada animada con fade + slide (stagger opcional por índice).
class AtsEntrance extends StatefulWidget {
  final Widget child;
  final int index;
  final Duration delay;
  final Axis direction;

  const AtsEntrance({
    Key? key,
    required this.child,
    this.index = 0,
    this.delay = Duration.zero,
    this.direction = Axis.vertical,
  }) : super(key: key);

  @override
  State<AtsEntrance> createState() => _AtsEntranceState();
}

class _AtsEntranceState extends State<AtsEntrance>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fade;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: AtsDesign.animSlow);
    _fade = CurvedAnimation(parent: _ctrl, curve: AtsDesign.animCurve);
    _slide = Tween<Offset>(
      begin: widget.direction == Axis.vertical
          ? const Offset(0, 0.08)
          : const Offset(0.06, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _ctrl, curve: AtsDesign.animSpring));
    final totalDelay = widget.delay +
        AtsDesign.animStagger * widget.index;
    Future.delayed(totalDelay, () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}

/// Tarjeta squircle con hover y press animados.
class AtsSquircleCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double radius;
  final EdgeInsetsGeometry? padding;
  final bool animateHover;

  const AtsSquircleCard({
    Key? key,
    required this.child,
    this.onTap,
    this.radius = AtsDesign.radiusMd,
    this.padding,
    this.animateHover = true,
  }) : super(key: key);

  @override
  State<AtsSquircleCard> createState() => _AtsSquircleCardState();
}

class _AtsSquircleCardState extends State<AtsSquircleCard> {
  bool _hovered = false;
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final scale = _pressed ? 0.97 : (_hovered && widget.animateHover ? 1.015 : 1.0);
    return MouseRegion(
      onEnter: widget.onTap != null ? (_) => setState(() => _hovered = true) : null,
      onExit: widget.onTap != null ? (_) => setState(() => _hovered = false) : null,
      child: GestureDetector(
        onTapDown: widget.onTap != null ? (_) => setState(() => _pressed = true) : null,
        onTapUp: widget.onTap != null ? (_) => setState(() => _pressed = false) : null,
        onTapCancel: widget.onTap != null ? () => setState(() => _pressed = false) : null,
        onTap: widget.onTap,
        child: AnimatedScale(
          scale: scale,
          duration: AtsDesign.animFast,
          curve: AtsDesign.animCurve,
          child: AnimatedContainer(
            duration: AtsDesign.animNormal,
            curve: AtsDesign.animCurve,
            padding: widget.padding,
            decoration: AtsDesign.cardDecoration(context: context, radius: widget.radius).copyWith(
              border: Border.all(
                color: _hovered
                    ? AtsDesign.accent.withOpacity(0.45)
                    : (Theme.of(context).brightness == Brightness.dark
                        ? AtsDesign.darkBorder.withOpacity(0.5)
                        : AtsDesign.lightBorder),
                width: _hovered ? 1.2 : 0.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(
                    _hovered ? 0.14 : (Theme.of(context).brightness == Brightness.dark ? 0.3 : 0.05),
                  ),
                  blurRadius: _hovered ? 22 : 14,
                  offset: Offset(0, _hovered ? 6 : 3),
                ),
              ],
            ),
            child: widget.child,
          ),
        ),
      ),
    );
  }
}

/// Botón primario naranja con squircle y animaciones.
class AtsPrimaryButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool expanded;
  final bool outlined;

  const AtsPrimaryButton({
    Key? key,
    required this.label,
    this.onPressed,
    this.icon,
    this.expanded = false,
    this.outlined = false,
  }) : super(key: key);

  @override
  State<AtsPrimaryButton> createState() => _AtsPrimaryButtonState();
}

class _AtsPrimaryButtonState extends State<AtsPrimaryButton> {
  bool _hovered = false;
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final disabled = widget.onPressed == null;
    final bg = widget.outlined
        ? Colors.transparent
        : Color.lerp(
            AtsDesign.accent,
            _pressed ? AtsDesign.accentDark : (_hovered ? AtsDesign.accentHover : AtsDesign.accent),
            1,
          );
    final child = AnimatedContainer(
      duration: AtsDesign.animFast,
      curve: AtsDesign.animCurve,
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: ShapeDecoration(
        color: disabled ? AtsDesign.accent.withOpacity(0.4) : bg,
        shape: AtsDesign.squircle(radius: AtsDesign.radiusSm),
        shadows: widget.outlined || disabled
            ? null
            : [
                BoxShadow(
                  color: AtsDesign.accent.withOpacity(_hovered ? 0.45 : 0.28),
                  blurRadius: _hovered ? 16 : 10,
                  offset: Offset(0, _hovered ? 5 : 3),
                ),
              ],
      ),
      child: Row(
        mainAxisSize: widget.expanded ? MainAxisSize.max : MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (widget.icon != null) ...[
            Icon(widget.icon, size: 18, color: widget.outlined ? AtsDesign.accent : Colors.white),
            const SizedBox(width: 8),
          ],
          Text(
            widget.label,
            style: TextStyle(
              fontFamily: AtsDesign.fontFamily,
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: widget.outlined ? AtsDesign.accent : Colors.white,
            ),
          ),
        ],
      ),
    );
    return MouseRegion(
      onEnter: disabled ? null : (_) => setState(() => _hovered = true),
      onExit: disabled ? null : (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTapDown: disabled ? null : (_) => setState(() => _pressed = true),
        onTapUp: disabled ? null : (_) => setState(() => _pressed = false),
        onTapCancel: disabled ? null : () => setState(() => _pressed = false),
        onTap: disabled ? null : widget.onPressed,
        child: AnimatedScale(
          scale: _pressed ? 0.96 : 1.0,
          duration: AtsDesign.animFast,
          child: widget.expanded ? SizedBox(width: double.infinity, child: child) : child,
        ),
      ),
    );
  }
}

/// Toggle rápido claro / oscuro / sistema.
class AtsThemeToggle extends StatelessWidget {
  const AtsThemeToggle({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final mode = MyTheme.getThemeModePreference();
    IconData icon;
    String tooltip;
    switch (mode) {
      case ThemeMode.dark:
        icon = Icons.dark_mode_rounded;
        tooltip = localeName.startsWith('es') ? 'Modo oscuro' : 'Dark mode';
        break;
      case ThemeMode.light:
        icon = Icons.light_mode_rounded;
        tooltip = localeName.startsWith('es') ? 'Modo claro' : 'Light mode';
        break;
      default:
        icon = Icons.brightness_auto_rounded;
        tooltip = localeName.startsWith('es') ? 'Tema del sistema' : 'System theme';
    }
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          customBorder: AtsDesign.squircle(radius: AtsDesign.radiusXs),
          onTap: () async {
            final next = switch (mode) {
              ThemeMode.light => ThemeMode.dark,
              ThemeMode.dark => ThemeMode.system,
              _ => ThemeMode.light,
            };
            await MyTheme.changeDarkMode(next);
            HapticFeedback.lightImpact();
          },
          child: AnimatedContainer(
            duration: AtsDesign.animNormal,
            padding: const EdgeInsets.all(8),
            decoration: ShapeDecoration(
              color: AtsDesign.accentSubtle,
              shape: AtsDesign.squircle(radius: AtsDesign.radiusXs),
            ),
            child: AnimatedSwitcher(
              duration: AtsDesign.animNormal,
              transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
              child: Icon(icon, key: ValueKey(icon), size: 18, color: AtsDesign.accent),
            ),
          ),
        ),
      ),
    );
  }
}

/// Campo de texto squircle animado al enfocar.
class AtsSquircleField extends StatefulWidget {
  final TextEditingController? controller;
  final FocusNode? focusNode;
  final String? hintText;
  final String? labelText;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onSubmitted;
  final TextInputType? keyboardType;
  final bool monospace;
  final Widget? suffix;

  const AtsSquircleField({
    Key? key,
    this.controller,
    this.focusNode,
    this.hintText,
    this.labelText,
    this.onChanged,
    this.onSubmitted,
    this.keyboardType,
    this.monospace = false,
    this.suffix,
  }) : super(key: key);

  @override
  State<AtsSquircleField> createState() => _AtsSquircleFieldState();
}

class _AtsSquircleFieldState extends State<AtsSquircleField> {
  late FocusNode _focus;
  bool _focused = false;

  @override
  void initState() {
    super.initState();
    _focus = widget.focusNode ?? FocusNode();
    _focus.addListener(_onFocus);
    widget.focusNode?.addListener(_onFocus);
  }

  void _onFocus() {
    final focused = widget.focusNode?.hasFocus ?? _focus.hasFocus;
    if (_focused != focused) setState(() => _focused = focused);
  }

  @override
  void dispose() {
    _focus.removeListener(_onFocus);
    widget.focusNode?.removeListener(_onFocus);
    if (widget.focusNode == null) _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return AnimatedContainer(
      duration: AtsDesign.animNormal,
      curve: AtsDesign.animCurve,
      decoration: ShapeDecoration(
        color: isDark ? AtsDesign.darkSurface : AtsDesign.lightSurface,
        shape: AtsDesign.squircle(
          radius: AtsDesign.radiusSm,
          side: BorderSide(
            color: _focused ? AtsDesign.accent : (isDark ? AtsDesign.darkBorder : AtsDesign.lightBorder),
            width: _focused ? 1.5 : 0.5,
          ),
        ),
        shadows: _focused
            ? [BoxShadow(color: AtsDesign.accent.withOpacity(0.18), blurRadius: 12, offset: const Offset(0, 2))]
            : null,
      ),
      child: TextField(
        controller: widget.controller,
        focusNode: widget.focusNode ?? _focus,
        onChanged: widget.onChanged,
        onSubmitted: widget.onSubmitted != null ? (_) => widget.onSubmitted!() : null,
        keyboardType: widget.keyboardType,
        style: widget.monospace
            ? AtsDesign.monoStyle(brightness: Theme.of(context).brightness, fontSize: 16)
            : Theme.of(context).textTheme.bodyLarge,
        decoration: InputDecoration(
          labelText: widget.labelText,
          hintText: widget.hintText,
          suffixIcon: widget.suffix,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }
}

/// Pulso animado para indicadores de estado activos.
class AtsPulseDot extends StatefulWidget {
  final Color color;
  final double size;

  const AtsPulseDot({Key? key, required this.color, this.size = 10}) : super(key: key);

  @override
  State<AtsPulseDot> createState() => _AtsPulseDotState();
}

class _AtsPulseDotState extends State<AtsPulseDot> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))
      ..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size + 8,
      height: widget.size + 8,
      child: Stack(
        alignment: Alignment.center,
        children: [
          AnimatedBuilder(
            animation: _ctrl,
            builder: (_, __) => Container(
              width: widget.size + 8 * _ctrl.value,
              height: widget.size + 8 * _ctrl.value,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.color.withOpacity(0.25 * (1 - _ctrl.value)),
              ),
            ),
          ),
          Container(
            width: widget.size,
            height: widget.size,
            decoration: BoxDecoration(
              color: widget.color,
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: widget.color.withOpacity(0.5), blurRadius: 4)],
            ),
          ),
        ],
      ),
    );
  }
}
