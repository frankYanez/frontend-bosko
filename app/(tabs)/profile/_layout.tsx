import React from 'react';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="Services" />
      <Stack.Screen name="AddServices" options={{ presentation: 'modal' }} />
      <Stack.Screen name="ChangePassword" />
      <Stack.Screen name="Notifications" />
      <Stack.Screen name="Payments" />
      <Stack.Screen name="kyc" />
      <Stack.Screen name="delete-account" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
