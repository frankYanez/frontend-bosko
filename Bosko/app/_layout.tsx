import { View, Text } from 'react-native'
import React from 'react'
import { Redirect, Tabs } from 'expo-router'
import { Image } from 'react-native'
import { AuthProvider } from './context/AuthContext'

export default function _layout() {
  return (

    <AuthProvider>

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none',
          },
        }}
      />
    </AuthProvider>




  )
}