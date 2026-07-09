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
import { useKeepAwake } from 'expo-keep-awake';
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
  // Mantener la pantalla encendida durante toda la sesión remota (evita cortes/lag por sleep).
  useKeepAwake();
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
  const [reloadKey, setReloadKey] = useState(0);
  const retries = useRef(0);
  const MAX_RETRIES = 4;

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
    // Reintento automático con backoff antes de rendirse: mejora la robustez ante
    // cortes de red o arranques lentos del servidor de relay.
    if (retries.current < MAX_RETRIES) {
      retries.current += 1;
      setStatus(`Reintentando conexión (${retries.current}/${MAX_RETRIES})…`);
      const delay = 800 * retries.current;
      setTimeout(() => setReloadKey((k) => k + 1), delay);
    } else {
      setError(desc);
    }
  }, []);

  const retryNow = useCallback(() => {
    retries.current = 0;
    setError('');
    setStatus('Conectando…');
    setReloadKey((k) => k + 1);
  }, []);

  const injectKey = useCallback((code: string) => {
    // Enviar keydown + keyup (un solo keydown no lo procesan bien muchos clientes) al canvas remoto y a window.
    const js = `(function(){try{var t=document.querySelector('canvas')||document.activeElement||document.body;['keydown','keyup'].forEach(function(type){var ev={key:'${code}',code:'${code}',bubbles:true};try{t.dispatchEvent(new KeyboardEvent(type,ev));}catch(e){}try{window.dispatchEvent(new KeyboardEvent(type,ev));}catch(e){}});}catch(e){}})();true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  // Zoom real del lienzo remoto: 'fit' quita el escalado; '100'/'150' escala el canvas por CSS.
  const applyZoom = useCallback((z: ZoomMode) => {
    const scale = z === '150' ? 1.5 : z === '100' ? 1 : 0;
    const js = `(function(){try{var id='ats-zoom-style';var el=document.getElementById(id);if(${scale === 0}){if(el)el.remove();return;}if(!el){el=document.createElement('style');el.id=id;document.head.appendChild(el);}el.textContent='canvas{transform-origin:0 0 !important;transform:scale(${scale}) !important;image-rendering:auto;}';}catch(e){}})();true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  useEffect(() => {
    if (webBase && sessionHash) applyZoom(zoom);
  }, [zoom, webBase, sessionHash, applyZoom]);

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
        <Pressable onPress={retryNow} style={[styles.backBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.backBtnText}>Reintentar</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
          <Text style={[styles.secondaryBtnText, { color: colors.textSecondaryOnDark }]}>Volver</Text>
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
        key={reloadKey}
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
        // Fluidez: composición por GPU y sin scroll/overscroll que reste framerate.
        androidLayerType="hardware"
        renderToHardwareTextureAndroid
        cacheEnabled
        overScrollMode="never"
        bounces={false}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
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
  secondaryBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 10 },
  secondaryBtnText: { fontWeight: '600' },
});
