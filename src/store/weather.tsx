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
import { fetchWeather, type WeatherData } from '@/services/weather';
import { useLocation } from '@/store/location';
import { errorMessage } from '@/utils/http';
import { haversineDistance } from '@/utils/geo';

const REFRESH_AFTER_MS = 10 * 60 * 1000;
const REFRESH_AFTER_METERS = 2500;

type WeatherContextValue = {
  weather: WeatherData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const WeatherContext = createContext<WeatherContextValue | null>(null);

export function WeatherProvider({ children }: { children: ReactNode }) {
  const { effectiveCoordinates } = useLocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const lastFetchRef = useRef<{ coordinate: { latitude: number; longitude: number }; at: number } | null>(null);
  const lastAttemptRef = useRef(0);
  const weatherRef = useRef<WeatherData | null>(null);
  weatherRef.current = weather;

  const load = useCallback(
    async (manual: boolean) => {
      if (!effectiveCoordinates) return;
      lastAttemptRef.current = Date.now();
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      if (manual || !weatherRef.current) setLoading(true);
      if (manual) setRefreshing(true);
      setError(null);
      try {
        const result = await fetchWeather(effectiveCoordinates, { signal: controller.signal });
        setWeather(result);
        lastFetchRef.current = { coordinate: effectiveCoordinates, at: Date.now() };
      } catch (reason) {
        if (controller.signal.aborted) return;
        const message = errorMessage(reason, 'No fue posible obtener el clima.');
        setError(
          weatherRef.current
            ? `${message} Se muestran los últimos datos disponibles.`
            : message,
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [effectiveCoordinates],
  );

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  useEffect(() => {
    if (!effectiveCoordinates) {
      setWeather(null);
      setError(null);
      lastFetchRef.current = null;
      abortRef.current?.abort();
      return;
    }
    const last = lastFetchRef.current;
    const moved = last ? haversineDistance(last.coordinate, effectiveCoordinates) : Infinity;
    const stale = last ? Date.now() - last.at > REFRESH_AFTER_MS : true;
    const busy = loading || refreshing;
    if (busy) return;
    const retryBlocked = !weatherRef.current && Date.now() - lastAttemptRef.current < 60_000;
    if (retryBlocked) return;
    if (!weatherRef.current || moved > REFRESH_AFTER_METERS || stale) {
      void load(false);
    }
  }, [effectiveCoordinates, load, loading, refreshing]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const value = useMemo(
    () => ({ weather, loading, refreshing, error, refresh }),
    [weather, loading, refreshing, error, refresh],
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather(): WeatherContextValue {
  const context = useContext(WeatherContext);
  if (!context) throw new Error('useWeather debe usarse dentro de WeatherProvider');
  return context;
}
