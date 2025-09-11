import { ScrollView, StyleSheet, View } from "react-native";
import React from "react";
import ProfileHeader from "@/components/profileComponentes/ProfileHeader";
import ProfileSection from "@/components/profileComponentes/ProfileSection";
import { router } from "expo-router";

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <ProfileHeader />

      <ProfileSection
        title="Mis servicios"
        options={[
          {
            label: "Gestionar servicios",
            onPress: () => router.push("/(tabs)/profile/Services"),
          },
          {
            label: "Agregar servicio",
            onPress: () => router.push("/(tabs)/profile/AddServices"),
          },
        ]}
      />

      <ProfileSection
        title="Configuración"
        options={[
          {
            label: "Editar perfil",
            onPress: () => router.push("/(tabs)/profile/EditProfile"),
          },
          {
            label: "Cambiar contraseña",
            onPress: () => router.push("/(tabs)/profile/ChangePassword"),
          },
          {
            label: "Notificaciones",
            onPress: () => router.push("/(tabs)/profile/Notifications"),
          },
          {
            label: "Métodos de pago",
            onPress: () => router.push("/(tabs)/profile/Payments"),
          },
        ]}
      />

      <ProfileSection
        title="Cuenta"
        options={[
          {
            label: "Bosko Pro",
            onPress: () => router.push("/pro/subscription"),
          },
          {
            label: "Cerrar sesión",
            onPress: () => console.log("Cerrar sesión"),
          },
        ]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
