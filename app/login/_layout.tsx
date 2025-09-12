import { View, Text } from "react-native";
import React from "react";
import { Redirect, Slot, Tabs } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { globalStyles } from "@/styles/global-styles";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

export default function _layout() {
  return (
    // <LinearGradient
    //   colors={[globalStyles.colorPrimary, globalStyles.colorPrimary, "#B62635"]} // vino → acento → vino
    //   locations={[0, 0.5, 1]}
    //   start={{ x: 0.5, y: 0 }}
    //   end={{ x: 0.5, y: 1 }}
    //   style={{ flex: 1 }}
    // >
    //   <LinearGradient
    //     colors={[
    //       // "#8B1E3F77",
    //       globalStyles.colorPrimary,
    //       globalStyles.colorSecondary,
    //     ]} // vino → rosa quemado → hueso
    //     start={{ x: 0, y: 0 }}
    //     end={{ x: 1, y: 1 }}
    //     style={{ justifyContent: "center", alignItems: "center" }}
    //   >
    // {/* <Redirect href="/login" /> */}

    <SafeAreaView style={{ flex: 1 }}>
      <Slot />
    </SafeAreaView>

    // {/* Redirect to login if not authenticated */}
    //   </LinearGradient>
    // </LinearGradient>
  );
}
