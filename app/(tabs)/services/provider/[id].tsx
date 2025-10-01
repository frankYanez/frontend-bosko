import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";

import { SERVICE_CATEGORIES } from "@/constants/serviceCategories";
import {
  SERVICE_PROVIDERS,
  ServiceProvider,
} from "@/constants/serviceProviders";
import { TOKENS } from "@/theme/tokens";

export default function ProviderProfileScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const provider = useMemo<ServiceProvider | undefined>(
    () => SERVICE_PROVIDERS.find((item) => item.id === "paula-mendez"),
    [id]
  );

  const category = useMemo(
    () =>
      provider
        ? SERVICE_CATEGORIES.find((item) => item.id === provider.categoryId)
        : undefined,
    [provider]
  );

  if (!provider) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: "Profesional" }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No encontramos este perfil</Text>
          <Text style={styles.emptySubtitle}>
            Actualizá la lista o volvé a la categoría para descubrir más
            profesionales.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const accent = category?.accent ?? "#EEF1F4";

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* <Stack.Screen
        options={{
          title: provider.name,
          headerLargeTitle: false,
        }}
      /> */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: accent }]}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroEmoji}>{provider.avatar}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroName}>{provider.name}</Text>
            <Text style={styles.heroHeadline}>{provider.headline}</Text>
            <Text style={styles.heroCategory}>{category?.title}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.sectionBody}>{provider.bio}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Calificación</Text>
            <Text style={styles.detailValue}>
              {provider.rating.toFixed(1)} ★
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reseñas</Text>
            <Text style={styles.detailValue}>{provider.reviews}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ubicación</Text>
            <Text style={styles.detailValue}>{provider.location}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Especialidades</Text>
          <View style={styles.tagsRow}>
            {provider.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: accent }]}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.color.bg,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  hero: {
    borderRadius: TOKENS.radius.xl,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  heroAvatar: {
    width: 68,
    height: 68,
    borderRadius: TOKENS.radius.lg,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: {
    fontSize: 36,
  },
  heroCopy: {
    flex: 1,
    gap: 6,
  },
  heroName: {
    fontSize: 24,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  heroHeadline: {
    fontSize: 15,
    color: TOKENS.color.sub,
    lineHeight: 21,
  },
  heroCategory: {
    fontSize: 13,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: TOKENS.radius.lg,
    padding: 18,
    gap: 12,
    ...TOKENS.shadow.soft,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  sectionBody: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 21,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 14,
    color: TOKENS.color.sub,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: TOKENS.radius.pill,
  },
  tagText: {
    fontSize: 12,
    color: TOKENS.color.text,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TOKENS.color.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: "center",
    lineHeight: 20,
  },
});
