import { Stack, useSegments, Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from '@/src/services/auth';
import { AlbesaColors } from '@/src/theme/albesa';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={AlbesaColors.accent} />
      </View>
    );
  }

  const inAuth = segments[0] === 'login';

  if (!session && !inAuth) return <Redirect href="/login" />;
  if (session && inAuth) return <Redirect href="/" />;

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
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
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: AlbesaColors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
