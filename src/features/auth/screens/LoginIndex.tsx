import { View } from "react-native";
import React from "react";
import LogInView from "@/features/auth/screens/LogInView";
import RegisterView from "@/features/auth/screens/RegisterView";

export default function LoginIndex() {
  const [showRegister, setShowRegister] = React.useState(false);

  return (
    <View style={{ flex: 1 }}>
      {showRegister ? (
        <RegisterView toRegister={() => setShowRegister(false)} />
      ) : (
        <LogInView toRegister={() => setShowRegister(true)} />
      )}
    </View>
  );
}
