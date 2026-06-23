import React, { useEffect, useRef } from "react";
import { Dimensions, View, StyleSheet, Animated } from "react-native";

const { height } = Dimensions.get("window");

export default function AnimatedBarsBackground() {
  const bars = Array.from({ length: 6 }).map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    bars.forEach((bar, index) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, { toValue: 20, duration: 3000, useNativeDriver: true }),
            Animated.timing(bar, { toValue: 0, duration: 3000, useNativeDriver: true }),
          ])
        ).start();
      }, index * 400);
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            { left: index * 60 + 20, backgroundColor: "red", transform: [{ translateY: bar }] },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    width: 20,
    height: height * 1.5,
    borderRadius: 10,
  },
});
