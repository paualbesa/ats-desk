import 'package:flutter/material.dart';
import 'package:flutter_hbb/common.dart';
import 'package:flutter_hbb/common/widgets/peer_card.dart';
import 'package:flutter_hbb/models/ab_model.dart';
import 'package:flutter_hbb/models/state_model.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';

import '../../models/operator_shared_list_model.dart';
import '../../models/peer_model.dart';
import '../../models/peer_tab_model.dart';
import '../../models/platform_model.dart';

/// Indicador de estado: naranja = conectando, verde = conectado/online, rojo = sin conexión.
Color _peerStatusColor(Peer peer) {
  if (stateGlobal.connectingPeerIds.contains(peer.id)) return Colors.orange;
  if (stateGlobal.connectedPeerIds.contains(peer.id)) return Colors.green;
  if (peer.online) return Colors.green;
  return Colors.red;
}

/// Panel izquierdo con lista de direcciones: Favoritos, Historial, Libreta.
/// Cada fila muestra indicador de estado (naranja/verde/rojo) y nombre o ID.
class LeftPanelPeerList extends StatefulWidget {
  const LeftPanelPeerList({Key? key}) : super(key: key);

  @override
  State<LeftPanelPeerList> createState() => _LeftPanelPeerListState();
}

class _LeftPanelPeerListState extends State<LeftPanelPeerList> {
  @override
  void initState() {
    super.initState();
    bind.mainLoadRecentPeers();
    bind.mainLoadFavPeers();
    gFFI.abModel.pullAb(force: ForcePullAb.listAndCurrent, quiet: true);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _Section(
          title: translate('Favorites'),
          peersModel: gFFI.favoritePeersModel,
          tab: PeerTabIndex.fav,
          maxCount: null,
        ),
        _Section(
          title: translate('Recent sessions'),
          peersModel: gFFI.recentPeersModel,
          tab: PeerTabIndex.recent,
          maxCount: 5,
        ),
        _AddressListSection(),
      ],
    );
  }
}

/// Sección Direcciones: lista local del operador (operatorSharedList), se actualiza al momento.
class _AddressListSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Obx(() {
      final entries = gFFI.operatorSharedListModel.entries.toList();
      if (entries.isEmpty) return const SizedBox.shrink();
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
            child: Text(
              'Direcciones',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: Theme.of(context).hintColor,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
          ...entries.map((e) => _AddressRow(entry: e)),
        ],
      );
    });
  }
}

class _AddressRow extends StatelessWidget {
  final OperatorSharedEntry entry;

  const _AddressRow({required this.entry});

  void _showContextMenu(BuildContext context, Offset position) async {
    final favs = (await bind.mainGetFav()).toList();
    final isFavorite = favs.contains(entry.id);
    final items = <PopupMenuEntry<void>>[
      PopupMenuItem(
        child: ListTile(
          leading: const Icon(Icons.link),
          title: Text(translate('Connect')),
          contentPadding: EdgeInsets.zero,
        ),
        onTap: () {
          final peer = Peer.fromJson({'id': entry.id, 'alias': entry.name});
          connectInPeerTab(context, peer, PeerTabIndex.ab);
        },
      ),
      PopupMenuItem(
        child: ListTile(
          leading: Icon(isFavorite ? Icons.star : Icons.star_outline),
          title: Text(isFavorite ? 'Quitar de favoritos' : translate('Add to Favorites')),
          contentPadding: EdgeInsets.zero,
        ),
        onTap: () async {
          if (isFavorite) {
            favs.remove(entry.id);
            await bind.mainStoreFav(favs: favs);
          } else {
            favs.add(entry.id);
            await bind.mainStoreFav(favs: favs);
          }
          if (context.mounted) showToast(translate('Successful'));
        },
      ),
      const PopupMenuDivider(),
      PopupMenuItem(
        child: ListTile(
          leading: const Icon(Icons.edit),
          title: const Text('Editar'),
          contentPadding: EdgeInsets.zero,
        ),
        onTap: () => _showEditDialog(context, entry),
      ),
      PopupMenuItem(
        child: ListTile(
          leading: const Icon(Icons.delete_outline),
          title: Text(translate('Delete')),
          contentPadding: EdgeInsets.zero,
        ),
        onTap: () => _showDeleteConfirmDialog(context, entry),
      ),
    ];
    await showMenu<void>(
      context: context,
      position: RelativeRect.fromLTRB(position.dx, position.dy, position.dx, position.dy),
      items: items,
    );
  }

  Future<void> _showEditDialog(BuildContext context, OperatorSharedEntry entry) async {
    final nameController = TextEditingController(text: entry.name);
    final noteController = TextEditingController(text: entry.note);
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Editar dirección'),
        content: SizedBox(
          width: 320,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('ID: ${entry.id}', style: Theme.of(ctx).textTheme.bodySmall),
              const SizedBox(height: 12),
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Nombre',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: noteController,
                decoration: const InputDecoration(
                  labelText: 'Nota (opcional)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(translate('Cancel')),
          ),
          ElevatedButton(
            onPressed: () {
              gFFI.operatorSharedListModel.updateEntry(
                entry.id,
                nameController.text.trim().isEmpty ? entry.id : nameController.text.trim(),
                noteController.text.trim(),
              );
              Navigator.of(ctx).pop();
              if (context.mounted) showToast(translate('Successful'));
            },
            child: Text(translate('Save')),
          ),
        ],
      ),
    );
  }

  Future<void> _showDeleteConfirmDialog(BuildContext context, OperatorSharedEntry entry) async {
    final label = entry.name.isEmpty ? entry.id : '${entry.name} (${entry.id})';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(translate('Confirm Delete')),
        content: Text('¿Eliminar esta dirección?\n$label'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(translate('Cancel')),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(translate('Delete')),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      gFFI.operatorSharedListModel.remove(entry.id);
      if (context.mounted) showToast(translate('Successful'));
    }
  }

  @override
  Widget build(BuildContext context) {
    final peer = Peer.fromJson({'id': entry.id, 'alias': entry.name});
    final displayName = entry.name.isEmpty ? entry.id : entry.name;
    return Obx(() {
      final color = _peerStatusColor(peer);
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => connectInPeerTab(context, peer, PeerTabIndex.ab),
          onSecondaryTapDown: (details) => _showContextMenu(context, details.globalPosition),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: color.withOpacity(0.5),
                        blurRadius: 4,
                        spreadRadius: 0,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    displayName,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    });
  }
}

class _Section extends StatelessWidget {
  final String title;
  final Peers peersModel;
  final PeerTabIndex tab;
  final int? maxCount;

  const _Section({
    required this.title,
    required this.peersModel,
    required this.tab,
    this.maxCount,
  });

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<Peers>.value(
      value: peersModel,
      child: Consumer<Peers>(
        builder: (context, peers, _) {
          var list = List<Peer>.from(peers.peers);
          list.sort((a, b) {
            final na = (a.alias.isEmpty ? a.id : a.alias).toLowerCase();
            final nb = (b.alias.isEmpty ? b.id : b.alias).toLowerCase();
            return na.compareTo(nb);
          });
          if (maxCount != null && list.length > maxCount!) {
            list = list.sublist(0, maxCount!);
          }
          if (list.isEmpty) return const SizedBox.shrink();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Theme.of(context).hintColor,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
              ...list.map((peer) => _PeerRow(peer: peer, tab: tab)),
            ],
          );
        },
      ),
    );
  }
}

class _PeerRow extends StatelessWidget {
  final Peer peer;
  final PeerTabIndex tab;

  const _PeerRow({required this.peer, required this.tab});

  void _showContextMenu(BuildContext context, Offset position) async {
    final isAb = tab == PeerTabIndex.ab;
    final favs = (await bind.mainGetFav()).toList();
    final isFavorite = favs.contains(peer.id);
    final items = <PopupMenuEntry<void>>[
      PopupMenuItem(
        child: ListTile(
          leading: const Icon(Icons.link),
          title: Text(translate('Connect')),
          contentPadding: EdgeInsets.zero,
        ),
        onTap: () => connectInPeerTab(context, peer, tab),
      ),
      PopupMenuItem(
        child: ListTile(
          leading: Icon(isFavorite ? Icons.star : Icons.star_outline),
          title: Text(isFavorite ? 'Quitar de favoritos' : translate('Add to Favorites')),
          contentPadding: EdgeInsets.zero,
        ),
        onTap: () async {
          if (isFavorite) {
            favs.remove(peer.id);
            await bind.mainStoreFav(favs: favs);
            if (context.mounted) showToast(translate('Successful'));
          } else {
            favs.add(peer.id);
            await bind.mainStoreFav(favs: favs);
            if (context.mounted) showToast(translate('Successful'));
          }
        },
      ),
      if (isAb) ...[
        const PopupMenuDivider(),
        PopupMenuItem(
          child: ListTile(
            leading: const Icon(Icons.edit),
            title: const Text('Editar'),
            contentPadding: EdgeInsets.zero,
          ),
          onTap: () { /* TODO: editar dirección en Direcciones */ },
        ),
        PopupMenuItem(
          child: ListTile(
            leading: const Icon(Icons.delete_outline),
            title: Text(translate('Delete')),
            contentPadding: EdgeInsets.zero,
          ),
          onTap: () { /* TODO: eliminar de Direcciones */ },
        ),
      ],
    ];
    await showMenu<void>(
      context: context,
      position: RelativeRect.fromLTRB(position.dx, position.dy, position.dx, position.dy),
      items: items,
    );
  }

  @override
  Widget build(BuildContext context) {
    final displayName = peer.alias.isEmpty ? peer.id : peer.alias;
    return Obx(() {
      final color = _peerStatusColor(peer);
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => connectInPeerTab(context, peer, tab),
          onSecondaryTapDown: (details) => _showContextMenu(context, details.globalPosition),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: color.withOpacity(0.5),
                        blurRadius: 4,
                        spreadRadius: 0,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    displayName,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    });
  }
}
