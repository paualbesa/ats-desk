import { accentForOnline, AlbesaColors, AlbesaRadius } from '@/src/theme/albesa';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  online?: boolean;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  radius?: number;
  bordered?: boolean;
};

export function SquircleGlass({
  children,
  online = true,
  intensity = 55,
  tint = 'light',
  radius = AlbesaRadius.squircle,
  bordered = true,
  style,
  ...rest
}: Props) {
  const accent = accentForOnline(online);

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.wrap, { borderRadius: radius }, bordered && { borderColor: online ? 'rgba(232,118,46,0.2)' : AlbesaColors.border }, style]} {...rest}>
        <BlurView intensity={intensity} tint={tint} style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]} />
        <View style={[styles.inner, { borderRadius: radius }]}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.androidGlass,
        {
          borderRadius: radius,
          borderColor: bordered ? (online ? 'rgba(232,118,46,0.25)' : AlbesaColors.border) : 'transparent',
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export function AccentOrb({ online = true, size = 44 }: { online?: boolean; size?: number }) {
  const color = accentForOnline(online);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: color,
        shadowOpacity: online ? 0.35 : 0,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: AlbesaColors.bgGlass,
  },
  inner: { overflow: 'hidden' },
  androidGlass: {
    backgroundColor: AlbesaColors.bgCard,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
});
