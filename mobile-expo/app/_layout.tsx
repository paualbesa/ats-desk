import { Stack, useSegments, Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from '@/src/services/auth';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // La app es de uso libre: cualquiera puede usarla sin iniciar sesión.
  // Al entrar se muestra directamente la página principal y el login queda oculto.
  const inAuth = segments[0] === 'login';
  if (inAuth) return <Redirect href="/" />;

  return <>{children}</>;
}

function RootStack() {
  return (
    <NavigationGuard>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="login" />
        <Stack.Screen
          name="remote/[id]"
          options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
        />
      </Stack>
    </NavigationGuard>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <RootStack />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
