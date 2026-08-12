import { Stack } from "expo-router";

export default function AuthModalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: "modal" }}>
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="verify-reset-code" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
