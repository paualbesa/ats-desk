import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { AlbesaColors, AlbesaRadius } from '@/src/theme/albesa';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
};

export function GlassCard({ children, style, intensity = 40 }: Props) {
  const content = (
    <LinearGradient
      colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style]}
    >
      <View style={styles.inner}>{children}</View>
    </LinearGradient>
  );

  if (Platform.OS === 'web') {
    return <View style={[styles.fallback, style]}>{children}</View>;
  }

  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.blur, style]}>
      {content}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: {
    borderRadius: AlbesaRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AlbesaColors.border,
  },
  gradient: {
    borderRadius: AlbesaRadius.lg,
    overflow: 'hidden',
  },
  inner: {
    padding: 16,
  },
  fallback: {
    borderRadius: AlbesaRadius.lg,
    backgroundColor: AlbesaColors.bgElevated,
    borderWidth: 1,
    borderColor: AlbesaColors.border,
    padding: 16,
  },
});
