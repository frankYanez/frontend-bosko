/**
 * Layout de las tabs autenticadas.
 *
 * Actúa como guarda secundaria: si alguien llega a esta ruta sin sesión
 * (deep link, recarga en dev, etc.) es redirigido al login.
 * La guarda primaria está en app/index.tsx.
 */

import { Redirect, Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TOKENS } from '@/core/design-system/tokens';
import { CustomTabBar } from '@/src/components/CustomTabBar';
import { useAuth } from '@/features/auth/state/AuthContext';

export default function TabsLayout() {
  const { authLoaded, isAuthenticated } = useAuth();

  // Mientras carga no mostrar nada (evita el flash de la tab bar sin datos)
  if (!authLoaded) return null;

  // Guarda: sin sesión activa → redirigir al login
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right']}
    >
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen name="index"   options={{ title: 'Inicio' }} />
        <Tabs.Screen name="services" options={{ title: 'Servicios' }} />
        <Tabs.Screen name="reels"   options={{ title: 'Reels' }} />
        <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
        <Tabs.Screen name="chat"    options={{ title: 'Mensajes' }} />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.color.primary,
  },
});
