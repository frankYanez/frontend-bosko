// /components/HeroCarousel.tsx
import Carousel from "react-native-reanimated-carousel";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { BlurView } from "expo-blur";
import { TOKENS } from "@/theme/tokens";
const { width } = Dimensions.get("window");

export function HeroCarousel({
  data,
}: {
  data: { title: string; subtitle: string; cta: string }[];
}) {
  return (
    <Carousel
      width={width}
      height={180}
      data={data}
      pagingEnabled
      renderItem={({ item }) => (
        <BlurView intensity={30} tint="light" style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.sub}>{item.subtitle}</Text>
          <TouchableOpacity style={styles.btn}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>{item.cta}</Text>
          </TouchableOpacity>
        </BlurView>
      )}
    />
  );
}
const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    padding: 16,
    backgroundColor: TOKENS.glass.bg,
    ...TOKENS.shadow.soft,
  },
  title: { fontSize: 18, fontWeight: "800", color: TOKENS.color.text },
  sub: { color: TOKENS.color.sub, marginTop: 6 },
  btn: {
    marginTop: 12,
    backgroundColor: TOKENS.color.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
});
