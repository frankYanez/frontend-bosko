import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PREMIUM } from "@/core/design-system";
import { useProfile } from "@/features/profile/state/ProfileContext";

export const PremiumBanner = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useProfile()

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[PREMIUM.colorPrimary, PREMIUM.colorPrimary, "#2d0a0a"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hola, {profile?.firstName}</Text>
            <Text style={styles.subGreeting}>¿Qué necesitas hoy?</Text>
          </View>
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push("/search")}
            >
              <Ionicons
                name="search-outline"
                size={24}
                color={PREMIUM.gold}
              />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={PREMIUM.gold}
              />
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      {/* Decorative bottom curve/fade */}
      <LinearGradient
        colors={["transparent", PREMIUM.background]}
        style={styles.bottomFade}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    ...PREMIUM.shadows.global,
    height: 280,
  },
  gradient: {
    paddingHorizontal: 20,
    paddingBottom: 30, // Reduced padding bottom since no search bar
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...PREMIUM.shadows.global,
    height: 280,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    // Removed fixed height to fit content naturally
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: PREMIUM.textPrimary,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 16,
    color: PREMIUM.textSecondary,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PREMIUM.inputBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PREMIUM.borderSubtle,
  },
  bottomFade: {
    shadowColor: PREMIUM.background,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
});
