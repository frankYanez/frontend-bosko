import { View, Text } from 'react-native'
import React from 'react'
import { Redirect, Slot, Tabs } from 'expo-router'

export default function _layout() {
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarStyle: {
                display: 'none',
            },
        }} />
    )
}
