/**
 * Configuración central de Jeep Connect.
 * Los endpoints son servicios abiertos; se pueden sobreescribir con variables
 * EXPO_PUBLIC_* en el archivo .env (ver .env.example).
 */

export const APP = {
  name: 'Jeep Connect',
  shortName: 'Jeep Connect',
  vehicle: 'Jeep Liberty 2010',
  vehicleColor: 'Verde natural metálico',
  version: '1.0.0',
} as const;

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const API = {
  weather: 'https://api.open-meteo.com/v1/forecast',
  nominatim: stripTrailingSlash(process.env.EXPO_PUBLIC_NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org'),
  osrm: stripTrailingSlash(process.env.EXPO_PUBLIC_OSRM_URL ?? 'https://router.project-osrm.org'),
  radio: stripTrailingSlash(process.env.EXPO_PUBLIC_RADIO_API_URL ?? 'https://de1.api.radio-browser.info'),
  radioFallbacks: [
    'https://de1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
    'https://at1.api.radio-browser.info',
  ],
  tileDark:
    process.env.EXPO_PUBLIC_TILE_URL_DARK ??
    'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  tileLight:
    process.env.EXPO_PUBLIC_TILE_URL_LIGHT ??
    'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
} as const;

export const SPOTIFY = {
  clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID?.trim() ?? '',
  /** URI exacta registrada en el dashboard de Spotify (HTTPS o loopback). */
  redirectUri: process.env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI?.trim() ?? '',
  /** Proxy opcional que traduce el callback HTTPS de Spotify al esquema de la app. */
  authProxyUrl: stripTrailingSlash(process.env.EXPO_PUBLIC_SPOTIFY_AUTH_PROXY_URL?.trim() ?? ''),
  scopes: [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
  ],
  apiBase: 'https://api.spotify.com/v1',
  accountsBase: 'https://accounts.spotify.com',
} as const;

export const MAP = {
  minZoom: 3,
  maxZoom: 18,
  tileSize: 256,
  attribution: '© OpenStreetMap contributors · © CARTO',
  defaultCenter: { latitude: 19.4326, longitude: -99.1332 }, // Ciudad de México
  defaultZoom: 12,
} as const;

export const STORAGE_KEYS = {
  settings: 'jeepconnect.settings.v1',
  library: 'jeepconnect.library.v1',
  spotifyTokens: 'jeepconnect.spotify.tokens.v1',
  spotifyProfile: 'jeepconnect.spotify.profile.v1',
} as const;

export const REQUEST_TIMEOUT_MS = 15000;

/** User-Agent identificable exigido por las políticas de las APIs abiertas. */
export const APP_USER_AGENT = 'JeepConnect/1.0 (React Native; contacto: configurar en .env)';
