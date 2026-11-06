import { API } from '@/constants/config';
import { ApiError, requestJson } from '@/utils/http';
import { fromGeoJsonPosition, type Coordinate } from '@/utils/geo';

export type RouteStep = {
  instruction: string;
  distance: number;
  duration: number;
  name: string;
  type: string;
  modifier: string;
  location: Coordinate;
};

export type RouteResult = {
  distance: number;
  duration: number;
  geometry: Coordinate[];
  steps: RouteStep[];
  origin: Coordinate;
  destination: Coordinate;
  fetchedAt: number;
};

type OsrmStep = {
  distance: number;
  duration: number;
  name: string;
  mode: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
};

type OsrmResponse = {
  code: string;
  message?: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
    legs: {
      steps: OsrmStep[];
    }[];
  }[];
};

function describeStep(step: OsrmStep): string {
  const type = step.maneuver.type;
  const modifier = step.maneuver.modifier ?? '';
  const name = step.name?.trim();
  const target = name ? `en ${name}` : 'en la vía';

  const turn = (() => {
    switch (modifier) {
      case 'left':
        return 'a la izquierda';
      case 'right':
        return 'a la derecha';
      case 'slight left':
        return 'ligeramente a la izquierda';
      case 'slight right':
        return 'ligeramente a la derecha';
      case 'sharp left':
        return 'cerrado a la izquierda';
      case 'sharp right':
        return 'cerrado a la derecha';
      case 'uturn':
        return 'en U';
      case 'straight':
        return 'recto';
      default:
        return '';
    }
  })();

  switch (type) {
    case 'depart':
      return name ? `Comienza por ${name}` : 'Comienza la ruta';
    case 'arrive':
      return 'Llegarás a tu destino';
    case 'turn':
      return turn ? `Gira ${turn} ${target}` : `Gira ${target}`;
    case 'new name':
    case 'continue':
      return name ? `Continúa por ${name}` : 'Continúa recto';
    case 'merge':
      return name ? `Incorpórate a ${name}` : 'Incorpórate a la vía';
    case 'fork':
      return modifier.includes('left')
        ? `Mantente a la izquierda ${target}`
        : modifier.includes('right')
          ? `Mantente a la derecha ${target}`
          : `Sigue ${target}`;
    case 'end of road':
      return turn ? `Al final de la vía, gira ${turn}` : 'Al final de la vía, gira';
    case 'roundabout':
    case 'rotary':
      return name ? `Toma la rotonda y sal por ${name}` : 'Toma la rotonda y sal en la salida indicada';
    case 'on ramp':
      return name ? `Toma la incorporación hacia ${name}` : 'Toma la incorporación';
    case 'off ramp':
      return name ? `Toma la salida hacia ${name}` : 'Toma la salida';
    case 'notification':
      return 'Continúa con precaución';
    default:
      return name ? `Continúa por ${name}` : 'Continúa recto';
  }
}

export async function fetchRoute(
  origin: Coordinate,
  destination: Coordinate,
  options: { signal?: AbortSignal } = {},
): Promise<RouteResult> {
  const coordinates = `${origin.longitude.toFixed(6)},${origin.latitude.toFixed(6)};${destination.longitude.toFixed(
    6,
  )},${destination.latitude.toFixed(6)}`;
  const params = new URLSearchParams({
    overview: 'full',
    geometries: 'geojson',
    steps: 'true',
    alternatives: 'false',
  });
  const url = `${API.osrm}/route/v1/driving/${coordinates}?${params.toString()}`;
  const data = await requestJson<OsrmResponse>(url, { signal: options.signal, timeoutMs: 18_000 });

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new ApiError(
      data.code === 'NoRoute'
        ? 'No se encontró una ruta en auto entre esos puntos.'
        : 'El servicio de rutas no pudo calcular el trayecto.',
      { code: data.code },
    );
  }

  const route = data.routes[0];
  const legacySteps = route.legs.flatMap((leg) => leg.steps);
  const steps: RouteStep[] = legacySteps.map((step) => ({
    instruction: describeStep(step),
    distance: step.distance,
    duration: step.duration,
    name: step.name,
    type: step.maneuver.type,
    modifier: step.maneuver.modifier ?? '',
    location: fromGeoJsonPosition(step.maneuver.location),
  }));

  return {
    distance: route.distance,
    duration: route.duration,
    geometry: route.geometry.coordinates.map(fromGeoJsonPosition),
    steps,
    origin,
    destination,
    fetchedAt: Date.now(),
  };
}
