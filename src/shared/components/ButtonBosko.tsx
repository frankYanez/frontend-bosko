import React, { useRef } from "react";
import { Text, StyleSheet, Pressable, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { globalStyles } from "@/core/design-system/global-styles";
import Colors from "@/core/design-system/Colors";

interface ButtonBoskoProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
}

export default function ButtonBosko({ title, onPress, isLoading }: ButtonBoskoProps) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={styles.pressable}
      >
        <LinearGradient
          colors={[globalStyles.colorPrimary, "#a0032a", Colors.colorPrimaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={styles.text}>{isLoading ? "Cargando..." : title}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 200,
    borderRadius: 30,
    shadowColor: Colors.colorPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  pressable: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
