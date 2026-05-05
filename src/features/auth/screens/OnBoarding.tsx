import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  Pressable,
  ListRenderItemInfo,
  StatusBar,
} from "react-native";
import { router, Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/core/design-system/Colors";

const { width: W, height: H } = Dimensions.get("window");
const CARD_H = 300;

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  lottie: any;
  accent: string;
};

const SLIDES: Slide[] = [
  {
    key: "1",
    title: "¡Bienvenido a Bosko!",
    subtitle: "El marketplace donde encontrarás u ofrecerás servicios fácilmente",
    lottie: require("@/assets/lotties/ltUPpJrUU2.json"),
    accent: "#E91E63",
  },
  {
    key: "2",
    title: "Servicios en segundos",
    subtitle: "Desde plomería hasta clases particulares, todo en un lugar",
    lottie: require("@/assets/lotties/pantalla-empleo.json"),
    accent: "#7C4DFF",
  },
  {
    key: "3",
    title: "20+ Categorías",
    subtitle: "Hogar, reparaciones, clases y mucho más disponibles ahora mismo",
    lottie: require("@/assets/lotties/chico-compu.json"),
    accent: "#00BCD4",
  },
  {
    key: "4",
    title: "Profesionales verificados",
    subtitle: "Lee reseñas reales y precios claros. Elige con confianza",
    lottie: require("@/assets/lotties/hombre-escribiendo.json"),
    accent: "#4CAF50",
  },
  {
    key: "5",
    title: "¡Empieza ya!",
    subtitle: "Crea tu cuenta y descubre las oportunidades que te esperan",
    lottie: require("@/assets/lotties/register2.json"),
    accent: Colors.colorPrimary,
  },
];

export default function OnBoarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const insets = useSafeAreaInsets();

  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<Slide>>(null);
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const titleTranslate = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Verificar si el usuario ya vio el onboarding en una sesión anterior
    AsyncStorage.getItem("onboardingComplete")
      .then((val) => setOnboardingComplete(val === "true"))
      .catch(() => setOnboardingComplete(false));
  }, []);

  const animateTextIn = () => {
    titleOpacity.setValue(0);
    titleTranslate.setValue(16);
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(titleTranslate, { toValue: 0, damping: 22, stiffness: 160, useNativeDriver: true }),
    ]).start();
  };

  const handleMomentumEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / W);
    setCurrentIndex(index);
    animateTextIn();
  };

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      await complete();
    }
  };

  const complete = async () => {
    try {
      await AsyncStorage.setItem("onboardingComplete", "true");
    } catch {}
    router.replace("/login");
  };

  // Aún verificando AsyncStorage → no renderizar nada para evitar flash
  if (onboardingComplete === null) return null;

  // Onboarding ya visto → redirigir al login directamente
  // (la verificación de sesión activa la hace app/index.tsx antes de llegar aquí)
  if (onboardingComplete) {
    return <Redirect href="/login" />;
  }

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#080004", "#1a000d", "#0d0008"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Full-screen carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={handleMomentumEnd}
        style={StyleSheet.absoluteFill}
        renderItem={({ item }: ListRenderItemInfo<Slide>) => (
          <View style={styles.slideContainer}>
            {/* Glow blob per slide */}
            <View style={[styles.glowBlob, { backgroundColor: item.accent + "18" }]} />
            <View style={[styles.glowBlobInner, { backgroundColor: item.accent + "12" }]} />
            {/* Lottie centered in upper 60% */}
            <View style={styles.lottieWrapper}>
              <LottieView source={item.lottie} autoPlay loop style={styles.lottie} />
            </View>
          </View>
        )}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Image
              source={require("@/assets/images/bosko-logo.png")}
              style={styles.logoImg}
              contentFit="contain"
            />
          </View>
          <Text style={styles.logoText}>bosko</Text>
        </View>
        <Pressable onPress={complete} hitSlop={14}>
          <Text style={styles.skipText}>Saltar</Text>
        </Pressable>
      </View>

      {/* Bottom card */}
      <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Animated dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const dotW = scrollX.interpolate({
              inputRange: [(i - 1) * W, i * W, (i + 1) * W],
              outputRange: [7, 26, 7],
              extrapolate: "clamp",
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [(i - 1) * W, i * W, (i + 1) * W],
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotW, opacity: dotOpacity }]}
              />
            );
          })}
        </View>

        {/* Text */}
        <Animated.View
          style={{ opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }}
        >
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <Pressable
            onPressIn={() =>
              Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start()
            }
            onPressOut={() =>
              Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start()
            }
            onPress={handleNext}
            style={styles.btnOuter}
          >
            <LinearGradient
              colors={[Colors.colorPrimary, "#c0002d", Colors.colorPrimaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>{isLast ? "Comenzar" : "Siguiente"}</Text>
              <Ionicons
                name={isLast ? "checkmark" : "arrow-forward"}
                size={18}
                color="#fff"
                style={styles.btnIcon}
              />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#080004",
  },
  slideContainer: {
    width: W,
    height: H,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: CARD_H,
  },
  glowBlob: {
    position: "absolute",
    width: W * 1.1,
    height: W * 1.1,
    borderRadius: W * 0.55,
    top: H * 0.04,
    alignSelf: "center",
  },
  glowBlobInner: {
    position: "absolute",
    width: W * 0.6,
    height: W * 0.6,
    borderRadius: W * 0.3,
    top: H * 0.14,
    alignSelf: "center",
  },
  lottieWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: W,
  },
  lottie: {
    width: W * 0.72,
    height: W * 0.72,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    zIndex: 10,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logoImg: {
    width: 26,
    height: 26,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1.5,
  },
  skipText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 4,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 18,
    gap: 5,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.colorPrimary,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    lineHeight: 21,
    marginTop: 2,
  },
  btnOuter: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: Colors.colorPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 4,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    borderRadius: 16,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  btnIcon: {
    marginLeft: 8,
  },
});
