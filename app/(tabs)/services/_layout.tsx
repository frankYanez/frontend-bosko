import { Stack } from "expo-router";
import { TOKENS } from "@/theme/tokens";

export default function ServicesLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: TOKENS.color.text,
        headerTitleAlign: "left",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: TOKENS.color.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="category/[id]"
        options={{
          title: "Servicios",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="provider/[id]"
        options={{
          title: "Perfil",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
