// app/(splash)/_layout.tsx
import { Stack } from 'expo-router';

export default function SplashLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}