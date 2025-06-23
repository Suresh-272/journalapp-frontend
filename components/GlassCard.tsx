import { BlurView } from 'expo-blur';
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';

type GlassCardProps = {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
};

export function GlassCard({ children, style, intensity = 50 }: GlassCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, style]}>
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  content: {
    padding: 16,
  },
});