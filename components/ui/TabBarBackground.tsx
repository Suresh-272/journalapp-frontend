import { Platform } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { View } from 'react-native';

export default function TabBarBackground() {
  const colorScheme = useColorScheme();
  
  if (Platform.OS === 'android') {
    return (
      <View 
        style={{
          flex: 1,
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        }}
      />
    );
  }
  
  // For web and other platforms, return undefined to use default
  return undefined;
}

export function useBottomTabOverflow() {
  return 0;
}
