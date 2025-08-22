import { Stack } from 'expo-router';

export default function WeeklyMoodLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
