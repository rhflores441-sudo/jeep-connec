import { API, APP_USER_AGENT } from '@/constants/config';
import { ApiError, requestJson } from '@/utils/http';

export type RadioStation = {
  id: string;
  name: string;
  url: string;
  favicon: string | null;
  country: string;
  countryCode: string;
  state: string;
  tags: string[];
  codec: string;
  bitrate: number;
  votes: number;
  homepage: string;
  language: string;
};

type RadioBrowserStation = {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved?: string;
  favicon?: string;
  country?: string;
  countrycode?: string;
  state?: string;
  tags?: string;
  codec?: string;
  bitrate?: number;
  votes?: number;
  homepage?: string;
  language?: string;
  lastcheckok?: number;
};

export const RADIO_GENRES = [
  { id: 'pop', label: 'Pop' },
  { id: 'rock', label: 'Rock' },
  { id: 'cumbia', label: 'Cumbia' },
  { id: 'banda', label: 'Banda' },
  { id: 'regional mexican', label: 'Regional' },
  { id: 'jazz', label: 'Jazz' },
  { id: 'clasica', label: 'Clásica' },
  { id: 'electronica', label: 'Electrónica' },
  { id: 'noticias', label: 'Noticias' },
  { id: 'deportes', label: 'Deportes' },
] as const;

function normalizeStation(raw: RadioBrowserStation): RadioStation | null {
  const url = (raw.url_resolved || raw.url || '').trim();
  if (!url.startsWith('http')) return null;
  const name = (raw.name || '').replace(/\s+/g, ' ').trim();
  if (!name) return null;
  return {
    id: raw.stationuuid,
    name,
    url,
    favicon: raw.favicon && raw.favicon.startsWith('http') ? raw.favicon : null,
    country: raw.country?.trim() || '',
    countryCode: raw.countrycode?.trim().toUpperCase() || '',
    state: raw.state?.trim() || '',
    tags: (raw.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 5),
    codec: (raw.codec || '').toUpperCase(),
    bitrate: raw.bitrate ?? 0,
    votes: raw.votes ?? 0,
    homepage: raw.homepage || '',
    language: raw.language || '',
  };
}

async function radioRequest<T>(path: string, signal?: AbortSignal): Promise<T> {
  const bases = [API.radio, ...API.radioFallbacks.filter((base) => base !== API.radio)];
  let lastError: unknown;
  for (const base of bases) {
    try {
      return await requestJson<T>(`${base}${path}`, {
        headers: { 'User-Agent': APP_USER_AGENT },
        signal,
        timeoutMs: 12_000,
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof ApiError
    ? lastError
    : new ApiError('No fue posible conectar con el directorio de radio. Inténtalo de nuevo.');
}

function buildSearchParams(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  return search.toString();
}

export async function fetchMexicanStations(limit = 40, signal?: AbortSignal): Promise<RadioStation[]> {
  const query = buildSearchParams({
    countrycode: 'MX',
    hidebroken: 'true',
    order: 'clickcount',
    reverse: 'true',
    limit,
  });
  const data = await radioRequest<RadioBrowserStation[]>(`/json/stations/search?${query}`, signal);
  return dedupeStations(data.map(normalizeStation).filter((station): station is RadioStation => station !== null));
}

export async function fetchTopStations(limit = 40, signal?: AbortSignal): Promise<RadioStation[]> {
  const data = await radioRequest<RadioBrowserStation[]>(`/json/stations/topvote/${limit}`, signal);
  return dedupeStations(data.map(normalizeStation).filter((station): station is RadioStation => station !== null));
}

export async function searchStations(query: string, limit = 40, signal?: AbortSignal): Promise<RadioStation[]> {
  const search = buildSearchParams({ name: query, hidebroken: 'true', limit, order: 'clickcount', reverse: 'true' });
  const data = await radioRequest<RadioBrowserStation[]>(`/json/stations/search?${search}`, signal);
  return dedupeStations(data.map(normalizeStation).filter((station): station is RadioStation => station !== null));
}

export async function fetchStationsByGenre(genre: string, limit = 40, signal?: AbortSignal): Promise<RadioStation[]> {
  const search = buildSearchParams({
    tag: genre,
    hidebroken: 'true',
    limit,
    order: 'clickcount',
    reverse: 'true',
  });
  const data = await radioRequest<RadioBrowserStation[]>(`/json/stations/search?${search}`, signal);
  return dedupeStations(data.map(normalizeStation).filter((station): station is RadioStation => station !== null));
}

function dedupeStations(stations: RadioStation[]): RadioStation[] {
  const seen = new Set<string>();
  return stations.filter((station) => {
    if (seen.has(station.id) || seen.has(station.url)) return false;
    seen.add(station.id);
    seen.add(station.url);
    return true;
  });
}
