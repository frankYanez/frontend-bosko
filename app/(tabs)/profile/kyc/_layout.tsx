import { Stack } from 'expo-router';

export default function KYCLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="document" />
    </Stack>
  );
}
