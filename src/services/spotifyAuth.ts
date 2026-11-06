import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { SPOTIFY, STORAGE_KEYS } from '@/constants/config';

const APP_CALLBACK = AuthSession.makeRedirectUri({ scheme: 'jeepconnect', path: 'spotify-callback' });

/**
 * Spotify solo acepta HTTPS o loopback. En móvil, el proxy HTTPS traduce el
 * callback al esquema propio de la app; sin proxy solo funcionan entornos de
 * escritorio/loopback. Ver docs/SPOTIFY.md.
 */
export const spotifyDiscovery = {
  authorizationEndpoint: SPOTIFY.authProxyUrl
    ? `${SPOTIFY.authProxyUrl}/authorize`
    : 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export type SpotifyTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  scope: string;
};

export function isSpotifyConfigured(): boolean {
  return SPOTIFY.clientId.length > 0;
}

/** URI que Spotify tiene registrada y usa para el intercambio de código. */
export function getRegisteredRedirectUri(): string {
  return SPOTIFY.redirectUri || APP_CALLBACK;
}

/** URI que la app escucha al volver del navegador. */
export function getAppReturnUri(): string {
  if (SPOTIFY.authProxyUrl) return APP_CALLBACK;
  return getRegisteredRedirectUri();
}

/** redirect_uri que debe enviarse al canjear el código en /api/token. */
export function getTokenRedirectUri(): string {
  return SPOTIFY.authProxyUrl ? getRegisteredRedirectUri() : getAppReturnUri();
}

/** Spotify exige HTTPS o loopback; los esquemas personalizados no se aceptan. */
export function isRedirectUriCompatible(uri: string): boolean {
  return (
    uri.startsWith('https://') ||
    uri.startsWith('http://127.0.0.1') ||
    uri.startsWith('http://[::1]')
  );
}

const memoryFallback = new Map<string, string>();

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryFallback.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return memoryFallback.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryFallback.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function loadTokens(): Promise<SpotifyTokens | null> {
  try {
    const raw = await secureGet(STORAGE_KEYS.spotifyTokens);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SpotifyTokens>;
    if (!parsed.accessToken || !parsed.expiresAt) return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken ?? null,
      expiresAt: parsed.expiresAt,
      scope: parsed.scope ?? '',
    };
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: SpotifyTokens): Promise<void> {
  await secureSet(STORAGE_KEYS.spotifyTokens, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  await secureDelete(STORAGE_KEYS.spotifyTokens);
  await secureDelete(STORAGE_KEYS.spotifyProfile);
}

export async function exchangeCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<SpotifyTokens> {
  const response = await AuthSession.exchangeCodeAsync(
    {
      clientId: SPOTIFY.clientId,
      code,
      redirectUri,
      extraParams: { code_verifier: codeVerifier },
    },
    spotifyDiscovery,
  );
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken ?? null,
    expiresAt: Date.now() + (response.expiresIn ?? 3600) * 1000,
    scope: response.scope ?? '',
  };
}

export async function refreshTokens(refreshToken: string): Promise<SpotifyTokens> {
  const response = await AuthSession.refreshAsync(
    {
      clientId: SPOTIFY.clientId,
      refreshToken,
    },
    spotifyDiscovery,
  );
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken ?? refreshToken,
    expiresAt: Date.now() + (response.expiresIn ?? 3600) * 1000,
    scope: response.scope ?? '',
  };
}
