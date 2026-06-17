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
import { CustomTabBar } from '@/components/CustomTabBar';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useProfile } from '@/hooks/queries/useProfileQuery';
import { useThemeColors } from '@/stores/theme.store';

export default function TabsLayout() {
  const { authLoaded, isAuthenticated } = useAuth();
  const { data: profile } = useProfile();
  const tc = useThemeColors();
  const isProvider = profile?.isProvider === true;

  if (!authLoaded) return null;

  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: tc.bg }]}
      edges={['left', 'right']}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
        tabBar={(props) => (
          <CustomTabBar
            {...props}
          />
        )}
      >
        <Tabs.Screen name="index"    options={{ title: 'Inicio'    }} />
        <Tabs.Screen name="services" options={{ title: 'Servicios' }} />
        <Tabs.Screen name="orders"   options={{ title: isProvider ? 'Órdenes' : 'Pedidos' }} />
        <Tabs.Screen name="reels"    options={{ title: 'Reels'     }} />
        <Tabs.Screen name="chat"     options={{ title: 'Mensajes'  }} />
        <Tabs.Screen name="profile"  options={{ title: 'Perfil'    }} />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
