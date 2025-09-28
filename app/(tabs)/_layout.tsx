// app/(tabs)/_layout.tsx
import { Tabs, useRouter } from "expo-router";
import { View, Pressable, Text, StyleSheet } from "react-native";
// import { useUser } from "@/hooks/useUser";
import { TOKENS } from "@/theme/tokens";

export default function TabsLayout() {
  const router = useRouter();
  // const { viewMode, hasServices } = useUser();

  // const onFabPress = () => {
  //   if (viewMode === "client") {
  //     router.push("/request/new");
  //   } else {
  //     router.push(hasServices ? "/pro/hub" : "/pro/services/new");
  //   }
  // };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarStyle: { height: 72, backgroundColor: "rgba(255,255,255,0.7)" },
          tabBarActiveTintColor: TOKENS.color.primary,
          tabBarInactiveTintColor: "#9A9AA0",
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{ title: "Inicio", tabBarIcon: () => <Text>🏠</Text> }}
        />
        <Tabs.Screen
          name="search/index"
          options={{ title: "Buscar", tabBarIcon: () => <Text>🔍</Text> }}
        />
        <Tabs.Screen
          name="orders/index"
          options={{ title: "Pedidos", tabBarIcon: () => <Text>📋</Text> }}
        />
        <Tabs.Screen
          name="messages/index"
          options={{ title: "Mensajes", tabBarIcon: () => <Text>💬</Text> }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{ title: "Perfil", tabBarIcon: () => <Text>👤</Text> }}
        />
      </Tabs>

      {/* FAB central
      <Pressable style={styles.fab} onPress={onFabPress}>
        <Text style={styles.fabText}>＋</Text>
      </Pressable> */}
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 32,
    left: "50%",
    transform: [{ translateX: -34 }],
    width: 68,
    height: 68,
    borderRadius: 999,
    backgroundColor: TOKENS.color.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 32, lineHeight: 32, fontWeight: "800" },
});
