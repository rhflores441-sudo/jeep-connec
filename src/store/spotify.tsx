import { ResponseType, useAuthRequest, type AuthSessionResult } from 'expo-auth-session';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { SPOTIFY } from '@/constants/config';
import {
  clearTokens,
  exchangeCode,
  getAppReturnUri,
  getRegisteredRedirectUri,
  getTokenRedirectUri,
  isRedirectUriCompatible,
  isSpotifyConfigured,
  loadTokens,
  refreshTokens,
  saveTokens,
  spotifyDiscovery,
  type SpotifyTokens,
} from '@/services/spotifyAuth';
import {
  getDevices,
  getMyPlaylists,
  getPlaybackState,
  getProfile,
  pausePlayback,
  searchSpotify,
  seekPlayback,
  setPlaybackVolume,
  skipNext,
  skipPrevious,
  startPlayback,
  transferPlayback,
  trackSubtitle,
  pickImage,
  type SpotifyPlaybackState,
  type SpotifyPlaylist,
  type SpotifyProfile,
  type SpotifySearchResults,
  type SpotifyTrack,
} from '@/services/spotify';
import { useLibrary } from '@/store/library';
import { ApiError } from '@/utils/http';

export type SpotifyStatus = 'unconfigured' | 'initializing' | 'disconnected' | 'connecting' | 'connected' | 'error';

type SpotifyContextValue = {
  configured: boolean;
  redirectUri: string;
  appReturnUri: string;
  proxyConfigured: boolean;
  redirectCompatible: boolean;
  status: SpotifyStatus;
  profile: SpotifyProfile | null;
  playback: SpotifyPlaybackState | null;
  error: string | null;
  pendingAction: string | null;
  isPremium: boolean;
  isFree: boolean;
  planKnown: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  search: (query: string, signal?: AbortSignal) => Promise<SpotifySearchResults>;
  loadPlaylists: () => Promise<SpotifyPlaylist[]>;
  playTrack: (track: SpotifyTrack) => Promise<void>;
  playPlaylist: (playlist: SpotifyPlaylist) => Promise<void>;
  togglePlayback: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  setVolume: (percent: number) => Promise<void>;
  syncPlayback: () => Promise<SpotifyPlaybackState | null>;
  clearError: () => void;
};

const SpotifyContext = createContext<SpotifyContextValue | null>(null);
const REGISTERED_REDIRECT_URI = getRegisteredRedirectUri();
const APP_RETURN_URI = getAppReturnUri();
const TOKEN_REDIRECT_URI = getTokenRedirectUri();
const PROXY_CONFIGURED = SPOTIFY.authProxyUrl.length > 0;

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const configured = isSpotifyConfigured();
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: SPOTIFY.clientId,
      scopes: [...SPOTIFY.scopes],
      redirectUri: APP_RETURN_URI,
      responseType: ResponseType.Code,
      usePKCE: true,
    },
    spotifyDiscovery,
  );

  const { addHistory } = useLibrary();
  const [status, setStatus] = useState<SpotifyStatus>(configured ? 'initializing' : 'unconfigured');
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [playback, setPlayback] = useState<SpotifyPlaybackState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const tokensRef = useRef<SpotifyTokens | null>(null);
  const statusRef = useRef<SpotifyStatus>(status);
  statusRef.current = status;
  const processedCodeRef = useRef<string | null>(null);
  const historyItemRef = useRef<string | null>(null);

  const disconnect = useCallback(async () => {
    tokensRef.current = null;
    setProfile(null);
    setPlayback(null);
    setStatus(configured ? 'disconnected' : 'unconfigured');
    historyItemRef.current = null;
    await clearTokens().catch(() => undefined);
  }, [configured]);

  const ensureAccessToken = useCallback(
    async (forceRefresh = false): Promise<string | null> => {
      const current = tokensRef.current;
      if (!current) {
        setStatus(configured ? 'disconnected' : 'unconfigured');
        return null;
      }
      const fresh = current.expiresAt - Date.now() > 60_000;
      if (fresh && !forceRefresh) return current.accessToken;
      if (!current.refreshToken) {
        await disconnect();
        setError('La sesión de Spotify expiró. Vuelve a conectar la cuenta.');
        return null;
      }
      try {
        const refreshed = await refreshTokens(current.refreshToken);
        tokensRef.current = refreshed;
        await saveTokens(refreshed);
        setStatus('connected');
        return refreshed.accessToken;
      } catch (reason) {
        await disconnect();
        setError(
          reason instanceof ApiError
            ? `No se pudo renovar la sesión de Spotify: ${reason.message}`
            : 'No se pudo renovar la sesión de Spotify. Vuelve a conectar la cuenta.',
        );
        return null;
      }
    },
    [configured, disconnect],
  );

  const withToken = useCallback(
    async <T,>(operation: (token: string) => Promise<T>): Promise<T> => {
      const token = await ensureAccessToken();
      if (!token) throw new ApiError('Conecta tu cuenta de Spotify para continuar.');
      try {
        return await operation(token);
      } catch (reason) {
        if (reason instanceof ApiError && reason.status === 401) {
          const renewed = await ensureAccessToken(true);
          if (renewed) return operation(renewed);
        }
        throw reason;
      }
    },
    [ensureAccessToken],
  );

  const loadProfile = useCallback(
    async (token: string) => {
      try {
        const data = await getProfile(token);
        setProfile(data);
      } catch (reason) {
        console.warn('[spotify] perfil', reason);
      }
    },
    [],
  );

  const syncPlayback = useCallback(async (): Promise<SpotifyPlaybackState | null> => {
    if (statusRef.current !== 'connected') return null;
    try {
      const token = await ensureAccessToken();
      if (!token) return null;
      const state = await getPlaybackState(token);
      setPlayback(state);
      return state;
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        setError('La sesión de Spotify necesita renovarse.');
      }
      return null;
    }
  }, [ensureAccessToken]);

  // Restaurar sesión segura al iniciar.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!configured) {
        if (active) setStatus('unconfigured');
        return;
      }
      const stored = await loadTokens();
      if (!active) return;
      if (!stored) {
        setStatus('disconnected');
        return;
      }
      let tokens = stored;
      if (tokens.expiresAt - Date.now() <= 60_000) {
        if (!tokens.refreshToken) {
          await disconnect();
          return;
        }
        try {
          tokens = await refreshTokens(tokens.refreshToken);
          await saveTokens(tokens);
        } catch {
          await disconnect();
          if (active) setError('La sesión guardada de Spotify expiró. Conecta la cuenta nuevamente.');
          return;
        }
      }
      if (!active) return;
      tokensRef.current = tokens;
      setStatus('connected');
      await loadProfile(tokens.accessToken);
    })().catch(() => {
      if (active) setStatus('disconnected');
    });
    return () => {
      active = false;
    };
  }, [configured, disconnect, loadProfile]);

  // Resultado del flujo OAuth.
  useEffect(() => {
    if (!response) return;
    if (response.type === 'error') {
      setStatus(tokensRef.current ? 'connected' : 'error');
      setError('Spotify rechazó la autorización. Verifica la Redirect URI registrada en el dashboard.');
      return;
    }
    if (response.type !== 'success') {
      if (statusRef.current === 'connecting') {
        setStatus(tokensRef.current ? 'connected' : 'disconnected');
      }
      return;
    }
    const code = response.params.code;
    if (!code || !request?.codeVerifier || processedCodeRef.current === code) return;
    processedCodeRef.current = code;
    setStatus('connecting');
    setError(null);
    exchangeCode(code, request.codeVerifier, TOKEN_REDIRECT_URI)
      .then(async (tokens) => {
        tokensRef.current = tokens;
        await saveTokens(tokens);
        setStatus('connected');
        await loadProfile(tokens.accessToken);
        await syncPlayback();
      })
      .catch((reason) => {
        setStatus('error');
        setError(
          reason instanceof ApiError
            ? `Spotify no aceptó el código de autorización: ${reason.message}`
            : 'No se pudo completar la autenticación con Spotify. Revisa la Redirect URI y tu conexión.',
        );
      });
  }, [response, request, loadProfile, syncPlayback]);

  const connect = useCallback(async () => {
    if (!configured) {
      setStatus('unconfigured');
      setError('Falta EXPO_PUBLIC_SPOTIFY_CLIENT_ID en el archivo .env. Consulta docs/SPOTIFY.md.');
      return;
    }
    setError(null);
    setStatus('connecting');
    try {
      const result: AuthSessionResult = await promptAsync({ showInRecents: true });
      if (result.type === 'cancel' || result.type === 'dismiss') {
        setStatus(tokensRef.current ? 'connected' : 'disconnected');
      }
    } catch (reason) {
      setStatus(tokensRef.current ? 'connected' : 'error');
      setError(
        reason instanceof Error
          ? `No se pudo abrir la autorización de Spotify: ${reason.message}`
          : 'No se pudo abrir la autorización de Spotify.',
      );
    }
  }, [configured, promptAsync]);

  // Sondeo del estado de reproducción (solo en primer plano).
  useEffect(() => {
    if (status !== 'connected') return;
    const tick = () => {
      if (AppState.currentState !== 'active') return;
      void syncPlayback();
    };
    const initial = setTimeout(tick, 600);
    const interval = setInterval(tick, 8000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [status, syncPlayback]);

  // Historial de reproducción real de Spotify.
  useEffect(() => {
    const item = playback?.item;
    if (!item || item.id === historyItemRef.current) return;
    historyItemRef.current = item.id;
    addHistory({
      id: item.id,
      source: 'spotify',
      title: item.name,
      subtitle: trackSubtitle(item),
      artwork: pickImage(item.album.images),
      contextUri: item.album.uri,
    });
  }, [playback?.item, addHistory]);

  const findDeviceIfNeeded = useCallback(async <T,>(operation: (token: string) => Promise<T>): Promise<T> => {
    return withToken(async (token) => {
      try {
        return await operation(token);
      } catch (reason) {
        if (!(reason instanceof ApiError) || reason.status !== 404) throw reason;
        const devices = await getDevices(token);
        const device = devices.find((candidate) => candidate.is_active) ?? devices[0];
        if (!device?.id) throw reason;
        await transferPlayback(token, device.id, false);
        return operation(token);
      }
    });
  }, [withToken]);

  const playTrack = useCallback(
    async (track: SpotifyTrack) => {
      setPendingAction('play');
      try {
        await findDeviceIfNeeded((token) => startPlayback(token, { uris: [track.uri] }));
        setTimeout(() => void syncPlayback(), 900);
      } finally {
        setPendingAction(null);
      }
    },
    [findDeviceIfNeeded, syncPlayback],
  );

  const playPlaylist = useCallback(
    async (playlist: SpotifyPlaylist) => {
      setPendingAction('play');
      try {
        await findDeviceIfNeeded((token) => startPlayback(token, { contextUri: playlist.uri }));
        setTimeout(() => void syncPlayback(), 900);
      } finally {
        setPendingAction(null);
      }
    },
    [findDeviceIfNeeded, syncPlayback],
  );

  const togglePlayback = useCallback(async () => {
    setPendingAction('toggle');
    try {
      await findDeviceIfNeeded(async (token) => {
        if (playback?.is_playing) await pausePlayback(token);
        else if (playback?.item) await startPlayback(token, { uris: [playback.item.uri] });
        else await startPlayback(token, {});
      });
      setTimeout(() => void syncPlayback(), 700);
    } finally {
      setPendingAction(null);
    }
  }, [findDeviceIfNeeded, playback, syncPlayback]);

  const next = useCallback(async () => {
    setPendingAction('next');
    try {
      await findDeviceIfNeeded(skipNext);
      setTimeout(() => void syncPlayback(), 900);
    } finally {
      setPendingAction(null);
    }
  }, [findDeviceIfNeeded, syncPlayback]);

  const previous = useCallback(async () => {
    setPendingAction('previous');
    try {
      await findDeviceIfNeeded(skipPrevious);
      setTimeout(() => void syncPlayback(), 900);
    } finally {
      setPendingAction(null);
    }
  }, [findDeviceIfNeeded, syncPlayback]);

  const seek = useCallback(
    async (positionMs: number) => {
      await withToken((token) => seekPlayback(token, positionMs));
      setTimeout(() => void syncPlayback(), 500);
    },
    [syncPlayback, withToken],
  );

  const setVolume = useCallback(
    async (percent: number) => {
      await withToken((token) => setPlaybackVolume(token, percent));
    },
    [withToken],
  );

  const search = useCallback(
    (query: string, signal?: AbortSignal) => withToken((token) => searchSpotify(token, query, { signal })),
    [withToken],
  );

  const loadPlaylists = useCallback(
    () => withToken((token) => getMyPlaylists(token)),
    [withToken],
  );

  const clearError = useCallback(() => setError(null), []);

  // Desde 2026 el campo `product` puede no venir en GET /me para apps en modo
  // desarrollo. Si falta, no se bloquea nada: la API devuelve el error real.
  const isPremium = profile?.product === 'premium';
  const isFree = profile?.product === 'free';
  const planKnown = isPremium || isFree;

  const value = useMemo<SpotifyContextValue>(
    () => ({
      configured,
      redirectUri: REGISTERED_REDIRECT_URI,
      appReturnUri: APP_RETURN_URI,
      proxyConfigured: PROXY_CONFIGURED,
      redirectCompatible: isRedirectUriCompatible(REGISTERED_REDIRECT_URI),
      status,
      profile,
      playback,
      error,
      pendingAction,
      isPremium,
      isFree,
      planKnown,
      connect,
      disconnect,
      search,
      loadPlaylists,
      playTrack,
      playPlaylist,
      togglePlayback,
      next,
      previous,
      seek,
      setVolume,
      syncPlayback,
      clearError,
    }),
    [
      configured,
      status,
      profile,
      playback,
      error,
      pendingAction,
      isPremium,
      isFree,
      planKnown,
      connect,
      disconnect,
      search,
      loadPlaylists,
      playTrack,
      playPlaylist,
      togglePlayback,
      next,
      previous,
      seek,
      setVolume,
      syncPlayback,
      clearError,
    ],
  );

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
}

export function useSpotify(): SpotifyContextValue {
  const context = useContext(SpotifyContext);
  if (!context) throw new Error('useSpotify debe usarse dentro de SpotifyProvider');
  return context;
}
