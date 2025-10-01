import React from "react";
import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="Services"
        options={{
          title: "Mis servicios",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="AddServices"
        options={{
          title: "Gestionar servicio",
          headerShown: true,
          presentation: "card",
        }}
      />
    </Stack>
  );
}
