/**
 * Layout de las tabs autenticadas.
 *
 * Actúa como guarda secundaria: si alguien llega a esta ruta sin sesión
 * (deep link, recarga en dev, etc.) es redirigido al login.
 * La guarda primaria está en app/index.tsx.
 */

import { Redirect, Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TOKENS } from '@/core/design-system/tokens';
import { CustomTabBar } from '@/components/CustomTabBar';
import { useAuth } from '@/features/auth/state/AuthContext';
import { useProfile } from '@/hooks/queries/useProfileQuery';

export default function TabsLayout() {
  const { authLoaded, isAuthenticated } = useAuth();
  const { data: profile } = useProfile();
  const insets = useSafeAreaInsets();
  const isProvider = (profile?.role as string) === 'provider';

  if (!authLoaded) return null;

  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <SafeAreaView
      style={styles.container}
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
    backgroundColor: '#F7F7FA',
  },
});
