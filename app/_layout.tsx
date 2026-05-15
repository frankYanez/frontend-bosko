import React from "react";
import { Redirect, Stack, Tabs } from "expo-router";
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

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
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
                              <RootLayoutNav />
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
