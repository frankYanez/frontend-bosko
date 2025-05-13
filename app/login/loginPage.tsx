import { View, Text, TextInput, StyleSheet } from 'react-native'
import React from 'react'
import { Image } from 'expo-image'
export default function Login() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Image source={require('@/assets/images/icon.png')} />



        </View>
    )
}


const styles = StyleSheet.create({
    input: {
        borderColor: 'gray',
        borderWidth: 2,
        maxWidth: 200,
        width: '100%',
        textAlign: 'center',
        borderRadius: 10,
        padding: 10,
    }
})