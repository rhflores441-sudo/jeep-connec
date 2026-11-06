import { SPOTIFY } from '@/constants/config';
import { ApiError, requestJson } from '@/utils/http';

export type SpotifyImage = {
  url: string;
  width: number | null;
  height: number | null;
};

export type SpotifyArtist = {
  id: string;
  name: string;
  uri: string;
  images?: SpotifyImage[];
};

export type SpotifyAlbum = {
  id: string;
  name: string;
  uri: string;
  images: SpotifyImage[];
  artists: SpotifyArtist[];
  release_date?: string;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  explicit: boolean;
  artists: SpotifyArtist[];
  album: {
    id: string;
    name: string;
    uri: string;
    images: SpotifyImage[];
  };
};

export type SpotifyPlaylist = {
  id: string;
  name: string;
  uri: string;
  images: SpotifyImage[];
  owner: { display_name: string; id: string };
  /** Formato anterior a 2026. */
  tracks?: { total: number };
  /** Formato 2026: solo presente en playlists propias o colaborativas. */
  items?: { total: number };
};

export type SpotifyDevice = {
  id: string | null;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
};

export type SpotifyPlaybackState = {
  is_playing: boolean;
  progress_ms: number | null;
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
  item: SpotifyTrack | null;
  device: SpotifyDevice | null;
  shuffle_state: boolean;
  repeat_state: 'off' | 'track' | 'context';
  timestamp: number;
};

export type SpotifyProfile = {
  id: string;
  display_name: string | null;
  email?: string;
  country?: string;
  /** Puede faltar desde las restricciones de 2026 para apps en desarrollo. */
  product?: 'premium' | 'free' | 'open' | string;
  images?: SpotifyImage[];
  /** Eliminado de GET /me en apps de desarrollo desde 2026. */
  followers?: { total: number };
};

export type SpotifySearchResults = {
  tracks: SpotifyTrack[];
  albums: SpotifyAlbum[];
  artists: SpotifyArtist[];
  playlists: SpotifyPlaylist[];
};

type Paging<T> = { items: T[] };

type RawSearchResponse = {
  tracks?: Paging<SpotifyTrack>;
  albums?: Paging<SpotifyAlbum>;
  artists?: Paging<SpotifyArtist>;
  playlists?: Paging<SpotifyPlaylist>;
};

function mapSpotifyError(status: number, detail?: string): ApiError {
  if (status === 401) {
    return new ApiError('Tu sesión de Spotify expiró. Vuelve a conectar la cuenta.', {
      status,
      code: 'session_expired',
    });
  }
  if (status === 403) {
    return new ApiError(
      'Spotify rechazó la acción. Controlar la reproducción requiere una cuenta Premium y permisos sobre el dispositivo activo.',
      { status, code: 'premium_required' },
    );
  }
  if (status === 404) {
    return new ApiError(
      'No hay un dispositivo activo de Spotify. Abre Spotify en tu teléfono y reproduce algo una vez, o elige un dispositivo disponible.',
      { status, code: 'no_active_device', retryable: true },
    );
  }
  if (status === 429) {
    return new ApiError('Spotify limitó temporalmente las solicitudes. Espera unos segundos.', {
      status,
      code: 'rate_limited',
      retryable: true,
    });
  }
  return new ApiError(detail || 'Spotify no pudo completar la solicitud.', { status });
}

async function spotifyRequest<T>(
  token: string,
  path: string,
  options: { method?: 'GET' | 'PUT' | 'POST'; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  try {
    return await requestJson<T>(`${SPOTIFY.apiBase}${path}`, {
      method: options.method ?? 'GET',
      headers: { Authorization: `Bearer ${token}` },
      body: options.body,
      signal: options.signal,
      timeoutMs: 15_000,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status) throw mapSpotifyError(error.status, error.message);
    throw error;
  }
}

export async function getProfile(token: string): Promise<SpotifyProfile> {
  return spotifyRequest<SpotifyProfile>(token, '/me');
}

export async function searchSpotify(
  token: string,
  query: string,
  options: { types?: string[]; limit?: number; signal?: AbortSignal } = {},
): Promise<SpotifySearchResults> {
  const trimmed = query.trim();
  if (!trimmed) return { tracks: [], albums: [], artists: [], playlists: [] };
  const params = new URLSearchParams({
    q: trimmed,
    type: (options.types ?? ['track', 'album', 'artist', 'playlist']).join(','),
    limit: String(Math.min(10, options.limit ?? 10)),
  });
  const data = await spotifyRequest<RawSearchResponse>(token, `/search?${params.toString()}`, {
    signal: options.signal,
  });
  return {
    tracks: data.tracks?.items ?? [],
    albums: data.albums?.items ?? [],
    artists: data.artists?.items ?? [],
    playlists: (data.playlists?.items ?? []).filter(Boolean),
  };
}

export async function getMyPlaylists(token: string, signal?: AbortSignal): Promise<SpotifyPlaylist[]> {
  const data = await spotifyRequest<Paging<SpotifyPlaylist>>(token, '/me/playlists?limit=20', { signal });
  return (data.items ?? []).filter(Boolean);
}

export async function getPlaybackState(token: string, signal?: AbortSignal): Promise<SpotifyPlaybackState | null> {
  try {
    // Spotify responde 204 sin cuerpo cuando no hay reproducción activa.
    const state = await spotifyRequest<SpotifyPlaybackState | undefined>(token, '/me/player', { signal });
    return state ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 204) return null;
    throw error;
  }
}

export async function getDevices(token: string): Promise<SpotifyDevice[]> {
  const data = await spotifyRequest<{ devices: SpotifyDevice[] }>(token, '/me/player/devices');
  return data.devices ?? [];
}

export async function transferPlayback(token: string, deviceId: string, play = false): Promise<void> {
  await spotifyRequest<void>(token, '/me/player', {
    method: 'PUT',
    body: { device_ids: [deviceId], play },
  });
}

type PlayOptions = {
  uris?: string[];
  contextUri?: string;
  positionMs?: number;
  offset?: { position?: number; uri?: string };
};

export async function startPlayback(token: string, options: PlayOptions): Promise<void> {
  const body: Record<string, unknown> = {};
  if (options.uris?.length) body.uris = options.uris.slice(0, 100);
  if (options.contextUri) body.context_uri = options.contextUri;
  if (options.positionMs !== undefined) body.position_ms = Math.max(0, Math.round(options.positionMs));
  if (options.offset) body.offset = options.offset;
  await spotifyRequest<void>(token, '/me/player/play', { method: 'PUT', body });
}

export async function pausePlayback(token: string): Promise<void> {
  await spotifyRequest<void>(token, '/me/player/pause', { method: 'PUT' });
}

export async function skipNext(token: string): Promise<void> {
  await spotifyRequest<void>(token, '/me/player/next', { method: 'POST' });
}

export async function skipPrevious(token: string): Promise<void> {
  await spotifyRequest<void>(token, '/me/player/previous', { method: 'POST' });
}

export async function seekPlayback(token: string, positionMs: number): Promise<void> {
  await spotifyRequest<void>(token, `/me/player/seek?position_ms=${Math.max(0, Math.round(positionMs))}`, {
    method: 'PUT',
  });
}

export async function setPlaybackVolume(token: string, percent: number): Promise<void> {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  await spotifyRequest<void>(token, `/me/player/volume?volume_percent=${value}`, { method: 'PUT' });
}

export function pickImage(images: SpotifyImage[] | undefined): string | null {
  if (!images?.length) return null;
  return images[0]?.url ?? null;
}

export function trackSubtitle(track: SpotifyTrack): string {
  return track.artists.map((artist) => artist.name).join(', ');
}

/** Compatibilidad con el rename tracks → items de la API 2026. */
export function playlistTrackCount(playlist: SpotifyPlaylist): number | null {
  return playlist.items?.total ?? playlist.tracks?.total ?? null;
}

export function formatSpotifyDuration(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
