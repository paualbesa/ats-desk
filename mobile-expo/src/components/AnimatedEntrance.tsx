import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

type Props = {
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle;
};

export function AnimatedEntrance({ children, index = 0, style }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(index * 60, withSpring(1));
    translateY.value = withDelay(index * 60, withSpring(0));
  }, [index, opacity, translateY]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()} style={[style, anim]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({});
