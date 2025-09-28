import { View, Text } from "react-native";
import React from "react";
import { Slot, Stack } from "expo-router";

export default function _layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerTitle: "Perfil" }} />
    </Stack>
  );
}
