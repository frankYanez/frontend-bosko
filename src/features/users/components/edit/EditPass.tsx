import { View, TextInput, Button, StyleSheet } from "react-native";
import React, { useState } from "react";

export default function EditPassword() {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const save = () => {
    // TODO: conectar con backend PATCH /users/me/password
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Contraseña actual"
        secureTextEntry
        value={oldPass}
        onChangeText={setOldPass}
      />
      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña"
        secureTextEntry
        value={newPass}
        onChangeText={setNewPass}
      />
      <Button title="Guardar" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
});
