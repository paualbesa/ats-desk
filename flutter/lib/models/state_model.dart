import 'package:desktop_multi_window/desktop_multi_window.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_hbb/common.dart';
import 'package:get/get.dart';

import '../consts.dart';
import './platform_model.dart';

enum SvcStatus { notReady, connecting, ready }

/// Info de un slot de la cuadrícula cuando hay una ventana minimizada.
class GridSlotInfo {
  final int windowId;
  final String peerId;

  GridSlotInfo({required this.windowId, required this.peerId});
}

class StateGlobal {
  int _windowId = -1;
  final RxBool _fullscreen = false.obs;
  bool _isMinimized = false;
  final RxBool isMaximized = false.obs;
  final RxBool _showTabBar = true.obs;
  final RxDouble _resizeEdgeSize = RxDouble(windowResizeEdgeSize);
  final RxDouble _windowBorderWidth = RxDouble(kWindowBorderWidth);
  final RxBool showRemoteToolBar = false.obs;
  final svcStatus = SvcStatus.notReady.obs;
  final RxInt videoConnCount = 0.obs;
  final RxBool isFocused = false.obs;
  // for mobile and web
  bool isInMainPage = true;
  bool isWebVisible = true;

  final isPortrait = false.obs;

  final updateUrl = ''.obs;

  String _inputSource = '';

  // Track relative mouse mode state for each peer connection.
  // Key: peerId, Value: true if relative mouse mode is active.
  // Note: This is session-only runtime state, NOT persisted to config.
  final RxMap<String, bool> relativeMouseModeState = <String, bool>{}.obs;

  /// IDs de peers en proceso de conexión (para indicador naranja en lista).
  final RxList<String> connectingPeerIds = RxList<String>();

  /// IDs de peers con sesión de escritorio remoto abierta (para indicador verde en lista).
  final RxList<String> connectedPeerIds = RxList<String>();

  /// Estado online por ID para la lista de Direcciones (actualizado por queryOnlines).
  final RxMap<String, bool> addressListOnlineStates = <String, bool>{}.obs;

  /// Slot index -> ventana minimizada (windowId, peerId). Solo en ventana principal.
  final RxMap<int, GridSlotInfo> gridSlotAssignments = <int, GridSlotInfo>{}.obs;

  /// Por windowId: callback para abrir el diálogo "Minimizar a cuadrícula" (solo ventana remota).
  final Map<int, VoidCallback?> showMinimizeToGridDialogByWindow = {};

  /// Ruta local de la miniatura "última imagen vista" por peer (peerId -> path). Se puede rellenar al cerrar sesión.
  final RxMap<String, String> lastSeenThumbnailPath = <String, String>{}.obs;

  /// IDs de favoritos (sincronizado con mainGetFav/mainStoreFav). Usar para UI reactiva sin N llamadas async.
  final RxList<String> favoriteIds = RxList<String>();

  // Use for desktop -> remote toolbar -> resolution
  final Map<String, Map<int, String?>> _lastResolutionGroupValues = {};

  int get windowId => _windowId;
  RxBool get fullscreen => _fullscreen;
  bool get isMinimized => _isMinimized;
  double get tabBarHeight => fullscreen.isTrue ? 0 : kDesktopRemoteTabBarHeight;
  RxBool get showTabBar => _showTabBar;
  RxDouble get resizeEdgeSize => _resizeEdgeSize;
  RxDouble get windowBorderWidth => _windowBorderWidth;

  resetLastResolutionGroupValues(String peerId) {
    _lastResolutionGroupValues[peerId] = {};
  }

  setLastResolutionGroupValue(
      String peerId, int currentDisplay, String? value) {
    if (!_lastResolutionGroupValues.containsKey(peerId)) {
      _lastResolutionGroupValues[peerId] = {};
    }
    _lastResolutionGroupValues[peerId]![currentDisplay] = value;
  }

  String? getLastResolutionGroupValue(String peerId, int currentDisplay) {
    return _lastResolutionGroupValues[peerId]?[currentDisplay];
  }

  setWindowId(int id) => _windowId = id;
  setMaximized(bool v) {
    if (!_fullscreen.isTrue) {
      if (isMaximized.value != v) {
        isMaximized.value = v;
        refreshResizeEdgeSize();
      }
      if (!isMacOS) {
        if (!v) applyWindowBorderPreference();
        else _windowBorderWidth.value = 0;
      }
    }
  }

  setMinimized(bool v) => _isMinimized = v;

  setFullscreen(bool v, {bool procWnd = true}) {
    if (_fullscreen.value != v) {
      _fullscreen.value = v;
      _showTabBar.value = !_fullscreen.value;
      if (isWebDesktop) {
        procFullscreenWeb();
      } else {
        procFullscreenNative(procWnd);
      }
    }
  }

  procFullscreenWeb() {
    final isFullscreen = ffiGetByName('fullscreen') == 'Y';
    String fullscreenValue = '';
    if (isFullscreen && _fullscreen.isFalse) {
      fullscreenValue = 'N';
    } else if (!isFullscreen && fullscreen.isTrue) {
      fullscreenValue = 'Y';
    }
    if (fullscreenValue.isNotEmpty) {
      ffiSetByName('fullscreen', fullscreenValue);
    }
  }

  /// Aplica la preferencia "ocultar bordes" (guardada en Flutter). Llamar al cambiar la opción o al iniciar.
  void applyWindowBorderPreference() {
    final hide = bind.getLocalFlutterOption(k: 'hide_window_borders') == 'Y';
    _windowBorderWidth.value = (fullscreen.isTrue || isMaximized.isTrue || hide)
        ? 0.0
        : kWindowBorderWidth;
  }

  procFullscreenNative(bool procWnd) {
    refreshResizeEdgeSize();
    print("fullscreen: $fullscreen, resizeEdgeSize: ${_resizeEdgeSize.value}");
    applyWindowBorderPreference();
    if (procWnd) {
      final wc = WindowController.fromWindowId(windowId);
      wc.setFullscreen(_fullscreen.isTrue).then((_) {
        // We remove the redraw (width + 1, height + 1), because this issue cannot be reproduced.
        // https://github.com/rustdesk/rustdesk/issues/9675
      });
    }
  }

  refreshResizeEdgeSize() => _resizeEdgeSize.value = fullscreen.isTrue
      ? kFullScreenEdgeSize
      : isMaximized.isTrue
          ? kMaximizeEdgeSize
          : windowResizeEdgeSize;

  String getInputSource({bool force = false}) {
    if (force || _inputSource.isEmpty) {
      _inputSource = bind.mainGetInputSource();
    }
    return _inputSource;
  }

  setInputSource(SessionID sessionId, String v) async {
    await bind.mainSetInputSource(sessionId: sessionId, value: v);
    _inputSource = bind.mainGetInputSource();
  }

  StateGlobal._() {
    if (isWebDesktop) {
      platformFFI.setFullscreenCallback((v) {
        _fullscreen.value = v;
      });
    }
  }

  static final StateGlobal instance = StateGlobal._();
}

// This final variable is initialized when the first time it is accessed.
final stateGlobal = StateGlobal.instance;
