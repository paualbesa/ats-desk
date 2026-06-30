import { AlbesaColors } from '@/src/theme/albesa';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AlbesaColors.accent,
        tabBarInactiveTintColor: AlbesaColors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Conectar',
          tabBarIcon: ({ color, size }) => <Ionicons name="desktop-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Recientes',
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: AlbesaColors.border,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : AlbesaColors.bgElevated,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 8,
  },
});
