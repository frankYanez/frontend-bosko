import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { TOKENS } from "@/theme/tokens";

export default function CategoryServicesScreen() {
  const { id, title } = useLocalSearchParams<{ id?: string; title?: string }>();
  const displayTitle = typeof title === "string" ? title : "Servicios";

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: displayTitle,
        }}
      />
      <View style={styles.container}>
        <Text style={styles.heading}>{displayTitle}</Text>
        <Text style={styles.description}>
          Pronto podrás explorar los servicios disponibles dentro de esta categoría.
        </Text>
        <Text style={styles.meta}>ID de categoría: {id}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.color.bg,
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    justifyContent: "center",
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: TOKENS.color.sub,
  },
  meta: {
    marginTop: 12,
    fontSize: 12,
    color: TOKENS.color.sub,
    letterSpacing: 0.6,
  },
});
