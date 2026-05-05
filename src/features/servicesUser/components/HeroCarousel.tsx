import React from "react";
import { FlatList, View, Text, StyleSheet, Dimensions } from "react-native";
import { TOKENS } from "@/core/design-system/tokens";
import { PremiumButton } from "@/components/PremiumButton";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export function HeroCarousel({
  data,
}: {
  data: { title: string; subtitle: string; cta: string }[];
}) {
  return (
    <FlatList
      data={data}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={(_, i) => String(i)}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.sub}>{item.subtitle}</Text>
          <PremiumButton
            title="Explorar"
            onPress={() => router.push("/(tabs)/services")}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    width: width - 32,
    marginHorizontal: 16,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    padding: 16,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: { fontSize: 22, fontWeight: "800", color: TOKENS.color.text },
  sub: { color: TOKENS.color.sub, marginTop: 6 },
});
