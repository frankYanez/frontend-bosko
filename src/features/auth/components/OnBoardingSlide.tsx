import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import LottieView from "lottie-react-native";
import { PREMIUM } from "@/core/design-system";

interface OnBoardingSlideProps {
  item: {
    image?: any;
    title: string;
    subtitle: string;
  };
}

export default function OnBoardingSlide({ item }: OnBoardingSlideProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 15, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.title}>{item.title}</Text>
      {item.image && (
        <View style={styles.lottieContainer}>
          <LottieView source={item.image} autoPlay loop style={styles.lottie} />
        </View>
      )}
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: PREMIUM.colorPrimary,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  lottieContainer: {
    width: 320,
    height: 320,
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    lineHeight: 24,
    maxWidth: 300,
    marginTop: 10,
  },
});
