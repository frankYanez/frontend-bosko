import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { globalStyles } from "@/styles/global-styles";
import { SafeAreaView } from "react-native";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: globalStyles.colorPrimary }}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: globalStyles.colorPrimary,
          tabBarShowLabel: false, // Show the title
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 50,
            borderTopWidth: 0,
            alignItems: "center",
            justifyContent: "center",
          },
        }}
      >
        <Tabs.Screen
          name="chat"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="comment" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reels"
          options={{
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="video-camera" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
