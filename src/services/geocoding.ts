import { API, APP_USER_AGENT } from '@/constants/config';
import { ApiError, requestJson } from '@/utils/http';
import type { Coordinate } from '@/utils/geo';

export type Place = {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
  category: string;
};

type NominatimPlace = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
  address?: Record<string, string>;
};

const NOMINATIM_HEADERS = {
  'User-Agent': APP_USER_AGENT,
  'Accept-Language': 'es',
};

// La política de Nominatim limita a 1 solicitud por segundo.
let lastRequestAt = 0;
let queue: Promise<unknown> = Promise.resolve();

function rateLimited<T>(operation: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = 1100 - (Date.now() - lastRequestAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
    return operation();
  });
  queue = run.catch(() => undefined);
  return run;
}

function toPlace(raw: NominatimPlace): Place {
  const address = raw.address ?? {};
  const name =
    raw.name?.trim() ||
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    raw.display_name.split(',')[0]?.trim() ||
    'Lugar';
  return {
    id: String(raw.place_id),
    name,
    displayName: raw.display_name,
    latitude: Number(raw.lat),
    longitude: Number(raw.lon),
    type: raw.type ?? '',
    category: raw.class ?? '',
  };
}

export async function searchPlaces(
  query: string,
  options: { limit?: number; proximity?: Coordinate; signal?: AbortSignal } = {},
): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  const params = new URLSearchParams({
    q: trimmed,
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(options.limit ?? 6),
    'accept-language': 'es',
  });
  if (options.proximity) {
    const delta = 1.4;
    const west = Math.max(-180, options.proximity.longitude - delta);
    const east = Math.min(180, options.proximity.longitude + delta);
    const south = Math.max(-85, options.proximity.latitude - delta);
    const north = Math.min(85, options.proximity.latitude + delta);
    params.set('viewbox', `${west},${north},${east},${south}`);
    params.set('bounded', '0');
  }

  const data = await rateLimited(() =>
    requestJson<NominatimPlace[]>(`${API.nominatim}/search?${params.toString()}`, {
      headers: NOMINATIM_HEADERS,
      signal: options.signal,
      timeoutMs: 12_000,
    }),
  );
  return data.map(toPlace).filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
}

export async function reversePlace(coordinate: Coordinate): Promise<Place | null> {
  const params = new URLSearchParams({
    lat: String(coordinate.latitude),
    lon: String(coordinate.longitude),
    format: 'jsonv2',
    zoom: '14',
    addressdetails: '1',
    'accept-language': 'es',
  });
  const data = await rateLimited(() =>
    requestJson<NominatimPlace>(`${API.nominatim}/reverse?${params.toString()}`, {
      headers: NOMINATIM_HEADERS,
      timeoutMs: 12_000,
    }),
  );
  if (!data || !data.lat || !data.lon) return null;
  return toPlace(data);
}

export function placeToCoordinate(place: Place): Coordinate {
  return { latitude: place.latitude, longitude: place.longitude };
}

export async function assertGeocodingAvailable(): Promise<void> {
  try {
    await searchPlaces('Ciudad de México', { limit: 1 });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('El servicio de búsqueda de direcciones no está disponible.');
  }
}
