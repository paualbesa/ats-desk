import 'dart:async';
import 'dart:collection';

import 'package:dynamic_layouts/dynamic_layouts.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hbb/consts.dart';
import 'package:flutter_hbb/models/ab_model.dart';
import 'package:flutter_hbb/models/peer_tab_model.dart';
import 'package:flutter_hbb/models/state_model.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:window_manager/window_manager.dart';

import '../../common.dart';
import '../../models/operator_shared_list_model.dart';
import '../../models/peer_model.dart';
import '../../models/platform_model.dart';
import 'peer_card.dart';
import 'peer_tab_page.dart';

typedef PeerFilter = bool Function(Peer peer);
typedef PeerCardBuilder = Widget Function(Peer peer);

String _translateChooseFromList() =>
    localeName.startsWith('es') ? 'Elegir de la lista' : translate('Choose from list');

class PeerSortType {
  static const String remoteId = 'Remote ID';
  static const String remoteHost = 'Remote Host';
  static const String username = 'Username';
  static const String status = 'Status';

  static List<String> values = [
    PeerSortType.remoteId,
    PeerSortType.remoteHost,
    PeerSortType.username,
    PeerSortType.status
  ];
}

class LoadEvent {
  static const String recent = 'load_recent_peers';
  static const String favorite = 'load_fav_peers';
  static const String lan = 'load_lan_peers';
  static const String addressBook = 'load_address_book_peers';
  static const String group = 'load_group_peers';
}

class PeersModelName {
  static const String recent = 'recent peer';
  static const String favorite = 'fav peer';
  static const String lan = 'discovered peer';
  static const String addressBook = 'address book peer';
  static const String group = 'group peer';
}

/// for peer search text, global obs value
final peerSearchText = "".obs;

/// for peer sort, global obs value
RxString? _peerSort;
RxString get peerSort {
  _peerSort ??= bind.getLocalFlutterOption(k: kOptionPeerSorting).obs;
  return _peerSort!;
}

// list for listener
RxList<RxString> get obslist => [peerSearchText, peerSort].obs;

final peerSearchTextController =
    TextEditingController(text: peerSearchText.value);

class _PeersView extends StatefulWidget {
  final Peers peers;
  final PeerFilter? peerFilter;
  final PeerCardBuilder peerCardBuilder;
  final PeerTabIndex peerTabIndex;

  const _PeersView(
      {required this.peers,
      required this.peerCardBuilder,
      required this.peerTabIndex,
      this.peerFilter,
      Key? key})
      : super(key: key);

  @override
  _PeersViewState createState() => _PeersViewState();
}

/// State for the peer widget.
class _PeersViewState extends State<_PeersView>
    with WindowListener, WidgetsBindingObserver {
  static const int _maxQueryCount = 3;
  final HashMap<String, String> _emptyMessages = HashMap.from({
    LoadEvent.recent: 'empty_recent_tip',
    LoadEvent.favorite: 'empty_favorite_tip',
    LoadEvent.lan: 'empty_lan_tip',
    LoadEvent.addressBook: 'empty_address_book_tip',
  });
  final space = (isDesktop || isWebDesktop) ? 12.0 : 8.0;
  final _curPeers = <String>{};
  var _lastChangeTime = DateTime.now();
  var _lastQueryPeers = <String>{};
  var _lastQueryTime = DateTime.now();
  var _lastWindowRestoreTime = DateTime.now();
  var _queryCount = 0;
  var _exit = false;
  bool _isActive = true;

  final _scrollController = ScrollController();

  _PeersViewState() {
    _startCheckOnlines();
  }

  @override
  void initState() {
    windowManager.addListener(this);
    WidgetsBinding.instance.addObserver(this);
    super.initState();
  }

  @override
  void dispose() {
    windowManager.removeListener(this);
    WidgetsBinding.instance.removeObserver(this);
    _exit = true;
    super.dispose();
  }

  @override
  void onWindowFocus() {
    _queryCount = 0;
    _isActive = true;
  }

  @override
  void onWindowBlur() {
    // We need this comparison because window restore (on Windows) also triggers `onWindowBlur()`.
    // Maybe it's a bug of the window manager, but the source code seems to be correct.
    //
    // Although `onWindowRestore()` is called after `onWindowBlur()` in my test,
    // we need the following comparison to ensure that `_isActive` is true in the end.
    if (isWindows &&
        DateTime.now().difference(_lastWindowRestoreTime) <
            const Duration(milliseconds: 300)) {
      return;
    }
    _queryCount = _maxQueryCount;
    _isActive = false;
  }

  @override
  void onWindowRestore() {
    // Window restore (on MacOS and Linux) also triggers `onWindowFocus()`.
    // But on Windows, it triggers `onWindowBlur()`, mybe it's a bug of the window manager.
    if (!isWindows) return;
    _queryCount = 0;
    _isActive = true;
    _lastWindowRestoreTime = DateTime.now();
  }

  @override
  void onWindowMinimize() {
    // Window minimize also triggers `onWindowBlur()`.
  }

  // This function is required for mobile.
  // `onWindowFocus` works fine for desktop.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    if (isDesktop || isWebDesktop) return;
    if (state == AppLifecycleState.resumed) {
      _isActive = true;
      _queryCount = 0;
    } else if (state == AppLifecycleState.inactive) {
      _isActive = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    // We should avoid too many rebuilds. MacOS(m1, 14.6.1) on Flutter 3.19.6.
    // Continious rebuilds of `ChangeNotifierProvider` will cause memory leak.
    // Simple demo can reproduce this issue.
    return ChangeNotifierProvider<Peers>.value(
      value: widget.peers,
      child: Consumer<Peers>(builder: (context, peers, child) {
        gFFI.peerTabModel.setCurrentTabCachedPeers(peers.peers);
        return Obx(() {
          // En modo cuadrícula mostrar siempre la cuadrícula (1/2/4/9/16 celdas), no el mensaje vacío
          if (peerCardUiType.value == PeerUiType.grid) {
            return _buildFullscreenGridConnections();
          }
          if (peers.peers.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.sentiment_very_dissatisfied_rounded,
                    color: Theme.of(context).tabBarTheme.labelColor,
                    size: 40,
                  ).paddingOnly(bottom: 10),
                  Text(
                    translate(
                      _emptyMessages[widget.peers.loadEvent] ?? 'Empty',
                    ),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Theme.of(context).tabBarTheme.labelColor,
                    ),
                  ),
                ],
              ),
            );
          }
          return _buildPeersView(peers);
        });
      }),
    );
  }

  onVisibilityChanged(VisibilityInfo info) {
    final peerId = _peerId((info.key as ValueKey).value);
    if (info.visibleFraction > 0.00001) {
      _curPeers.add(peerId);
    } else {
      _curPeers.remove(peerId);
    }
    _lastChangeTime = DateTime.now();
  }

  String _cardId(String id) => widget.peers.name + id;
  String _peerId(String cardId) => cardId.replaceAll(widget.peers.name, '');

  Widget _buildPeersView(Peers peers) {
    final updateEvent = peers.event;
    final body = ObxValue<RxList>((filters) {
      return FutureBuilder<List<Peer>>(
        builder: (context, snapshot) {
          if (snapshot.hasData) {
            var peers = snapshot.data!;
            if (peers.length > 1000) peers = peers.sublist(0, 1000);
            gFFI.peerTabModel.setCurrentTabCachedPeers(peers);
            buildOnePeer(Peer peer, bool isPortrait) {
              final visibilityChild = VisibilityDetector(
                key: ValueKey(_cardId(peer.id)),
                onVisibilityChanged: onVisibilityChanged,
                child: widget.peerCardBuilder(peer),
              );
              // `Provider.of<PeerTabModel>(context)` will causes infinete loop.
              // Because `gFFI.peerTabModel.setCurrentTabCachedPeers(peers)` will trigger `notifyListeners()`.
              //
              // No need to listen the currentTab change event.
              // Because the currentTab change event will trigger the peers change event,
              // and the peers change event will trigger _buildPeersView().
              return !isPortrait
                  ? Obx(() => peerCardUiType.value == PeerUiType.list
                      ? Container(height: 45, child: visibilityChild)
                      : peerCardUiType.value == PeerUiType.grid
                          ? SizedBox(
                              width: 220, height: 140, child: visibilityChild)
                          : SizedBox(
                              width: 220, height: 42, child: visibilityChild))
                  : Container(child: visibilityChild);
            }

            // We should avoid too many rebuilds. Win10(Some machines) on Flutter 3.19.6.
            // Continious rebuilds of `ListView.builder` will cause memory leak.
            // Simple demo can reproduce this issue.
            final Widget child = Obx(() {
              // En modo grid mostrar siempre la cuadrícula de conexiones (4/9/16 celdas)
              if (peerCardUiType.value == PeerUiType.grid) {
                return _buildFullscreenGridConnections();
              }

              return stateGlobal.isPortrait.isTrue
                  ? ListView.builder(
                      itemCount: peers.length,
                      itemBuilder: (BuildContext context, int index) {
                        return buildOnePeer(peers[index], true).marginOnly(
                            top: index == 0 ? 0 : space / 2, bottom: space / 2);
                      },
                    )
                  : peerCardUiType.value == PeerUiType.list
                      ? ListView.builder(
                          controller: _scrollController,
                          itemCount: peers.length,
                          itemBuilder: (BuildContext context, int index) {
                            return buildOnePeer(peers[index], false).marginOnly(
                                right: space,
                                top: index == 0 ? 0 : space / 2,
                                bottom: space / 2);
                          },
                        )
                      : DynamicGridView.builder(
                          gridDelegate: SliverGridDelegateWithWrapping(
                              mainAxisSpacing: space / 2,
                              crossAxisSpacing: space),
                          itemCount: peers.length,
                          itemBuilder: (BuildContext context, int index) {
                            return buildOnePeer(peers[index], false);
                          });
            });

            if (updateEvent == UpdateEvent.load) {
              _curPeers.clear();
              _curPeers.addAll(peers.map((e) => e.id));
              _queryOnlines(true);
            }
            return child;
          } else {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }
        },
        future: matchPeers(filters[0].value, filters[1].value, peers.peers),
      );
    }, obslist);

    return body;
  }

  /// Cuadrícula que se adapta al 100% del espacio: 1, 2 (2 filas), 2x2, 3x3, 4x4.
  /// Las conexiones se abren en la ventana de pestañas (una sola ventana con varias pestañas).
  Widget _buildFullscreenGridConnections() {
    return Obx(() {
      final n = gridMultiConnectionSize.value;
      final rows = n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 2 : n <= 9 ? 3 : 4;
      final cols = n <= 1 ? 1 : n <= 2 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : 4;
      var index = 0;
      return LayoutBuilder(
        builder: (context, constraints) {
          return Column(
            children: List.generate(rows, (r) {
              return Expanded(
                child: Row(
                  children: List.generate(cols, (c) {
                    if (index >= n) return const SizedBox.shrink();
                    final i = index++;
                    return Expanded(
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(
                          c == 0 ? 0 : space / 2,
                          r == 0 ? 0 : space / 2,
                          space / 2,
                          space / 2,
                        ),
                        child: _ConnectionCell(key: ValueKey('connection_cell_$i')),
                      ),
                    );
                  }),
                ),
              );
            }),
          );
        },
      );
    });
  }

  var _queryInterval = const Duration(seconds: 20);

  void _startCheckOnlines() {
    () async {
      final p = await bind.mainIsUsingPublicServer();
      if (!p) {
        _queryInterval = const Duration(seconds: 6);
      }
      while (!_exit) {
        final now = DateTime.now();
        if (!setEquals(_curPeers, _lastQueryPeers)) {
          if (now.difference(_lastChangeTime) > const Duration(seconds: 1)) {
            _queryOnlines(false);
          }
        } else {
          final skipIfIsWeb =
              isWeb && !(stateGlobal.isWebVisible && stateGlobal.isInMainPage);
          final skipIfMobile =
              (isAndroid || isIOS) && !stateGlobal.isInMainPage;
          final skipIfNotActive = skipIfIsWeb || skipIfMobile || !_isActive;
          if (!skipIfNotActive && (_queryCount < _maxQueryCount || !p)) {
            if (now.difference(_lastQueryTime) >= _queryInterval) {
              if (_curPeers.isNotEmpty) {
                bind.queryOnlines(ids: _curPeers.toList(growable: false));
                _lastQueryTime = DateTime.now();
                _queryCount += 1;
              }
            }
          }
        }
        await Future.delayed(const Duration(milliseconds: 300));
      }
    }();
  }

  _queryOnlines(bool isLoadEvent) {
    if (_curPeers.isNotEmpty) {
      bind.queryOnlines(ids: _curPeers.toList(growable: false));
      _queryCount = 0;
    }
    _lastQueryPeers = {..._curPeers};
    if (isLoadEvent) {
      _lastChangeTime = DateTime.now();
    } else {
      _lastQueryTime = DateTime.now().subtract(_queryInterval);
    }
  }

  Future<List<Peer>>? matchPeers(
      String searchText, String sortedBy, List<Peer> peers) async {
    if (widget.peerFilter != null) {
      peers = peers.where((peer) => widget.peerFilter!(peer)).toList();
    }

    // fallback to id sorting
    if (!PeerSortType.values.contains(sortedBy)) {
      sortedBy = PeerSortType.remoteId;
      bind.setLocalFlutterOption(
        k: kOptionPeerSorting,
        v: sortedBy,
      );
    }

    if (widget.peers.loadEvent != LoadEvent.recent) {
      switch (sortedBy) {
        case PeerSortType.remoteId:
          peers.sort((p1, p2) => p1.getId().compareTo(p2.getId()));
          break;
        case PeerSortType.remoteHost:
          peers.sort((p1, p2) =>
              p1.hostname.toLowerCase().compareTo(p2.hostname.toLowerCase()));
          break;
        case PeerSortType.username:
          peers.sort((p1, p2) =>
              p1.username.toLowerCase().compareTo(p2.username.toLowerCase()));
          break;
        case PeerSortType.status:
          peers.sort((p1, p2) => p1.online ? -1 : 1);
          break;
      }
    }

    searchText = searchText.trim();
    if (searchText.isEmpty) {
      return peers;
    }
    searchText = searchText.toLowerCase();
    final matches = await Future.wait(
        peers.map((peer) => matchPeer(searchText, peer, widget.peerTabIndex)));
    final filteredList = List<Peer>.empty(growable: true);
    for (var i = 0; i < peers.length; i++) {
      if (matches[i]) {
        filteredList.add(peers[i]);
      }
    }

    return filteredList;
  }
}

class _ConnectionCell extends StatefulWidget {
  const _ConnectionCell({Key? key}) : super(key: key);

  @override
  State<_ConnectionCell> createState() => _ConnectionCellState();
}

class _ConnectionCellState extends State<_ConnectionCell> {
  final TextEditingController _idController = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  @override
  void dispose() {
    _idController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _showChooseFromList(BuildContext context) async {
    final id = await showChooseFromAddressListDialog(context);
    if (id != null && id.isNotEmpty && mounted) {
      _idController.text = id;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final borderColor = theme.dividerColor.withOpacity(0.4);
    return Container(
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 280, minHeight: 44),
                child: TextField(
                  controller: _idController,
                  focusNode: _focusNode,
                  decoration: InputDecoration(
                    hintText: translate('ID'),
                    isDense: false,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 12,
                    ),
                  ),
                  style: const TextStyle(fontSize: 14),
                  textInputAction: TextInputAction.done,
                  onSubmitted: (value) {
                    if (value.trim().isNotEmpty) {
                      connect(context, value.trim(), forceOpenInTabs: true);
                    }
                  },
                ),
              ),
            ),
            const SizedBox(height: 8),
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ElevatedButton(
                    onPressed: () {
                      final id = _idController.text.trim();
                      if (id.isNotEmpty) connect(context, id, forceOpenInTabs: true);
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      translate('Connect'),
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                  const SizedBox(width: 12),
                  OutlinedButton(
                    onPressed: () => _showChooseFromList(context),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      _translateChooseFromList(),
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Muestra diálogo para elegir un peer: operadores ven lista compartida (con opción añadir);
/// usuarios normales ven recientes/favoritos del tab actual.
Future<String?> showChooseFromListDialog(BuildContext context) async {
  final isOperator = gFFI.userModel.isAdmin.value;
  if (isOperator) {
    return await _showOperatorListDialog(context);
  }
  return await _showUserPeersListDialog(context);
}

/// Diálogo para elegir un ID de la lista de Direcciones (operatorSharedList, se actualiza al momento).
Future<String?> showChooseFromAddressListDialog(BuildContext context) async {
  return showDialog<String>(
    context: context,
    builder: (ctx) {
      return Obx(() {
        final entries = gFFI.operatorSharedListModel.entries.toList();
        return AlertDialog(
          title: Text(_translateChooseFromList()),
          content: SizedBox(
            width: 320,
            height: 350,
            child: entries.isEmpty
                ? Center(
                    child: Text(
                      translate('Empty'),
                      style: TextStyle(color: Theme.of(ctx).hintColor),
                    ),
                  )
                : ListView.builder(
                    itemCount: entries.length,
                    itemBuilder: (_, i) {
                      final e = entries[i];
                      final label = e.name.isEmpty ? e.id : '${e.name} (${e.id})';
                      final sub = e.name.isNotEmpty ? e.id : null;
                      return ListTile(
                        title: Text(label),
                        subtitle: sub != null ? Text(sub, style: const TextStyle(fontSize: 11)) : null,
                        onTap: () => Navigator.of(ctx).pop(e.id),
                      );
                    },
                  ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text(translate('Cancel')),
            ),
          ],
        );
      });
    },
  );
}

Future<String?> _showOperatorListDialog(BuildContext context) async {
  final model = gFFI.operatorSharedListModel;
  return showDialog<String>(
    context: context,
    builder: (ctx) {
      return AlertDialog(
        title: Text(_translateChooseFromList()),
        content: SizedBox(
          width: 320,
          height: 400,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              OutlinedButton.icon(
                onPressed: () async {
                  final idC = TextEditingController();
                  final nameC = TextEditingController();
                  await showDialog<bool>(
                    context: ctx,
                    builder: (c) => AlertDialog(
                      title: Text(translate('Add to shared list')),
                      content: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          TextField(
                            controller: idC,
                            decoration: InputDecoration(
                              labelText: translate('ID'),
                              border: const OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: nameC,
                            decoration: InputDecoration(
                              labelText: translate('Name'),
                              border: const OutlineInputBorder(),
                            ),
                          ),
                        ],
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(c).pop(false),
                          child: Text(translate('Cancel')),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            if (idC.text.trim().isNotEmpty) {
                              model.add(idC.text.trim(), nameC.text.trim());
                              Navigator.of(c).pop(true);
                            }
                          },
                          child: Text(translate('Add')),
                        ),
                      ],
                    ),
                  );
                },
                icon: const Icon(Icons.add, size: 18),
                label: Text(translate('Add to shared list')),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: Obx(() {
                  final list = model.entries;
                  if (list.isEmpty) {
                    return Center(
                      child: Text(
                        translate('Empty'),
                        style: TextStyle(color: Theme.of(ctx).hintColor),
                      ),
                    );
                  }
                  return ListView.builder(
                    itemCount: list.length,
                    itemBuilder: (_, i) {
                      final e = list[i];
                      return ListTile(
                        title: Text(e.name.isEmpty ? e.id : '${e.name} (${e.id})'),
                        subtitle: e.name.isNotEmpty ? Text(e.id, style: const TextStyle(fontSize: 11)) : null,
                        onTap: () => Navigator.of(ctx).pop(e.id),
                      );
                    },
                  );
                }),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(translate('Cancel')),
          ),
        ],
      );
    },
  );
}

Future<String?> _showUserPeersListDialog(BuildContext context) async {
  final peers = gFFI.peerTabModel.currentTabCachedPeers;
  if (peers.isEmpty) {
    if (context.mounted) {
      showToast(translate('Empty'));
    }
    return null;
  }
  return showDialog<String>(
    context: context,
    builder: (ctx) {
      return AlertDialog(
        title: Text(_translateChooseFromList()),
        content: SizedBox(
          width: 320,
          height: 350,
          child: ListView.builder(
            itemCount: peers.length,
            itemBuilder: (_, i) {
              final p = peers[i];
              final label = p.alias.isNotEmpty ? p.alias : p.id;
              final sub = p.alias.isNotEmpty ? p.id : null;
              return ListTile(
                title: Text(label),
                subtitle: sub != null ? Text(sub, style: const TextStyle(fontSize: 11)) : null,
                onTap: () => Navigator.of(ctx).pop(p.id),
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(translate('Cancel')),
          ),
        ],
      );
    },
  );
}

abstract class BasePeersView extends StatelessWidget {
  final PeerTabIndex peerTabIndex;
  final PeerFilter? peerFilter;
  final PeerCardBuilder peerCardBuilder;

  const BasePeersView({
    Key? key,
    required this.peerTabIndex,
    this.peerFilter,
    required this.peerCardBuilder,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Peers peers;
    switch (peerTabIndex) {
      case PeerTabIndex.recent:
        peers = gFFI.recentPeersModel;
        break;
      case PeerTabIndex.fav:
        peers = gFFI.favoritePeersModel;
        break;
      case PeerTabIndex.lan:
        peers = gFFI.lanPeersModel;
        break;
      case PeerTabIndex.ab:
        peers = gFFI.abModel.peersModel;
        break;
      case PeerTabIndex.group:
        peers = gFFI.groupModel.peersModel;
        break;
    }
    return _PeersView(
        peers: peers,
        peerFilter: peerFilter,
        peerCardBuilder: peerCardBuilder,
        peerTabIndex: peerTabIndex);
  }
}

class RecentPeersView extends BasePeersView {
  RecentPeersView(
      {Key? key, EdgeInsets? menuPadding, ScrollController? scrollController})
      : super(
          key: key,
          peerTabIndex: PeerTabIndex.recent,
          peerCardBuilder: (Peer peer) => RecentPeerCard(
            peer: peer,
            menuPadding: menuPadding,
          ),
        );

  @override
  Widget build(BuildContext context) {
    final widget = super.build(context);
    bind.mainLoadRecentPeers();
    return widget;
  }
}

class FavoritePeersView extends BasePeersView {
  FavoritePeersView(
      {Key? key, EdgeInsets? menuPadding, ScrollController? scrollController})
      : super(
          key: key,
          peerTabIndex: PeerTabIndex.fav,
          peerCardBuilder: (Peer peer) => FavoritePeerCard(
            peer: peer,
            menuPadding: menuPadding,
          ),
        );

  @override
  Widget build(BuildContext context) {
    final widget = super.build(context);
    bind.mainLoadFavPeers();
    return widget;
  }
}

class DiscoveredPeersView extends BasePeersView {
  DiscoveredPeersView(
      {Key? key, EdgeInsets? menuPadding, ScrollController? scrollController})
      : super(
          key: key,
          peerTabIndex: PeerTabIndex.lan,
          peerCardBuilder: (Peer peer) => DiscoveredPeerCard(
            peer: peer,
            menuPadding: menuPadding,
          ),
        );

  @override
  Widget build(BuildContext context) {
    final widget = super.build(context);
    bind.mainLoadLanPeers();
    bind.mainDiscover();
    return widget;
  }
}

class AddressBookPeersView extends BasePeersView {
  AddressBookPeersView(
      {Key? key, EdgeInsets? menuPadding, ScrollController? scrollController})
      : super(
          key: key,
          peerTabIndex: PeerTabIndex.ab,
          peerFilter: (Peer peer) =>
              _hitTag(gFFI.abModel.selectedTags, peer.tags),
          peerCardBuilder: (Peer peer) => AddressBookPeerCard(
            peer: peer,
            menuPadding: menuPadding,
          ),
        );

  static bool _hitTag(List<dynamic> selectedTags, List<dynamic> idents) {
    if (selectedTags.isEmpty) {
      return true;
    }
    // The result of a no-tag union with normal tags, still allows normal tags to perform union or intersection operations.
    final selectedNormalTags =
        selectedTags.where((tag) => tag != kUntagged).toList();
    if (selectedTags.contains(kUntagged)) {
      if (idents.isEmpty) return true;
      if (selectedNormalTags.isEmpty) return false;
    }
    if (gFFI.abModel.filterByIntersection.value) {
      for (final tag in selectedNormalTags) {
        if (!idents.contains(tag)) {
          return false;
        }
      }
      return true;
    } else {
      for (final tag in selectedNormalTags) {
        if (idents.contains(tag)) {
          return true;
        }
      }
      return false;
    }
  }
}

class MyGroupPeerView extends BasePeersView {
  MyGroupPeerView(
      {Key? key, EdgeInsets? menuPadding, ScrollController? scrollController})
      : super(
          key: key,
          peerTabIndex: PeerTabIndex.group,
          peerFilter: filter,
          peerCardBuilder: (Peer peer) => MyGroupPeerCard(
            peer: peer,
            menuPadding: menuPadding,
          ),
        );

  static bool filter(Peer peer) {
    final model = gFFI.groupModel;
    if (model.searchAccessibleItemNameText.isNotEmpty) {
      final text = model.searchAccessibleItemNameText.value;
      final searchPeersOfUser = peer.loginName.contains(text) &&
          model.users.any((user) => user.name == peer.loginName);
      final searchPeersOfDeviceGroup = peer.device_group_name.contains(text) &&
          model.deviceGroups.any((g) => g.name == peer.device_group_name);
      if (!searchPeersOfUser && !searchPeersOfDeviceGroup) {
        return false;
      }
    }
    if (model.selectedAccessibleItemName.isNotEmpty) {
      if (model.isSelectedDeviceGroup.value) {
        if (model.selectedAccessibleItemName.value != peer.device_group_name) {
          return false;
        }
      } else {
        if (model.selectedAccessibleItemName.value != peer.loginName) {
          return false;
        }
      }
    }
    return true;
  }
}
