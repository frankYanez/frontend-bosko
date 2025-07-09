import Fonts from "@/constants/Fonts";
import { useAuth } from "@/context/AuthContext";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { TextInput } from "react-native-paper";

const RegisterView = ({ toLogin }: { toLogin: () => void }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userName: "",
    fullName: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // Validar campos
    if (
      !formData.email ||
      !formData.password ||
      !formData.userName ||
      !formData.fullName
    ) {
      setError("Por favor completa todos los campos");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await register(formData);
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
          marginTop: 50,
          gap: 15,
        }}
      >
        <Text style={styles.textPrincipal}>Registro en Bosko</Text>
        <Image
          source={require("@/assets/images/bosko-logo.svg")}
          style={{ width: 150, height: 150 }}
          contentFit="cover"
        />

        <TextInput
          placeholder="Nombre completo"
          value={formData.fullName}
          placeholderTextColor={"gray"}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, fullName: text }));
            setError("Rellena este campo");
          }}
          style={styles.input}
          mode="flat"
          allowFontScaling
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
          error={!!error}
          onSubmitEditing={() => {
            // Focus next input on submit
            Keyboard.dismiss();
          }}
          left={<TextInput.Icon icon="account" color="gray" />}
        />

        <TextInput
          placeholder="Nombre de usuario"
          value={formData.userName}
          placeholderTextColor={"gray"}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, userName: text }));
            setError("");
          }}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          error={!!error}
          onSubmitEditing={() => {
            // Focus next input on submit
            Keyboard.dismiss();
          }}
          left={<TextInput.Icon icon="" color="gray" />}
        />

        <TextInput
          placeholder="E-mail"
          value={formData.email}
          placeholderTextColor={"gray"}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, email: text }));
            setError("");
          }}
          style={styles.input}
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
          style={styles.input}
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          onPress={handleRegister}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.button,
            { opacity: pressed || isLoading ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Registrando..." : "Registrarse"}
          </Text>
        </Pressable>
        <Text style={[styles.text, { color: "white" }]}>
          Ya tienes cuenta?{" "}
          <Pressable onPress={() => toLogin()}>
            <Text style={[styles.text]}>Inicia sesion</Text>
          </Pressable>
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default RegisterView;

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts.fonts.medium,
    // fontWeight: "200",
    fontSize: 18,
    color: "white",
    textAlign: "center",
  },
  textPrincipal: {
    fontFamily: Fonts.fonts.medium,
    fontWeight: "500",
    fontSize: 30,
    textAlign: "center",
  },
  container: {
    width: "90%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 10,
  },
  input: {
    borderColor: "gray",
    borderWidth: 1,

    width: 300,

    borderRadius: 10,
    // padding: 5,
    marginVertical: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 200,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
  },
});
