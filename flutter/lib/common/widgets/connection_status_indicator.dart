import 'package:flutter/material.dart';

import '../../common.dart';

/// Colores de estado de conexión unificados (estilo AnyDesk).
class ConnectionStatusColors {
  ConnectionStatusColors._();

  static const Color online = Color(0xFF4CAF50);
  static const Color connecting = Color(0xFFFF9800);
  static const Color offline = Color(0xFFE53935);
  static const Color ready = Color(0xFF26A69A);
}

/// Indicador circular de estado con raya diagonal para offline.
class ConnectionStatusDot extends StatelessWidget {
  final Color color;
  final double size;
  final String? tooltip;

  const ConnectionStatusDot({
    Key? key,
    required this.color,
    this.size = 12,
    this.tooltip,
  }) : super(key: key);

  bool get _isOffline => color == ConnectionStatusColors.offline;

  @override
  Widget build(BuildContext context) {
    final dot = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: size > 10 ? 1.5 : 1),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 3)],
      ),
      child: _isOffline
          ? CustomPaint(
              painter: _OfflineSlashPainter(),
              size: Size(size, size),
            )
          : null,
    );
    if (tooltip != null && tooltip!.isNotEmpty) {
      return Tooltip(message: tooltip!, child: dot);
    }
    return dot;
  }
}

class _OfflineSlashPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = size.width > 10 ? 2 : 1.5
      ..style = PaintingStyle.stroke;
    canvas.drawLine(
      Offset(size.width * 0.2, size.height * 0.2),
      Offset(size.width * 0.8, size.height * 0.8),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
