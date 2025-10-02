import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: Platform.select({
          android: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: 2,
            marginBottom: 2,
          },
          default: {},
        }),
        tabBarIconStyle: Platform.select({
          android: {
            marginTop: 2,
            marginBottom: 2,
          },
          default: {},
        }),
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          android: {
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
            paddingHorizontal: 16,
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            borderTopWidth: 1,
            borderTopColor: Colors[colorScheme ?? 'light'].border,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          default: {
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Entries',
          tabBarIcon: ({ color }) => <IconSymbol size={Platform.OS === 'android' ? 22 : 28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="new-entry"
        options={{
          title: 'New Entry',
          tabBarIcon: ({ color }) => <IconSymbol size={Platform.OS === 'android' ? 22 : 28} name="square.and.pencil" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <IconSymbol size={Platform.OS === 'android' ? 22 : 28} name="calendar" color={color} />,
        }}
      />
      
      
      <Tabs.Screen
        name="weekly-mood"
        options={{
          title: 'Weekly',
          tabBarIcon: ({ color }) => <IconSymbol size={Platform.OS === 'android' ? 22 : 28} name="chart.line.uptrend.xyaxis" color={color} />,
        }}
      />



    </Tabs>
  );
}
