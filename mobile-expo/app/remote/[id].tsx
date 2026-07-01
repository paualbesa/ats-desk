import { formatDeskId } from '@/src/hooks/useRecentPeers';
import { RemoteKeyboardSheet } from '@/src/components/RemoteKeyboardSheet';
import {
  RemoteToolbar,
  type TouchMode,
  type ZoomMode,
} from '@/src/components/RemoteToolbar';
import {
  buildDeskWebSessionUrl,
  ensureDeskWebClient,
} from '@/src/remote/deskWebClient';
import { WORKER_POLYFILL_SCRIPT } from '@/src/remote/workerPolyfill';
import { useTheme } from '@/src/theme/ThemeContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

export default function RemoteSessionScreen() {
  const { id, password } = useLocalSearchParams<{ id: string; password?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const webRef = useRef<WebView>(null);

  const [webBase, setWebBase] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Preparando cliente remoto…');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [touchMode, setTouchMode] = useState<TouchMode>('touch');
  const [zoom, setZoom] = useState<ZoomMode>('fit');

  const [sessionHash, setSessionHash] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [base, hash] = await Promise.all([
          ensureDeskWebClient(),
          buildDeskWebSessionUrl(String(id ?? ''), password ? String(password) : undefined),
        ]);
        if (!cancelled) {
          setWebBase(base);
          setSessionHash(hash);
          setStatus('Conectando…');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error al cargar cliente web');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, password]);

  const onNavChange = useCallback((nav: WebViewNavigation) => {
    if (nav.loading) return;
    if (nav.url.includes('#/')) setStatus('Sesión remota activa');
  }, []);

  const onWebError = useCallback((syntheticEvent: { nativeEvent: { description?: string } }) => {
    const desc = syntheticEvent.nativeEvent.description ?? 'Error de conexión';
    setError(desc);
  }, []);

  const injectKey = useCallback((code: string) => {
    const js = `(function(){try{window.dispatchEvent(new KeyboardEvent('keydown',{key:'${code}',code:'${code}',bubbles:true}));}catch(e){}})();true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  const injectText = useCallback((text: string) => {
    const safe = JSON.stringify(text);
    webRef.current?.injectJavaScript(
      `(function(){try{var el=document.activeElement;if(el&&el.tagName==='INPUT'){el.value+=${safe};el.dispatchEvent(new Event('input',{bubbles:true}));}}catch(e){}})();true;`,
    );
  }, []);

  const displayId = formatDeskId(String(id ?? ''));

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, backgroundColor: colors.bgDark }]}>
        <Text style={[styles.errorTitle, { color: colors.danger }]}>Error de sesión</Text>
        <Text style={[styles.errorText, { color: colors.textSecondaryOnDark }]}>{error}</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (!webBase || !sessionHash) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, backgroundColor: colors.bgDark }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondaryOnDark }]}>{status}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 6,
            backgroundColor: colors.bgElevated,
            borderBottomColor: colors.borderDark,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backIcon}>
          <Ionicons name="chevron-back" size={24} color={colors.textOnDark} />
        </Pressable>
        <View style={styles.topMeta}>
          <Text style={[styles.peerId, { color: colors.textOnDark }]}>{displayId}</Text>
          <Text style={[styles.status, { color: colors.textSecondaryOnDark }]}>{status}</Text>
        </View>
        <Pressable onPress={() => setToolbarVisible((v) => !v)} hitSlop={12}>
          <Ionicons
            name={toolbarVisible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.textSecondaryOnDark}
          />
        </Pressable>
      </View>

      <WebView
        ref={webRef}
        source={{ uri: `${webBase}${sessionHash}` }}
        style={styles.web}
        onNavigationStateChange={onNavChange}
        onError={onWebError}
        injectedJavaScriptBeforeContentLoaded={WORKER_POLYFILL_SCRIPT}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        onHttpError={() => setStatus('Error HTTP en cliente remoto')}
      />

      {toolbarVisible && (
        <View style={{ paddingBottom: insets.bottom + 4 }}>
          <RemoteToolbar
            touchMode={touchMode}
            onTouchModeChange={setTouchMode}
            zoom={zoom}
            onZoomChange={setZoom}
            onKeyboard={() => setKeyboardOpen(true)}
            onDisconnect={() => router.back()}
            expanded
            onToggleExpand={() => setToolbarVisible(false)}
          />
        </View>
      )}

      <RemoteKeyboardSheet
        visible={keyboardOpen}
        onClose={() => setKeyboardOpen(false)}
        onSendText={injectText}
        onSendKey={injectKey}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 14, fontSize: 14 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  backIcon: { padding: 4 },
  topMeta: { flex: 1 },
  peerId: { fontSize: 17, fontWeight: '700', letterSpacing: 2, fontVariant: ['tabular-nums'] },
  status: { fontSize: 12, marginTop: 2 },
  web: { flex: 1, backgroundColor: '#000' },
  errorTitle: { fontSize: 20, fontWeight: '700' },
  errorText: { textAlign: 'center', marginTop: 10, lineHeight: 22 },
  backBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  backBtnText: { color: '#fff', fontWeight: '700' },
});
