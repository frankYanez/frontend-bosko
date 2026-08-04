import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { registerPushToken } from '@/features/notifications/services/notifications.service';
import { useAuth } from '@/features/auth/state/AuthContext';

export function usePushNotificationSetup() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !Device.isDevice) return;

    (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Bosko',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#850021',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        (Constants as any).easConfig?.projectId;
      if (!projectId) return;

      const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
      await registerPushToken(pushToken, Platform.OS as 'ios' | 'android');
    })();
  }, [isAuthenticated]);
}
