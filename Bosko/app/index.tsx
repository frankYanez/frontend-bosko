import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native'
import React from 'react'
import { Image } from 'expo-image'
import { Redirect, router } from 'expo-router'
export default function Index() {
    return (
        <Redirect href="/login" />
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