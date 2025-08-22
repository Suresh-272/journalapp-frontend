import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    // Handwriting fonts for journal aesthetic
    'PatrickHand-Regular': require('../assets/fonts/PatrickHand-Regular.ttf'),
    'Caveat-Regular': require('../assets/fonts/Caveat-Regular.ttf'),
    'Caveat-Medium': require('../assets/fonts/Caveat-Medium.ttf'),
    'Caveat-Bold': require('../assets/fonts/Caveat-Bold.ttf'),
    'DancingScript-Regular': require('../assets/fonts/DancingScript-Regular.ttf'),
    'DancingScript-Medium': require('../assets/fonts/DancingScript-Medium.ttf'),
    'DancingScript-SemiBold': require('../assets/fonts/DancingScript-SemiBold.ttf'),
    'DancingScript-Bold': require('../assets/fonts/DancingScript-Bold.ttf'),
    'Handlee-Regular': require('../assets/fonts/Handlee-Regular.ttf'),
    'AmaticSC-Regular': require('../assets/fonts/AmaticSC-Regular.ttf'),
    'AmaticSC-Bold': require('../assets/fonts/AmaticSC-Bold.ttf'),
    
    // Keep existing Inter fonts for UI elements that need clean readability
    'Inter-Regular': require('../assets/fonts/Inter_18pt-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter_24pt-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter_24pt-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter_24pt-Bold.ttf'),
    
    // Keep SpaceMono for code/technical elements if needed
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(splash)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
