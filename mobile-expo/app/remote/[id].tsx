import { AlbesaColors } from '@/src/theme/albesa';
import { buildDeskBridgeHtml, type BridgeMessage } from '@/src/remote/deskBridgeHtml';
import { RemoteKeyboardSheet } from '@/src/components/RemoteKeyboardSheet';
import {
  RemoteToolbar,
  type TouchMode,
  type ZoomMode,
} from '@/src/components/RemoteToolbar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

type BridgeMode = 'loading' | 'web' | 'native-bridge';

export default function RemoteSessionScreen() {
  const { id, password } = useLocalSearchParams<{ id: string; password?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const canvasRef = useRef({ width: 1, height: 1 });

  const [status, setStatus] = useState('Iniciando sesión…');
  const [bridgeMode, setBridgeMode] = useState<BridgeMode>('loading');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [toolbarExpanded, setToolbarExpanded] = useState(true);
  const [touchMode, setTouchMode] = useState<TouchMode>('touch');
  const [zoom, setZoom] = useState<ZoomMode>('fit');

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);

  const html = useMemo(
    () => buildDeskBridgeHtml(String(id ?? ''), password ? String(password) : undefined),
    [id, password],
  );

  const postBridge = useCallback((payload: object) => {
    const js = `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify(payload))}}));true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  const onWebMessage = useCallback((e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as BridgeMessage;
      if (msg.type === 'status') setStatus(msg.message);
      if (msg.type === 'ready') {
        setBridgeMode(msg.mode === 'web' ? 'web' : 'native-bridge');
        setStatus(
          msg.mode === 'web'
            ? 'Cliente web conectado'
            : 'Puente listo · gestos activos (vídeo nativo en fase 2)',
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  const normCoords = useCallback((x: number, y: number) => {
    const { width, height } = canvasRef.current;
    return {
      x: Math.max(0, Math.min(1, x / width)),
      y: Math.max(0, Math.min(1, y / height)),
    };
  }, []);

  const sendMouse = useCallback(
    (x: number, y: number, button: number, action: string) => {
      postBridge({ type: 'mouse', x, y, button, action, touchMode });
    },
    [postBridge, touchMode],
  );

  const sendKey = useCallback(
    (code: string, down = true) => {
      postBridge({ type: 'key', code, down });
    },
    [postBridge],
  );

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(3, Math.max(0.5, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const twoFingerPan = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      translateX.value = panStartX.value + e.translationX;
      translateY.value = panStartY.value + e.translationY;
    })
    .onEnd(() => {
      panStartX.value = translateX.value;
      panStartY.value = translateY.value;
    });

  const mouseDrag = Gesture.Pan()
    .maxPointers(1)
    .enabled(touchMode === 'mouse')
    .onUpdate((e) => {
      const { x, y } = normCoords(e.x, e.y);
      sendMouse(x, y, 1, 'move');
    })
    .onEnd((e) => {
      const { x, y } = normCoords(e.x, e.y);
      sendMouse(x, y, 1, 'click');
    });

  const touchPan = Gesture.Pan()
    .maxPointers(1)
    .enabled(touchMode === 'touch')
    .onEnd((e) => {
      const { x, y } = normCoords(e.x, e.y);
      sendMouse(x, y, 1, 'tap');
    });

  const tap = Gesture.Tap()
    .enabled(touchMode === 'mouse')
    .onEnd((e) => {
      const { x, y } = normCoords(e.x, e.y);
      sendMouse(x, y, 1, 'click');
    });

  const longPress = Gesture.LongPress().onStart((e) => {
    const { x, y } = normCoords(e.x, e.y);
    sendMouse(x, y, 2, 'rightClick');
  });

  const canvasStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const pointerGesture = Gesture.Exclusive(
    longPress,
    touchMode === 'mouse' ? Gesture.Race(mouseDrag, tap) : touchPan,
  );
  const composed = Gesture.Simultaneous(pinch, twoFingerPan, pointerGesture);

  const showVideoOverlay = bridgeMode === 'native-bridge';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.peerId}>{id}</Text>
        <Text style={styles.status}>{status}</Text>
      </View>

      <View
        style={styles.canvasWrap}
        onLayout={(e) => {
          canvasRef.current = {
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          };
        }}
      >
        <GestureDetector gesture={composed}>
          <Animated.View style={[styles.canvas, canvasStyle]}>
            <WebView
              ref={webRef}
              originWhitelist={['*']}
              source={{ html }}
              style={[styles.web, showVideoOverlay && styles.webHidden]}
              onMessage={onWebMessage}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              scrollEnabled={false}
              bounces={false}
            />
            {showVideoOverlay && (
              <View style={styles.nativeOverlay} pointerEvents="none">
                <ActivityIndicator size="large" color={AlbesaColors.accent} />
                <Text style={styles.placeholderTitle}>ATS Desk · Albesa</Text>
                <Text style={styles.placeholderSub}>
                  Controles táctiles activos. Para vídeo en vivo, despliega el cliente web RustDesk y
                  define EXPO_PUBLIC_DESK_WEB_BASE en la app.
                </Text>
                <Text style={styles.hint}>
                  {touchMode === 'touch' ? 'Modo táctil' : 'Modo ratón'} · Pinch para zoom
                </Text>
              </View>
            )}
            {bridgeMode === 'loading' && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={AlbesaColors.accent} />
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>

      {toolbarExpanded && (
        <RemoteToolbar
          touchMode={touchMode}
          onTouchModeChange={setTouchMode}
          zoom={zoom}
          onZoomChange={(z) => {
            setZoom(z);
            if (z === 'fit') {
              scale.value = withSpring(1);
              savedScale.value = 1;
              translateX.value = withSpring(0);
              translateY.value = withSpring(0);
              panStartX.value = 0;
              panStartY.value = 0;
            } else {
              const s = parseInt(z, 10) / 100;
              scale.value = withSpring(s);
              savedScale.value = s;
            }
          }}
          onKeyboard={() => setKeyboardOpen(true)}
          onDisconnect={() => router.back()}
          expanded={toolbarExpanded}
          onToggleExpand={() => setToolbarExpanded((v) => !v)}
        />
      )}

      <RemoteKeyboardSheet
        visible={keyboardOpen}
        onClose={() => setKeyboardOpen(false)}
        onSendText={(t) => postBridge({ type: 'text', value: t })}
        onSendKey={(k) => sendKey(k)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AlbesaColors.bgDark },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: AlbesaColors.border,
  },
  peerId: { color: AlbesaColors.text, fontSize: 20, fontWeight: '700', letterSpacing: 1 },
  status: { color: AlbesaColors.textSecondary, fontSize: 13, marginTop: 4 },
  canvasWrap: { flex: 1, overflow: 'hidden' },
  canvas: { flex: 1, overflow: 'hidden' },
  web: { flex: 1, backgroundColor: '#000' },
  webHidden: { opacity: 0, position: 'absolute', width: '100%', height: '100%' },
  nativeOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#111',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D0F',
  },
  placeholderTitle: { color: AlbesaColors.text, fontSize: 22, fontWeight: '700', marginTop: 16 },
  placeholderSub: {
    color: AlbesaColors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    fontSize: 14,
  },
  hint: { color: AlbesaColors.accent, marginTop: 20, fontWeight: '600' },
});
