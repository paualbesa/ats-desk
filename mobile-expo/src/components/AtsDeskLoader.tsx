import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeContext';

/** Indicador de carga estilo Windows 11 (anillo suave). */
export function AtsDeskLoader({ label }: { label?: string }) {
  const { colors } = useTheme();
  const rot = useSharedValue(0);

  useEffect(() => {
    rot.value = withRepeat(
      withTiming(360, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rot]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.ring,
          ringStyle,
          { borderTopColor: colors.accent, borderRightColor: colors.accent },
        ]}
      />
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  ring: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'rgba(128,128,128,0.25)',
  },
  label: { fontSize: 14, fontWeight: '500' },
});
