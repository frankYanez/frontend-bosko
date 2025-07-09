import Header from "@/components/Header";
import TopCarousel from "@/components/TopCarousel";
import { globalStyles } from "@/styles/global-styles";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  StyleSheet,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
  View,
  FlatList,
  Pressable,
} from "react-native";

import { Searchbar } from "react-native-paper";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const users = [
    {
      id: "1",
      image:
        "https://img.freepik.com/vector-premium/bandera-insignia-servicio-plomeria-vintage-o-emblema-logotipo-ilustracion-vectorial_580339-726.jpg?w=1060",
      nombre: "Comercio 1",
      descripcion: "Descripción del comercio 1",
    },
    {
      id: "2",
      image: "https://picsum.photos/400/300?random=2",
      nombre: "Comercio 2",
      descripcion: "Descripción del comercio 2",
    },
    {
      id: "3",
      image: "https://picsum.photos/400/300?random=3",
      nombre: "Comercio 3",
      descripcion: "Descripción del comercio 3",
    },
    {
      id: "4",
      image: "https://picsum.photos/400/300?random=4",
      nombre: "Comercio 4",
      descripcion: "Descripción del comercio 4",
    },
    {
      id: "5",
      image: "https://picsum.photos/400/300?random=5",
      nombre: "Comercio 5",
      descripcion: "Descripción del comercio 5",
    },
  ];
  return (
    <ScrollView>
      <TouchableWithoutFeedback
        onPress={() => {
          // Dismiss the keyboard when tapping outside the input
          Keyboard.dismiss();
        }}
      >
        <View>
          <Header />
          <Searchbar
            placeholder="Buscar"
            value={searchQuery}
            onChangeText={setSearchQuery}
            elevation={4}
            cursorColor={"black"}
            loading={false}
            style={{
              width: "90%",
              alignSelf: "center",
              marginTop: 10,
              borderRadius: 20,
              backgroundColor: "white",
            }}
          />
          <View
            style={{
              width: "90%",
              alignSelf: "center",
              flexDirection: "row",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <Text
              style={[
                globalStyles.title,
                {
                  fontSize: 20,
                  marginLeft: 25,
                  marginTop: 20,
                  color: globalStyles.colorPrimary,
                },
              ]}
            >
              Top comercios
            </Text>
            <Pressable
              style={{
                marginLeft: "auto",
              }}
              onPress={() => {
                router.push("/(tabs)/profile");
              }}
            >
              <Text>Ver todos</Text>
            </Pressable>
          </View>
          <View
            style={{
              width: "90%",
              alignSelf: "center",
              marginTop: 20,
              marginBottom: 10,
            }}
          >
            <TopCarousel users={users} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
