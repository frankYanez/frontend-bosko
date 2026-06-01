import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/core/query/queryClient";
import { AuthProvider } from "@/features/auth/state/AuthContext";
import { ServicesProvider } from "@/features/servicesUser/state/ServicesContext";
import { ToastRoot } from "@/core/components/Toast";
import { usePushNotificationSetup } from "@/hooks/usePushNotificationSetup";
import { useThemeColors } from "@/stores/theme.store";

function useNotificationNavigation() {
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    return () => responseListener.current?.remove();
  }, []);
}

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as Record<string, string> | undefined;
  if (!data) return;

  try {
    if (data.type === 'order' && data.orderId) {
      router.push({ pathname: '/(tabs)/orders/[id]', params: { id: data.orderId } });
    } else if (data.type === 'chat' && data.orderId) {
      router.push({ pathname: '/chat/[id]', params: { id: data.orderId } });
    } else if (data.type === 'review' && data.orderId) {
      router.push({ pathname: '/(tabs)/orders/[id]', params: { id: data.orderId } });
    } else {
      router.push('/(tabs)/profile/Notifications' as any);
    }
  } catch {}
}

function RootLayoutNav() {
  useNotificationNavigation();
  usePushNotificationSetup();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="service-form" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}

function ThemedRoot() {
  const colors = useThemeColors();
  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ServicesProvider>
        <RootLayoutNav />
        <ToastRoot />
      </ServicesProvider>
    </View>
  );
}

export default function _layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemedRoot />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
