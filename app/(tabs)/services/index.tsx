import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";

import {
  SERVICE_CATEGORIES,
  ServiceCategory,
} from "@/constants/serviceCategories";
import {
  SERVICE_PROVIDERS,
  ServiceProvider,
} from "@/constants/serviceProviders";
import { TOKENS } from "@/theme/tokens";

type CategoryWithCount = ServiceCategory & { servicesCount: number };

const categoriesWithCounts: CategoryWithCount[] = SERVICE_CATEGORIES.map(
  (category) => {
    const servicesInCategory = SERVICE_PROVIDERS.filter(
      (provider) => provider.categoryId === category.id
    );

    return {
      ...category,
      servicesCount: servicesInCategory.length,
    };
  }
);

const featuredServices: ServiceProvider[] = SERVICE_PROVIDERS.slice(0, 6);

export default function ServicesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={categoriesWithCounts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400, delay: index * 60 }}
            style={styles.cardWrapper}
          >
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "./category/[id]",
                  params: { id: item.id },
                })
              }
              style={[styles.card, { backgroundColor: item.accent }]}
              android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: false }}
            >
              <Text style={styles.icon}>{item.icon}</Text>
              <View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              <Text style={styles.cardCount}>{item.servicesCount} servicios</Text>
            </Pressable>
          </MotiView>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Categorías sugeridas</Text>
            <Text style={styles.subheading}>
              Elegí una categoría para ver profesionales disponibles.
            </Text>
          </View>
        }
        ListFooterComponent={() => (
          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Servicios destacados</Text>
            <Text style={styles.sectionSubtitle}>
              Tocá cualquier profesional para conocer su perfil.
            </Text>
            {featuredServices.map((service) => (
              <Pressable
                key={service.id}
                onPress={() =>
                  router.push({
                    pathname: "./provider/[id]",
                    params: { id: service.id },
                  })
                }
                style={styles.serviceCard}
              >
                <View style={styles.serviceAvatar}>
                  <Text style={styles.serviceAvatarText}>{service.avatar}</Text>
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceHeadline}>{service.headline}</Text>
                  <Text style={styles.serviceMeta}>
                    {service.rating.toFixed(1)} ★ · {service.location}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
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
  columnWrapper: {
    gap: 18,
  },
  header: {
    width: "100%",
    marginBottom: 8,
    gap: 6,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  subheading: {
    fontSize: 15,
    color: TOKENS.color.sub,
    lineHeight: 20,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    flex: 1,
    padding: 20,
    minHeight: 170,
    justifyContent: "space-between",
    borderRadius: TOKENS.radius.xl,
    ...TOKENS.shadow.soft,
  },
  icon: {
    fontSize: 36,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TOKENS.color.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 19,
  },
  cardCount: {
    fontSize: 13,
    fontWeight: "600",
    color: TOKENS.color.text,
  },
  servicesSection: {
    width: "100%",
    marginTop: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: TOKENS.radius.lg,
    gap: 14,
    ...TOKENS.shadow.soft,
  },
  serviceAvatar: {
    width: 48,
    height: 48,
    borderRadius: TOKENS.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TOKENS.color.bg,
  },
  serviceAvatarText: {
    fontSize: 26,
  },
  serviceInfo: {
    flex: 1,
    gap: 4,
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
});
