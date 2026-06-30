import 'package:auto_size_text/auto_size_text.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../common.dart';
import '../ats_design.dart';

class Button extends StatefulWidget {
  final GestureTapCallback onTap;
  final String text;
  final double? textSize;
  final double? minWidth;
  final bool isOutline;
  final double? padding;
  final Color? textColor;
  final double? radius;
  final Color? borderColor;

  Button({
    Key? key,
    this.minWidth,
    this.isOutline = false,
    this.textSize,
    this.padding,
    this.textColor,
    this.radius,
    this.borderColor,
    required this.onTap,
    required this.text,
  }) : super(key: key);

  @override
  State<Button> createState() => _ButtonState();
}

class _ButtonState extends State<Button> {
  RxBool hover = false.obs;
  RxBool pressed = false.obs;

  @override
  Widget build(BuildContext context) {
    final r = widget.radius ?? AtsDesign.radiusSm;
    return Obx(() => MouseRegion(
          onHover: (value) => hover.value = value,
          child: GestureDetector(
          onTapDown: (_) => pressed.value = true,
          onTapUp: (_) => pressed.value = false,
          onTapCancel: () => pressed.value = false,
          onTap: widget.onTap,
          child: AnimatedScale(
            scale: pressed.value ? 0.96 : (hover.value ? 1.03 : 1.0),
            duration: AtsDesign.animFast,
            curve: AtsDesign.animCurve,
            child: ConstrainedBox(
              constraints: BoxConstraints(minWidth: widget.minWidth ?? 70.0),
              child: AnimatedContainer(
                duration: AtsDesign.animNormal,
                padding: EdgeInsets.all(widget.padding ?? 6),
                alignment: Alignment.center,
                decoration: ShapeDecoration(
                  color: pressed.value
                      ? AtsDesign.accentDark
                      : (widget.isOutline
                          ? Colors.transparent
                          : (hover.value ? AtsDesign.accentHover : MyTheme.button)),
                  shape: AtsDesign.squircle(
                    radius: r,
                    side: BorderSide(
                      color: widget.isOutline
                          ? (hover.value ? AtsDesign.accent : (widget.borderColor ?? MyTheme.border))
                          : Colors.transparent,
                      width: widget.isOutline ? 1.2 : 0,
                    ),
                  ),
                  shadows: widget.isOutline
                      ? null
                      : [
                          BoxShadow(
                            color: AtsDesign.accent.withOpacity(hover.value ? 0.35 : 0.2),
                            blurRadius: hover.value ? 12 : 6,
                            offset: Offset(0, hover.value ? 4 : 2),
                          ),
                        ],
                ),
                child: Text(
                  translate(widget.text),
                  style: TextStyle(
                    fontFamily: AtsDesign.fontFamily,
                    fontSize: widget.textSize ?? 13.0,
                    fontWeight: FontWeight.w600,
                    color: widget.isOutline
                        ? widget.textColor ?? AtsDesign.accent
                        : Colors.white,
                  ),
                ).marginSymmetric(horizontal: 12),
              ),
            ),
          ),
        )));
  }
}

class FixedWidthButton extends StatefulWidget {
  final GestureTapCallback onTap;
  final String text;
  final double? textSize;
  final double width;
  final bool isOutline;
  final double? padding;
  final Color? textColor;
  final double? radius;
  final Color? borderColor;
  final int? maxLines;

  FixedWidthButton({
    Key? key,
    required this.width,
    this.maxLines,
    this.isOutline = false,
    this.textSize,
    this.padding,
    this.textColor,
    this.radius,
    this.borderColor,
    required this.onTap,
    required this.text,
  }) : super(key: key);

  @override
  State<FixedWidthButton> createState() => _FixedWidthButtonState();
}

class _FixedWidthButtonState extends State<FixedWidthButton> {
  RxBool hover = false.obs;
  RxBool pressed = false.obs;

  @override
  Widget build(BuildContext context) {
    final r = widget.radius ?? AtsDesign.radiusSm;
    return Obx(() => MouseRegion(
          onHover: (v) => hover.value = v,
          child: GestureDetector(
          onTapDown: (_) => pressed.value = true,
          onTapUp: (_) => pressed.value = false,
          onTapCancel: () => pressed.value = false,
          onTap: widget.onTap,
          child: AnimatedScale(
            scale: pressed.value ? 0.96 : 1.0,
            duration: AtsDesign.animFast,
            child: AnimatedContainer(
              duration: AtsDesign.animNormal,
              width: widget.width,
              padding: EdgeInsets.all(widget.padding ?? 6),
              alignment: Alignment.center,
              decoration: ShapeDecoration(
                color: pressed.value
                    ? AtsDesign.accentDark
                    : (widget.isOutline ? Colors.transparent : MyTheme.button),
                shape: AtsDesign.squircle(radius: r),
              ),
              child: AutoSizeText(
                translate(widget.text),
                maxLines: widget.maxLines ?? 1,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: AtsDesign.fontFamily,
                  fontSize: widget.textSize ?? 13.0,
                  fontWeight: FontWeight.w600,
                  color: widget.isOutline
                      ? widget.textColor ??
                          Theme.of(context).textTheme.titleLarge?.color
                      : Colors.white,
                ),
              ).marginSymmetric(horizontal: 12),
            ),
          ),
        )));
  }
}
