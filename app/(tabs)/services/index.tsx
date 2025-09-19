import { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";

import { SERVICE_CATEGORIES, ServiceCategory } from "@/constants/serviceCategories";
import { TOKENS } from "@/theme/tokens";

export default function ServicesScreen() {
  const router = useRouter();

  const handleCategoryPress = useCallback(
    (category: ServiceCategory) => {
      router.push({
        pathname: "./category/[id]",
        params: { id: category.id, title: category.title },
      });
    },
    [router]
  );

  const renderCategory = useCallback(
    ({ item, index }: { item: ServiceCategory; index: number }) => (
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 350, delay: index * 80 }}
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
          <Text style={styles.icon}>{item.icon}</Text>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{item.servicesCount}</Text>
            <Text style={styles.countLabel}>servicios</Text>
          </View>
        </Pressable>
      </MotiView>
    ),
    [handleCategoryPress]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={SERVICE_CATEGORIES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={renderCategory}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Servicios</Text>
            <Text style={styles.subheading}>
              Elegí una categoría para explorar profesionales disponibles.
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
    marginBottom: 12,
    gap: 8,
  },
  heading: {
    fontSize: 28,
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
    borderRadius: TOKENS.radius.lg,
    padding: 18,
    minHeight: 180,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  icon: {
    fontSize: 32,
  },
  cardContent: {
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  cardDescription: {
    fontSize: 14,
    color: TOKENS.color.sub,
    lineHeight: 18,
  },
  countBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: TOKENS.radius.pill,
  },
  countText: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  countLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: TOKENS.color.sub,
  },
});
