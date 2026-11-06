import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as KeepAwake from 'expo-keep-awake';
import { SettingsProvider, useSettings, useTheme } from '@/store/settings';
import { LibraryProvider } from '@/store/library';
import { LocationProvider } from '@/store/location';
import { RadioProvider } from '@/store/radio';
import { SpotifyProvider } from '@/store/spotify';
import { WeatherProvider } from '@/store/weather';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const KEEP_AWAKE_TAG = 'jeepconnect-drive';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SettingsProvider>
          <LibraryProvider>
            <LocationProvider>
              <WeatherProvider>
                <RadioProvider>
                  <SpotifyProvider>
                    <AppShell fontsReady={fontsLoaded || Boolean(fontError)} />
                  </SpotifyProvider>
                </RadioProvider>
              </WeatherProvider>
            </LocationProvider>
          </LibraryProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell({ fontsReady }: { fontsReady: boolean }) {
  const { settings, hydrated } = useSettings();
  const { colors, isDark } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!fontsReady || !hydrated) return;
    const timeout = setTimeout(() => setReady(true), 30);
    return () => clearTimeout(timeout);
  }, [fontsReady, hydrated]);

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  useEffect(() => {
    if (!hydrated) return;
    const lock =
      settings.layoutMode === 'auto'
        ? ScreenOrientation.OrientationLock.LANDSCAPE
        : ScreenOrientation.OrientationLock.PORTRAIT_UP;
    ScreenOrientation.lockAsync(lock).catch((error) => {
      console.warn('[orientation] No se pudo bloquear la orientación', error);
    });
  }, [hydrated, settings.layoutMode]);

  useEffect(() => {
    if (!hydrated) return;
    if (settings.keepAwake) {
      KeepAwake.activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    } else {
      KeepAwake.deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    }
    return () => {
      KeepAwake.deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [hydrated, settings.keepAwake]);

  useEffect(() => {
    if (!ready) return;
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, [colors.background, ready]);

  if (!ready) return <View style={[styles.root, { backgroundColor: colors.background }]} />;

  const onboardingDone = settings.onboardingComplete;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Protected guard={!onboardingDone}>
          <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={onboardingDone}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auto" options={{ orientation: 'landscape', animation: 'fade' }} />
          <Stack.Screen name="apps" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="weather" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="history" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="+not-found" options={{ animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
