import { AlbesaRadius } from '@/src/theme/albesa';
import { useTheme } from '@/src/theme/ThemeContext';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  online?: boolean;
  intensity?: number;
  radius?: number;
  bordered?: boolean;
  /** Si true, recorta hijos al squircle (evitar en inputs con texto) */
  clip?: boolean;
  padding?: number;
};

export function SquircleGlass({
  children,
  online = true,
  intensity = 55,
  radius = AlbesaRadius.squircle,
  bordered = true,
  clip = false,
  padding = 0,
  style,
  ...rest
}: Props) {
  const { colors, accent, isDark } = useTheme();
  const accentColor = accent(online);
  const borderColor = bordered
    ? online
      ? 'rgba(232,118,46,0.22)'
      : colors.border
    : 'transparent';

  const content = (
    <View style={[padding > 0 && { padding }, clip && { overflow: 'hidden', borderRadius: radius }]}>
      {children}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View
        style={[
          styles.wrap,
          { borderRadius: radius, borderColor, backgroundColor: colors.bgGlass },
          style,
        ]}
        {...rest}
      >
        <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
          <BlurView
            intensity={intensity}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        </View>
        {content}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.androidGlass,
        {
          borderRadius: radius,
          borderColor,
          backgroundColor: colors.bgCard,
          shadowColor: colors.shadow,
        },
        style,
      ]}
      {...rest}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    position: 'relative',
  },
  androidGlass: {
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
});
