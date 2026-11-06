import {
  AndroidImportance,
  IosAuthorizationStatus,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  SchedulableTriggerInputTypes,
} from 'expo-notifications';
import { Platform } from 'react-native';

export const NOTIFICATION_CHANNEL = 'jeep-connect';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await setNotificationChannelAsync(NOTIFICATION_CHANNEL, {
    name: 'Jeep Connect',
    description: 'Avisos de clima, rutas y reproducción de Jeep Connect.',
    importance: AndroidImportance.DEFAULT,
    lightColor: '#2F80FF',
    vibrationPattern: [0, 200, 120, 200],
  });
}

export async function getNotificationPermission(): Promise<PermissionState> {
  try {
    await ensureNotificationChannel();
    const settings = await getPermissionsAsync();
    if (
      settings.granted ||
      settings.ios?.status === IosAuthorizationStatus.PROVISIONAL ||
      settings.ios?.status === IosAuthorizationStatus.AUTHORIZED
    ) {
      return 'granted';
    }
    return settings.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'undetermined';
  }
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  try {
    await ensureNotificationChannel();
    const current = await getPermissionsAsync();
    if (current.granted || current.ios?.status === IosAuthorizationStatus.PROVISIONAL) {
      return 'granted';
    }
    if (!current.canAskAgain) return 'denied';
    const result = await requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    if (
      result.granted ||
      result.ios?.status === IosAuthorizationStatus.PROVISIONAL ||
      result.ios?.status === IosAuthorizationStatus.AUTHORIZED
    ) {
      return 'granted';
    }
    return result.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'denied';
  }
}

export async function sendTestNotification(): Promise<void> {
  await ensureNotificationChannel();
  await scheduleNotificationAsync({
    content: {
      title: 'Jeep Connect está listo',
      body: 'Las notificaciones locales funcionan en este dispositivo.',
      data: { url: '/settings/permissions' },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId: NOTIFICATION_CHANNEL,
    },
  });
}
