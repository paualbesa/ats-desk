import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:path_provider/path_provider.dart';

import '../../common.dart';
import '../../models/operator_shared_list_model.dart';
import '../../models/peer_model.dart';
import '../../models/platform_model.dart';
import '../../models/state_model.dart';

/// Tamaño mínimo de cada celda de la cuadrícula (ancho).
const double _kGridCellMinWidth = 260.0;

/// Relación ancho/alto de la tarjeta (como en la referencia: más ancha que alta).
const double _kCardAspectRatio = 16 / 10;

/// Centro estilo AnyDesk: cuadrícula de conexiones (recientes + libreta) por último acceso.
/// Cada celda muestra miniatura (placeholder o futura "última imagen vista") y nombre; al tocar se conecta.
class RecentConnectionsCenterView extends StatefulWidget {
  const RecentConnectionsCenterView({Key? key}) : super(key: key);

  @override
  State<RecentConnectionsCenterView> createState() =>
      _RecentConnectionsCenterViewState();
}

class _RecentConnectionsCenterViewState extends State<RecentConnectionsCenterView> {
  DateTime? _lastThumbnailSync;
  Timer? _thumbnailSyncTimer;

  @override
  void initState() {
    super.initState();
    bind.mainLoadRecentPeers();
    _loadFavoritesIntoGlobal();
    _ensureThumbnailDirExists();
    _thumbnailSyncTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (!mounted) return;
      final peers = _mergedPeers();
      if (peers.isNotEmpty) _syncThumbnailsFromDiskIfNeeded(peers);
    });
  }

  /// Crea el directorio de miniaturas si no existe (evita "dir does not exist" y deja la ruta lista para el guardado).
  Future<void> _ensureThumbnailDirExists() async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final subdir = Directory('${dir.path}/ats_desk_thumbnails');
      if (!await subdir.exists()) {
        await subdir.create(recursive: true);
        debugPrint('[thumbnail] Created dir ${subdir.path}');
      }
    } catch (e) {
      debugPrint('[thumbnail] Failed to create thumbnail dir: $e');
    }
  }

  @override
  void dispose() {
    _thumbnailSyncTimer?.cancel();
    super.dispose();
  }

  /// Sincroniza miniaturas desde disco para que se vean al volver de una conexión.
  Future<void> _syncThumbnailsFromDiskIfNeeded(List<Peer> peers) async {
    if (peers.isEmpty) return;
    final now = DateTime.now();
    if (_lastThumbnailSync != null && now.difference(_lastThumbnailSync!).inSeconds < 2) return;
    _lastThumbnailSync = now; // throttle: no volver a sincronizar en 2 s
    try {
      final dir = await getApplicationDocumentsDirectory();
      final subdir = Directory('${dir.path}/ats_desk_thumbnails');
      if (!await subdir.exists()) {
        await subdir.create(recursive: true);
      }
      bool updated = false;
      for (final peer in peers) {
        final safeId = peer.id.replaceAll(RegExp(r'[^\w\-.]'), '_');
        final path = '${subdir.path}/last_$safeId.png';
        final file = File(path);
        if (file.existsSync() && stateGlobal.lastSeenThumbnailPath[peer.id] != path) {
          debugPrint('[thumbnail] Sync from disk: found file for ${peer.id} -> $path');
          stateGlobal.lastSeenThumbnailPath[peer.id] = path;
          updated = true;
        }
      }
      if (updated && mounted) {
        stateGlobal.lastSeenThumbnailPath.refresh();
      }
    } catch (_) {}
  }

  /// Carga favoritos una vez y los deja en stateGlobal.favoriteIds para UI reactiva.
  Future<void> _loadFavoritesIntoGlobal() async {
    final favs = (await bind.mainGetFav()).toList();
    if (mounted) {
      stateGlobal.favoriteIds.assignAll(favs);
      stateGlobal.favoriteIds.refresh();
      debugPrint('[fav] _loadFavoritesIntoGlobal: favoriteIds updated, count=${favs.length}, ids=$favs');
    }
  }

  /// Lista fusionada: primero recientes (orden por último acceso), luego libreta que no estén en recientes.
  List<Peer> _mergedPeers() {
    final recent = gFFI.recentPeersModel.peers;
    final recentIds = recent.map((p) => p.id).toSet();
    final list = List<Peer>.from(recent);
    for (final e in gFFI.operatorSharedListModel.entries) {
      if (recentIds.contains(e.id)) continue;
      list.add(Peer.fromJson({
        'id': e.id,
        'alias': e.name.isNotEmpty ? e.name : e.id,
        'hostname': '',
        'username': '',
        'platform': '',
        'tags': [],
      }));
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Obx(() {
      stateGlobal.favoriteIds.length;
      final peers = _mergedPeers();
      if (peers.isEmpty) {
        return Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.desktop_windows_outlined, size: 64, color: theme.hintColor),
              const SizedBox(height: 16),
              Text(
                localeName.startsWith('es')
                    ? 'Sin conexiones recientes'
                    : 'No recent connections',
                style: theme.textTheme.titleMedium?.copyWith(color: theme.hintColor),
              ),
              const SizedBox(height: 8),
              Text(
                localeName.startsWith('es')
                    ? 'Conecta desde el panel izquierdo o escribe un ID'
                    : 'Connect from the left panel or enter an ID',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.hintColor),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        );
      }
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _syncThumbnailsFromDiskIfNeeded(peers);
      });
      return LayoutBuilder(
        builder: (context, constraints) {
          final width = constraints.maxWidth;
          final crossAxisCount = (width / _kGridCellMinWidth).floor().clamp(1, 6);
          const padding = 16.0;
          const spacing = 12.0;
          final cellWidth = (width - padding * 2 - spacing * (crossAxisCount - 1)) / crossAxisCount;
          final cellHeight = cellWidth / _kCardAspectRatio;
          return GridView.builder(
            padding: const EdgeInsets.all(padding),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: crossAxisCount,
              mainAxisSpacing: spacing,
              crossAxisSpacing: spacing,
              childAspectRatio: cellWidth / cellHeight,
            ),
            cacheExtent: 400,
            itemCount: peers.length,
            itemBuilder: (context, index) {
              return _ConnectionGridCard(peer: peers[index]);
            },
          );
        },
      );
    });
  }
}

/// Color del indicador de estado de conexión por peer id.
Color _connectionStatusColor(String peerId) {
  if (stateGlobal.connectingPeerIds.contains(peerId)) return Colors.orange;
  if (stateGlobal.connectedPeerIds.contains(peerId)) return Colors.green;
  if (stateGlobal.addressListOnlineStates[peerId] == true) return Colors.green;
  return Colors.red;
}

/// Texto del tooltip de estado (Conectando / Conectado / Desconectado).
String _connectionStatusTooltip(String peerId) {
  if (stateGlobal.connectingPeerIds.contains(peerId)) {
    return localeName.startsWith('es') ? 'Conectando…' : 'Connecting…';
  }
  if (stateGlobal.connectedPeerIds.contains(peerId)) {
    return localeName.startsWith('es') ? 'Conectado' : 'Connected';
  }
  return localeName.startsWith('es') ? 'Desconectado' : 'Offline';
}

class _ConnectionGridCard extends StatelessWidget {
  final Peer peer;

  const _ConnectionGridCard({Key? key, required this.peer}) : super(key: key);

  Future<void> _toggleFavorite() async {
    final favs = List<String>.from(stateGlobal.favoriteIds);
    final isFav = favs.contains(peer.id);
    if (isFav) {
      favs.remove(peer.id);
    } else {
      favs.add(peer.id);
    }
    await bind.mainStoreFav(favs: favs);
    stateGlobal.favoriteIds.assignAll(favs);
    stateGlobal.favoriteIds.refresh();
    debugPrint('[fav] _toggleFavorite: after refresh favoriteIds.length=${stateGlobal.favoriteIds.length} contains(${peer.id})=${stateGlobal.favoriteIds.contains(peer.id)} ids=$favs');
    bind.mainLoadFavPeers();
  }

  void _showContextMenu(BuildContext context, RelativeRect position) async {
    final favs = List<String>.from(stateGlobal.favoriteIds);
    final isFavorite = favs.contains(peer.id);
    await showMenu<void>(
      context: context,
      position: position,
      items: [
        PopupMenuItem(
          onTap: () => connect(context, peer.id),
          child: ListTile(
            leading: const Icon(Icons.link),
            title: Text(translate('Connect')),
            contentPadding: EdgeInsets.zero,
          ),
        ),
        PopupMenuItem(
          onTap: () async {
            if (isFavorite) {
              favs.remove(peer.id);
            } else {
              favs.add(peer.id);
            }
            await bind.mainStoreFav(favs: favs);
            stateGlobal.favoriteIds.assignAll(favs);
            stateGlobal.favoriteIds.refresh();
            debugPrint('[fav] context menu: favoriteIds updated, count=${favs.length}, ids=$favs');
            bind.mainLoadFavPeers();
          },
          child: ListTile(
            leading: Icon(isFavorite ? Icons.star : Icons.star_outline),
            title: Text(isFavorite ? 'Quitar de favoritos' : translate('Add to Favorites')),
            contentPadding: EdgeInsets.zero,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final displayName = peer.getId();
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => connect(context, peer.id),
        borderRadius: BorderRadius.circular(12),
        child: Semantics(
          button: true,
          label: '$displayName, ${peer.id}',
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: theme.dividerColor.withOpacity(0.5)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.12),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Stack(
                fit: StackFit.expand,
                children: [
                // Fondo: miniatura o placeholder (con fade-in al aparecer)
                Obx(() {
                  final path = stateGlobal.lastSeenThumbnailPath[peer.id];
                  if (path != null && path.isNotEmpty) {
                    final f = File(path);
                    if (f.existsSync()) {
                      debugPrint('[thumbnail] Grid showing image for ${peer.id} path=$path');
                      return AnimatedSwitcher(
                        duration: const Duration(milliseconds: 220),
                        child: Image.file(
                          f,
                          key: ValueKey(path),
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                          gaplessPlayback: true,
                          filterQuality: FilterQuality.medium,
                        ),
                      );
                    } else {
                      debugPrint('[thumbnail] Grid: path in map but file missing for ${peer.id} path=$path');
                    }
                  }
                  return Container(
                    key: ValueKey('thumb_placeholder_${peer.id}'),
                    color: theme.brightness == Brightness.dark
                        ? theme.cardColor
                        : theme.colorScheme.surfaceContainerHighest.withOpacity(0.7),
                    child: Center(
                      child: Icon(
                        Icons.desktop_windows_outlined,
                        size: 72,
                        color: theme.hintColor.withOpacity(0.5),
                      ),
                    ),
                  );
                }),
                // Gradiente suave abajo para legibilidad del texto
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 60,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black.withOpacity(0.6)],
                      ),
                    ),
                  ),
                ),
                // Arriba izquierda: estado de conexión (círculo rojo con raya = offline, verde = online)
                Positioned(
                  top: 10,
                  left: 10,
                  child: Obx(() {
                    final color = _connectionStatusColor(peer.id);
                    final isOffline = color == Colors.red;
                    return Tooltip(
                      message: _connectionStatusTooltip(peer.id),
                      child: Container(
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1.5),
                          boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 4)],
                        ),
                        child: isOffline
                            ? CustomPaint(
                                painter: _OfflineLinePainter(),
                                size: const Size(14, 14),
                              )
                            : null,
                      ),
                    );
                  }),
                ),
                // Arriba derecha: favorito (reactivo vía stateGlobal.favoriteIds)
                Positioned(
                  top: 6,
                  right: 6,
                  child: Obx(() {
                    final isFav = stateGlobal.favoriteIds.contains(peer.id);
                    return Tooltip(
                      message: isFav
                          ? (localeName.startsWith('es') ? 'Quitar de favoritos' : 'Remove from favorites')
                          : (localeName.startsWith('es') ? 'Añadir a favoritos' : 'Add to favorites'),
                      child: IconButton(
                        iconSize: 22,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                        onPressed: _toggleFavorite,
                        icon: Icon(
                          isFav ? Icons.star : Icons.star_outline,
                          color: Colors.white,
                          size: 22,
                        ),
                        style: IconButton.styleFrom(
                          foregroundColor: Colors.white,
                        ),
                      ),
                    );
                  }),
                ),
                // Abajo izquierda: nombre + ID (capa nítida para evitar texto pixelado)
                Positioned(
                  left: 12,
                  right: 44,
                  bottom: 10,
                  child: RepaintBoundary(
                    child: DefaultTextStyle(
                      style: const TextStyle(
                        color: Colors.white,
                        fontFamily: 'Roboto',
                        letterSpacing: 0.2,
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.monitor_outlined, color: Colors.white, size: 18),
                              const SizedBox(width: 6),
                              Flexible(
                                child: Text(
                                  displayName,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    height: 1.2,
                                    shadows: [
                                      Shadow(color: Colors.black87, blurRadius: 1, offset: Offset(0, 1)),
                                      Shadow(color: Colors.black54, blurRadius: 2, offset: Offset(0, 1)),
                                    ],
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            peer.id,
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.98),
                              fontSize: 13,
                              height: 1.2,
                              shadows: const [
                                Shadow(color: Colors.black87, blurRadius: 1, offset: Offset(0, 1)),
                                Shadow(color: Colors.black54, blurRadius: 2, offset: Offset(0, 1)),
                              ],
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                // Abajo derecha: menú de tres puntos (posición correcta respecto al overlay)
                Positioned(
                  right: 4,
                  bottom: 4,
                  child: Tooltip(
                    message: localeName.startsWith('es') ? 'Menú' : 'Menu',
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        borderRadius: BorderRadius.circular(20),
                        onTap: () {
                          final RenderBox? button = context.findRenderObject() as RenderBox?;
                          final RenderBox? overlay = Navigator.of(context).overlay?.context.findRenderObject() as RenderBox?;
                          if (button != null && overlay != null) {
                            final rect = button.localToGlobal(Offset.zero) & button.size;
                            final overlayRect = Offset.zero & overlay.size;
                            final position = RelativeRect.fromRect(rect, overlayRect);
                            _showContextMenu(context, position);
                          }
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(6),
                          child: Icon(Icons.more_vert, color: Colors.white, size: 20),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      ),
    );
  }
}

/// Dibuja la raya diagonal de "desconectado" dentro del círculo.
class _OfflineLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(2, 2), Offset(size.width - 2, size.height - 2), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
