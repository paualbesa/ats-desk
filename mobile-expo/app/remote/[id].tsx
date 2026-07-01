import { AlbesaColors } from '@/src/theme/albesa';
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

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorTitle}>Error de sesión</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (!webBase || !sessionHash) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={AlbesaColors.accent} />
        <Text style={styles.loadingText}>{status}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backIcon}>
          <Ionicons name="chevron-back" size={24} color={AlbesaColors.textOnDark} />
        </Pressable>
        <View style={styles.topMeta}>
          <Text style={styles.peerId}>{id}</Text>
          <Text style={styles.status}>{status}</Text>
        </View>
        <Pressable onPress={() => setToolbarVisible((v) => !v)} hitSlop={12}>
          <Ionicons
            name={toolbarVisible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={AlbesaColors.textSecondaryOnDark}
          />
        </Pressable>
      </View>

      <WebView
        ref={webRef}
        source={{ uri: `${webBase}${sessionHash}` }}
        style={styles.web}
        onNavigationStateChange={onNavChange}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        onError={() => setStatus('Error de conexión WebView')}
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
  center: { flex: 1, backgroundColor: AlbesaColors.bgDark, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: AlbesaColors.textSecondaryOnDark, marginTop: 14, fontSize: 14 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: AlbesaColors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: AlbesaColors.border,
    gap: 8,
  },
  backIcon: { padding: 4 },
  topMeta: { flex: 1 },
  peerId: { color: AlbesaColors.textOnDark, fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  status: { color: AlbesaColors.textSecondaryOnDark, fontSize: 12, marginTop: 2 },
  web: { flex: 1, backgroundColor: '#000' },
  errorTitle: { color: AlbesaColors.danger, fontSize: 20, fontWeight: '700' },
  errorText: { color: AlbesaColors.textSecondaryOnDark, textAlign: 'center', marginTop: 10 },
  backBtn: { marginTop: 20, backgroundColor: AlbesaColors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  backBtnText: { color: '#fff', fontWeight: '700' },
});
