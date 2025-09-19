import { useEffect, useState } from "react";
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
  const params = useLocalSearchParams();
  const router = useRouter();

  const categoryId = typeof params.id === "string" ? params.id : undefined;
  const category = SERVICE_CATEGORIES.find((item) => item.id === categoryId);

  const [services, setServices] = useState<ServiceProvider[]>([]);
  const [hasAddedExtra, setHasAddedExtra] = useState(false);

  useEffect(() => {
    const nextServices = SERVICE_PROVIDERS.filter(
      (provider) => provider.categoryId === categoryId
    );
    setServices(nextServices);
    setHasAddedExtra(false);
  }, [categoryId]);

  const accentColor = category?.accent ?? "#E8ECF2";

  function handleBack() {
    router.back();
  }

  function handleProviderPress(provider: ServiceProvider) {
    router.push({
      pathname: "../provider/[id]",
      params: { id: provider.id },
    });
  }

  function handleAddService() {
    if (hasAddedExtra || !categoryId) {
      return;
    }

    const newService: ServiceProvider = {
      id: `nuevo-${categoryId}`,
      categoryId,
      name: "Tu nuevo servicio",
      headline: "Completá tu perfil para aparecer aquí.",
      rating: 5,
      reviews: 0,
      location: "Tu ciudad",
      avatar: "➕",
      bio: "Cargá una descripción atractiva para destacarte en esta categoría.",
      tags: ["Nuevo", "Destacado"],
    };

    setServices((current) => [...current, newService]);
    setHasAddedExtra(true);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.hero, { backgroundColor: accentColor }]}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>{category?.title ?? "Servicios"}</Text>
          <Text style={styles.heroSubtitle}>
            {category?.description ?? "Descubrí profesionales disponibles."}
          </Text>
        </View>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 360, delay: index * 50 }}
            style={styles.serviceWrapper}
          >
            <Pressable
              onPress={() => handleProviderPress(item)}
              style={styles.serviceCard}
            >
              <View style={[styles.avatar, { backgroundColor: accentColor }]}>
                <Text style={styles.avatarText}>{item.avatar}</Text>
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.serviceHeadline}>{item.headline}</Text>
                <Text style={styles.serviceMeta}>
                  {item.rating.toFixed(1)} ★ · {item.location}
                </Text>
              </View>
            </Pressable>
          </MotiView>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Todavía no hay servicios</Text>
            <Text style={styles.emptySubtitle}>
              Agregá el primero usando el botón “+”.
            </Text>
          </View>
        }
        ListFooterComponent={
          hasAddedExtra ? (
            <Text style={styles.footerNote}>
              Solo podés agregar un servicio manual. Editá el listado para
              cargar más ofertas reales.
            </Text>
          ) : null
        }
      />

      <Pressable
        onPress={handleAddService}
        disabled={hasAddedExtra}
        accessibilityRole="button"
        accessibilityLabel={
          hasAddedExtra
            ? "Ya agregaste un servicio"
            : "Agregar un nuevo servicio"
        }
        style={[
          styles.addButton,
          {
            backgroundColor: hasAddedExtra
              ? TOKENS.color.sub
              : TOKENS.color.primary,
            opacity: hasAddedExtra ? 0.6 : 1,
          },
        ]}
      >
        <Text style={styles.addButtonIcon}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.color.bg,
  },
  hero: {
    margin: 20,
    borderRadius: TOKENS.radius.xl,
    padding: 20,
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
  heroCopy: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  heroSubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 16,
  },
  serviceWrapper: {
    width: "100%",
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: TOKENS.radius.lg,
    ...TOKENS.shadow.soft,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: TOKENS.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 30,
  },
  serviceInfo: {
    flex: 1,
    gap: 6,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  serviceHeadline: {
    fontSize: 14,
    color: TOKENS.color.sub,
  },
  serviceMeta: {
    fontSize: 13,
    color: TOKENS.color.sub,
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
    paddingHorizontal: 20,
  },
  footerNote: {
    textAlign: "center",
    color: TOKENS.color.sub,
    fontSize: 12,
    paddingHorizontal: 20,
  },
  addButton: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    ...TOKENS.shadow.soft,
  },
  addButtonIcon: {
    fontSize: 32,
    color: "#FFFFFF",
    lineHeight: 32,
  },
});
