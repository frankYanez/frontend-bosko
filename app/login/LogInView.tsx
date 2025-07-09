import {
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from "react-native";
import React, { useState } from "react";
import { TextInput } from "react-native-paper";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { globalStyles } from "@/styles/global-styles";

export default function LogInView({ toLogin }: { toLogin: () => void }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Validar campos
    if (!formData.email || !formData.password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await login(formData);
      if (response.data) {
        // Registro exitoso, redirigir al login
        router.push("/(tabs)");
      }
    } catch (error) {
      setError("Error al registrar usuario. Por favor intenta nuevamente.");
      console.error("Register error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        // Dismiss keyboard on press outside of input
        Keyboard.dismiss();
      }}
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TextInput
          placeholder="E-mail"
          value={formData.email}
          placeholderTextColor={"gray"}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, email: text }));
            setError("");
          }}
          style={globalStyles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          error={!!error}
          onSubmitEditing={() => {
            // Focus next input on submit
            Keyboard.dismiss();
          }}
          left={<TextInput.Icon icon="email" color="gray" />}
        />

        <TextInput
          placeholder="Contraseña"
          value={formData.password}
          placeholderTextColor={"gray"}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, password: text }));
            setError("");
          }}
          style={globalStyles.input}
          secureTextEntry
          right={<TextInput.Icon icon="eye" />}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          error={!!error}
          onSubmitEditing={() => {
            // Dismiss keyboard on submit
            Keyboard.dismiss();
          }}
          left={<TextInput.Icon icon="lock" color="gray" />}
        />
        {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

        <Pressable
          onPress={handleLogin}
          disabled={isLoading}
          style={({ pressed }) => [{ opacity: pressed || isLoading ? 0.7 : 1 }]}
        >
          <Text>{isLoading ? "Registrando..." : "Registrarse"}</Text>
        </Pressable>
        <Text
          style={{ marginTop: 20, color: "blue" }}
          onPress={() => toLogin()}
        >
          ¿No tienes cuenta? Regístrate aquí
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}
