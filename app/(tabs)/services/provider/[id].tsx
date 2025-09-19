import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { SERVICE_CATEGORIES } from "@/constants/serviceCategories";
import {
  SERVICE_PROVIDERS,
  ServiceProvider,
} from "@/constants/serviceProviders";
import { TOKENS } from "@/theme/tokens";

export default function ProviderProfileScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [provider, setProvider] = useState<ServiceProvider | undefined>();

  useEffect(() => {
    const providerId = typeof params.id === "string" ? params.id : undefined;
    const foundProvider = SERVICE_PROVIDERS.find((item) => item.id === providerId);
    setProvider(foundProvider);
  }, [params.id]);

  function handleBack() {
    router.back();
  }

  if (!provider) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyState}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.emptyTitle}>No encontramos este profesional</Text>
          <Text style={styles.emptySubtitle}>
            Volvé a la lista y elegí otro servicio disponible.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const category = SERVICE_CATEGORIES.find(
    (item) => item.id === provider.categoryId
  );
  const accentColor = category?.accent ?? "#E8ECF2";

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{provider.name}</Text>
            <Text style={styles.headerCategory}>{category?.title}</Text>
          </View>
        </View>

        <View style={[styles.hero, { backgroundColor: accentColor }]}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroEmoji}>{provider.avatar}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroHeadline}>{provider.headline}</Text>
            <Text style={styles.heroMeta}>
              {provider.rating.toFixed(1)} ★ · {provider.reviews} reseñas
            </Text>
            <Text style={styles.heroMeta}>{provider.location}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre el servicio</Text>
          <Text style={styles.sectionBody}>{provider.bio}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Etiquetas</Text>
          <View style={styles.tagsRow}>
            {provider.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: accentColor }]}>
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
    gap: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: TOKENS.radius.lg,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...TOKENS.shadow.soft,
  },
  backIcon: {
    fontSize: 20,
    color: TOKENS.color.text,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  headerName: {
    fontSize: 22,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  headerCategory: {
    fontSize: 14,
    color: TOKENS.color.sub,
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
    backgroundColor: "#FFFFFF",
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
  heroHeadline: {
    fontSize: 16,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  heroMeta: {
    fontSize: 14,
    color: TOKENS.color.sub,
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
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingVertical: 6,
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
    gap: 16,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TOKENS.color.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: "center",
  },
});
