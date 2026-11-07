import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { STORAGE_KEYS } from '@/constants/config';
import { darkColors, lightColors, type Palette, type ThemeMode } from '@/constants/theme';

export type { ThemeMode };

export type Units = 'metric' | 'imperial';
export type LayoutMode = 'mobile' | 'auto';
export type MapStyle = 'auto' | 'dark' | 'light';

export type ManualLocation = {
  label: string;
  latitude: number;
  longitude: number;
};

export type AppSettings = {
  onboardingComplete: boolean;
  themeMode: ThemeMode;
  layoutMode: LayoutMode;
  units: Units;
  volume: number;
  keepAwake: boolean;
  notificationsEnabled: boolean;
  useManualLocation: boolean;
  manualLocation: ManualLocation | null;
  mapStyle: MapStyle;
  equalizerPreset: string;
  equalizerBands: number[];
  /** Client ID público de Spotify que el usuario pega en Ajustes. */
  spotifyClientId: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  onboardingComplete: false,
  themeMode: 'dark',
  layoutMode: 'mobile',
  units: 'metric',
  volume: 0.75,
  keepAwake: false,
  notificationsEnabled: false,
  useManualLocation: false,
  manualLocation: null,
  mapStyle: 'auto',
  equalizerPreset: 'flat',
  equalizerBands: [0, 0, 0, 0, 0, 0, 0],
  spotifyClientId: '',
};

type SettingsContextValue = {
  settings: AppSettings;
  hydrated: boolean;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function parseSettings(raw: string | null): AppSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      equalizerBands:
        Array.isArray(parsed.equalizerBands) && parsed.equalizerBands.length === 7
          ? parsed.equalizerBands.map((band) => Math.max(-8, Math.min(8, Number(band) || 0)))
          : DEFAULT_SETTINGS.equalizerBands,
      volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : DEFAULT_SETTINGS.volume,
      spotifyClientId:
        typeof parsed.spotifyClientId === 'string' ? parsed.spotifyClientId.trim() : DEFAULT_SETTINGS.spotifyClientId,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEYS.settings)
      .then((raw) => {
        if (active) setSettings(parseSettings(raw));
      })
      .catch((error) => console.warn('[settings] No se pudo leer la configuración', error))
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next)).catch((error) =>
        console.warn('[settings] No se pudo guardar la configuración', error),
      );
      return next;
    });
  }, []);

  const resetSettings = useCallback(async () => {
    setSettings({ ...DEFAULT_SETTINGS, onboardingComplete: true });
    await AsyncStorage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify({ ...DEFAULT_SETTINGS, onboardingComplete: true }),
    );
  }, []);

  const value = useMemo(
    () => ({ settings, hydrated, updateSettings, resetSettings }),
    [settings, hydrated, updateSettings, resetSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings debe usarse dentro de SettingsProvider');
  return context;
}

export type AppTheme = {
  colors: Palette;
  isDark: boolean;
  scheme: 'light' | 'dark';
  mode: ThemeMode;
};

export function useTheme(): AppTheme {
  const { settings } = useSettings();
  const systemScheme = useColorScheme();
  const scheme: 'light' | 'dark' =
    settings.themeMode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : settings.themeMode;
  return useMemo(
    () => ({
      colors: scheme === 'dark' ? darkColors : lightColors,
      isDark: scheme === 'dark',
      scheme,
      mode: settings.themeMode,
    }),
    [scheme, settings.themeMode],
  );
}
