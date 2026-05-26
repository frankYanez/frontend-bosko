import React, { useEffect, useRef } from "react";
import { Redirect, Stack, Tabs, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { AuthProvider } from "@/features/auth/state/AuthContext";
import { ProfileProvider } from "@/features/profile/state/ProfileContext";
import { OrdersProvider } from "@/features/orders/state/OrdersContext";
import { PaymentsProvider } from "@/features/payments/state/PaymentContext";
import { PostsProvider } from "@/features/servicesUser/state/PostsContext";
import { ReviewsProvider } from "@/features/servicesUser/state/ReviewsContext";
import { ServicesProvider } from "@/features/servicesUser/state/ServicesContext";
import { UsersProvider } from "@/contexts/UsersContext";
import { CategoriesProvider } from "@/contexts/CategoriesContext";
import { ProvidersProvider } from "@/contexts/ProvidersContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { KYCProvider } from "@/features/kyc/state/KYCContext";
import { NotificationsProvider } from "@/features/notifications/state/NotificationsContext";
import { FavoritesProvider } from "@/features/favorites/state/FavoritesContext";
import { ToastRoot } from "@/core/components/Toast";

// Navega a la pantalla correcta según el payload de la notificación
function useNotificationNavigation() {
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Notificación que abrió la app (cold start)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });

    // Tap en notificación con app en foreground / background
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

export default function _layout() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <UsersProvider>
          <CategoriesProvider>
            <ProvidersProvider>
              <ServicesProvider>
                <SearchProvider>
                  <PaymentsProvider>
                    <OrdersProvider>
                      <PostsProvider serviceId="global">
                        <ReviewsProvider providerId="global">
                          <KYCProvider>
                            <NotificationsProvider>
                              <FavoritesProvider>
                                <RootLayoutNav />
                                <ToastRoot />
                              </FavoritesProvider>
                            </NotificationsProvider>
                          </KYCProvider>
                        </ReviewsProvider>
                      </PostsProvider>
                    </OrdersProvider>
                  </PaymentsProvider>
                </SearchProvider>
              </ServicesProvider>
            </ProvidersProvider>
          </CategoriesProvider>
        </UsersProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
