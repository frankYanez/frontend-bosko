import React from "react";
import { Redirect, Tabs } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";
import { OrdersProvider } from "@/context/OdersContext";
import { PaymentsProvider } from "@/context/PaymentContext";
import { PostsProvider } from "@/context/PostsContext";
import { ReviewsProvider } from "@/context/ReviewsContext";
import { ServicesProvider } from "@/context/ServicesContext";
import { UserProvider } from "@/context/UserContext";

export default function _layout() {
  return (
    <AuthProvider>
      <UserProvider>
        <PaymentsProvider>
          <OrdersProvider>
            <PostsProvider serviceId="global">
              <ReviewsProvider serviceId="global">
                <ServicesProvider>
                  <Redirect href="/(tabs)" />
                  <Tabs
                    screenOptions={{
                      headerShown: false,
                      tabBarStyle: {
                        display: "none",
                      },
                    }}
                  />
                </ServicesProvider>
              </ReviewsProvider>
            </PostsProvider>
          </OrdersProvider>
        </PaymentsProvider>
      </UserProvider>
    </AuthProvider>
  );
}
