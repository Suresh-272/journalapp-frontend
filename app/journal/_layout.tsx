import { Stack } from 'expo-router';

export default function JournalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="detail" />
    </Stack>
  );
} 