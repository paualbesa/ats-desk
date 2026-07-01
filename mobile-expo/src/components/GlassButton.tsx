import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AlbesaColors, AlbesaRadius } from '@/src/theme/albesa';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
  style?: ViewStyle;
};

export function GlassButton({ label, onPress, loading, variant = 'primary', style }: Props) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (variant === 'ghost') {
    return (
      <AnimatedPressable
        onPressIn={() => {
          scale.value = withSpring(0.96);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={handlePress}
        style={[styles.ghost, anim, style]}
      >
        <Text style={styles.ghostText}>{label}</Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.96);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={handlePress}
      disabled={loading}
      style={[anim, style]}
    >
      <LinearGradient
        colors={[AlbesaColors.accentLight, AlbesaColors.accent, AlbesaColors.accentDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primary}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>{label}</Text>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    borderRadius: AlbesaRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: AlbesaColors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  ghost: {
    borderRadius: AlbesaRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: AlbesaColors.border,
    alignItems: 'center',
  },
  ghostText: {
    color: AlbesaColors.text,
    fontWeight: '600',
    fontSize: 15,
  },
});
