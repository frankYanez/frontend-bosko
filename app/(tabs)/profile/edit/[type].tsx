import { View, StyleSheet } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import EditPhoto from "@/components/profileComponentes/edit/EditPhoto";
import EditDescription from "@/components/profileComponentes/edit/EditDescription";
import EditPassword from "@/components/profileComponentes/edit/EditPass";
import EditUsername from "@/components/profileComponentes/edit/EditUserName";
import EditPayments from "@/components/profileComponentes/edit/EditPayments";
import EditNotifications from "@/components/profileComponentes/edit/EditNotifications";
import EditEmail from "@/components/profileComponentes/edit/EditMail";

export default function EditGeneric() {
  const { type } = useLocalSearchParams<{ type: string }>();
  console.log("type:", type);

  const renderComponent = () => {
    switch (type) {
      case "photo":
        return <EditPhoto />;
      case "description":
        return <EditDescription />;
      case "password":
        return <EditPassword />;
      case "username":
        return <EditUsername />;
      case "payments":
        return <EditPayments />;
      case "notifications":
        return <EditNotifications />;
      case "email":
        return <EditEmail />;
      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderComponent()}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
});
