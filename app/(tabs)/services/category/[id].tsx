import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";

import { SERVICE_CATEGORIES } from "@/constants/serviceCategories";
import {
  SERVICE_PROVIDERS,
  ServiceProvider,
} from "@/constants/serviceProviders";
import { TOKENS } from "@/theme/tokens";

export default function CategoryServicesScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const category = useMemo(
    () => SERVICE_CATEGORIES.find((item) => item.id === id),
    [id]
  );

  const providers = useMemo(
    () => SERVICE_PROVIDERS.filter((provider) => provider.categoryId === id),
    [id]
  );

  const accent = category?.accent ?? "#EEF1F4";

  const handleProviderPress = useCallback(
    (provider: ServiceProvider) => {
      router.push({
        pathname: "../provider/[id]",
        params: { id: provider.id },
      });
    },
    [router]
  );

  const renderProvider = useCallback(
    ({ item, index }: { item: ServiceProvider; index: number }) => (
      <MotiView
        from={{ opacity: 0, translateY: 24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 360, delay: index * 60 }}
        style={styles.serviceWrapper}
      >
        <Pressable
          onPress={() => handleProviderPress(item)}
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${item.name}`}
          accessibilityHint="Abrir el perfil del profesional"
          style={[styles.serviceCard, { borderColor: accent }]}
        >
          <View style={[styles.avatar, { backgroundColor: accent }]}>
            <Text style={styles.avatarEmoji}>{item.avatar}</Text>
          </View>
          <View style={styles.serviceContent}>
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceHeadline}>{item.headline}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaStrong}>{item.rating.toFixed(1)} ★</Text>
              <Text style={styles.meta}>({item.reviews} reseñas)</Text>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.meta}>{item.location}</Text>
            </View>
            <View style={styles.tagsRow}>
              {item.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: accent }]}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </Pressable>
      </MotiView>
    ),
    [accent, handleProviderPress]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: category?.title ?? "Servicios",
          headerLargeTitle: false,
        }}
      />
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderProvider}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.hero, { backgroundColor: accent }]}>
            <Text style={styles.heroIcon}>{category?.icon ?? "✨"}</Text>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{category?.title ?? "Servicios"}</Text>
              <Text style={styles.heroSubtitle}>
                {category?.description ?? "Descubrí profesionales destacados listos para ayudarte."}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Pronto habrá profesionales aquí</Text>
            <Text style={styles.emptySubtitle}>
              Estamos sumando nuevos servicios para esta categoría.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.color.bg,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  hero: {
    borderRadius: TOKENS.radius.xl,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  heroIcon: {
    fontSize: 42,
  },
  heroCopy: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: TOKENS.color.sub,
  },
  serviceWrapper: {
    width: "100%",
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: TOKENS.radius.lg,
    padding: 18,
    flexDirection: "row",
    gap: 14,
    borderWidth: 1,
    ...TOKENS.shadow.soft,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: TOKENS.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 30,
  },
  serviceContent: {
    flex: 1,
    gap: 6,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  serviceHeadline: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
  },
  meta: {
    fontSize: 13,
    color: TOKENS.color.sub,
  },
  metaStrong: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  metaSeparator: {
    fontSize: 13,
    color: TOKENS.color.sub,
    marginHorizontal: 2,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: TOKENS.radius.pill,
  },
  tagText: {
    fontSize: 12,
    color: TOKENS.color.text,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    textAlign: "center",
    paddingHorizontal: 12,
    lineHeight: 20,
  },
});
