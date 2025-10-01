import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";

import {
  SERVICE_CATEGORIES,
  ServiceCategory,
} from "@/constants/serviceCategories";
import { SERVICE_PROVIDERS } from "@/constants/serviceProviders";
import { TOKENS } from "@/theme/tokens";

type CategoryListItem = ServiceCategory & { servicesCount: number };

export default function ServicesScreen() {
  const router = useRouter();

  const categories = useMemo<CategoryListItem[]>(() => {
    const counts = SERVICE_PROVIDERS.reduce<Record<string, number>>(
      (acc, provider) => {
        acc[provider.categoryId] = (acc[provider.categoryId] ?? 0) + 1;
        return acc;
      },
      {}
    );

    return SERVICE_CATEGORIES.map((category) => ({
      ...category,
      servicesCount: counts[category.id] ?? 0,
    }));
  }, []);

  const handleCategoryPress = useCallback(
    (category: ServiceCategory) => {
      router.push({
        pathname: "./category/[id]",
        params: { id: category.id },
      });
    },
    [router]
  );

  const renderCategory = useCallback(
    ({ item, index }: { item: CategoryListItem; index: number }) => (
      <MotiView
        from={{ opacity: 0, translateY: 24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 420, delay: index * 70 }}
        style={styles.cardWrapper}
      >
        <Pressable
          onPress={() => handleCategoryPress(item)}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          accessibilityHint={`Abrir categoría ${item.title}`}
          style={[styles.card, { backgroundColor: item.accent }]}
          android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: false }}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{item.servicesCount}</Text>
              <Text style={styles.countLabel}>servicios</Text>
            </View>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
        </Pressable>
      </MotiView>
    ),
    [handleCategoryPress]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={renderCategory}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Categorías sugeridas</Text>
            <Text style={styles.subheading}>
              Descubrí ofertas destacadas y encontrá profesionales en segundos.
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
    paddingBottom: 32,
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
    borderRadius: TOKENS.radius.xl,
    padding: 20,
    minHeight: 190,
    justifyContent: "space-between",
    overflow: "hidden",
    ...TOKENS.shadow.soft,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  icon: {
    fontSize: 36,
  },
  cardContent: {
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  cardDescription: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 19,
  },
  countBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: TOKENS.radius.pill,
    alignItems: "center",
  },
  countText: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  countLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    color: TOKENS.color.sub,
  },
});
