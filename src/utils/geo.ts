import { MAP } from '@/constants/config';

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export const toRad = (degrees: number) => (degrees * Math.PI) / 180;
export const toDeg = (radians: number) => (radians * 180) / Math.PI;

export function clampLatitude(latitude: number): number {
  return Math.max(-85.05112878, Math.min(85.05112878, latitude));
}

export function normalizeLongitude(longitude: number): number {
  let lon = longitude;
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return lon;
}

export function worldSize(zoom: number): number {
  return MAP.tileSize * 2 ** zoom;
}

/** Proyección Web Mercator a píxeles del mundo (fractional zoom permitido). */
export function project({ latitude, longitude }: Coordinate, zoom: number): { x: number; y: number } {
  const size = worldSize(zoom);
  const clamped = clampLatitude(latitude);
  const x = ((normalizeLongitude(longitude) + 180) / 360) * size;
  const sin = Math.sin(toRad(clamped));
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size;
  return { x, y };
}

export function unproject(x: number, y: number, zoom: number): Coordinate {
  const size = worldSize(zoom);
  const longitude = (x / size) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / size;
  const latitude = toDeg(Math.atan(Math.sinh(n)));
  return { latitude: clampLatitude(latitude), longitude: normalizeLongitude(longitude) };
}

export function moveCenter(center: Coordinate, deltaX: number, deltaY: number, zoom: number): Coordinate {
  const point = project(center, zoom);
  return unproject(point.x + deltaX, point.y + deltaY, zoom);
}

export function haversineDistance(a: Coordinate, b: Coordinate): number {
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function boundsOf(points: Coordinate[]): { north: number; south: number; east: number; west: number } | null {
  if (points.length === 0) return null;
  return points.reduce(
    (acc, point) => ({
      north: Math.max(acc.north, point.latitude),
      south: Math.min(acc.south, point.latitude),
      east: Math.max(acc.east, point.longitude),
      west: Math.min(acc.west, point.longitude),
    }),
    { north: -90, south: 90, east: -180, west: 180 },
  );
}

/** Zoom que permite ver todos los puntos dentro del viewport. */
export function fitZoom(
  points: Coordinate[],
  viewport: { width: number; height: number },
  padding = 64,
): { center: Coordinate; zoom: number } | null {
  if (points.length === 0) return null;
  if (points.length === 1) return { center: points[0], zoom: 15 };
  const bounds = boundsOf(points);
  if (!bounds) return null;
  const center = {
    latitude: (bounds.north + bounds.south) / 2,
    longitude: (bounds.east + bounds.west) / 2,
  };
  const width = Math.max(80, viewport.width - padding * 2);
  const height = Math.max(80, viewport.height - padding * 2);
  const northWest = project({ latitude: bounds.north, longitude: bounds.west }, 0);
  const southEast = project({ latitude: bounds.south, longitude: bounds.east }, 0);
  const dx = Math.abs(southEast.x - northWest.x) || 0.00001;
  const dy = Math.abs(southEast.y - northWest.y) || 0.00001;
  const zoom = Math.min(Math.log2(width / dx), Math.log2(height / dy));
  return { center, zoom: Math.max(MAP.minZoom, Math.min(MAP.maxZoom, zoom)) };
}

export function formatCoordinate({ latitude, longitude }: Coordinate): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

/** Convierte una cadena GeoJSON "lon,lat" de OSRM a coordenadas. */
export function fromGeoJsonPosition(position: [number, number]): Coordinate {
  return { latitude: position[1], longitude: position[0] };
}
