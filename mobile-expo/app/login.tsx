import { GlassButton } from '@/src/components/GlassButton';
import { GlassCard } from '@/src/components/GlassCard';
import { AlbesaColors } from '@/src/theme/albesa';
import { useAuth } from '@/src/services/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('info@albesa.tech');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error de inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1a120c', AlbesaColors.bgDark, '#0a0a0b']} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
      >
        <Animated.View entering={FadeIn.duration(600)} style={styles.brand}>
          <View style={styles.logoOrb} />
          <Text style={styles.brandTitle}>ATS Desk</Text>
          <Text style={styles.brandSub}>Albesa Tech Solutions</Text>
        </Animated.View>

        <GlassCard style={styles.card}>
          <Text style={styles.label}>Correo corporativo</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={AlbesaColors.textSecondary}
          />
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={AlbesaColors.textSecondary}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <GlassButton label="Entrar" onPress={onSubmit} loading={loading} style={{ marginTop: 8 }} />
        </GlassCard>

        <Text style={styles.footer}>Misma cuenta que albesa.tech · Supabase Auth</Text>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 22, justifyContent: 'center' },
  brand: { alignItems: 'center', marginBottom: 32 },
  logoOrb: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: AlbesaColors.accent,
    marginBottom: 16,
    shadowColor: AlbesaColors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  brandTitle: { color: AlbesaColors.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  brandSub: { color: AlbesaColors.textSecondary, marginTop: 4, fontSize: 15 },
  card: { marginBottom: 20 },
  label: { color: AlbesaColors.textSecondary, fontSize: 13, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: AlbesaColors.surface,
    borderRadius: 14,
    padding: 14,
    color: AlbesaColors.text,
    borderWidth: 1,
    borderColor: AlbesaColors.border,
    fontSize: 16,
  },
  error: { color: AlbesaColors.danger, marginTop: 10, fontSize: 13 },
  footer: { textAlign: 'center', color: AlbesaColors.textSecondary, fontSize: 12 },
});
