import * as Location from 'expo-location';
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
import { AppState, Linking, Platform } from 'react-native';
import { useSettings } from '@/store/settings';
import { haversineDistance, type Coordinate } from '@/utils/geo';

export type GpsStatus = 'unknown' | 'disabled' | 'requesting' | 'searching' | 'excellent' | 'good' | 'weak' | 'denied' | 'error';

type LocationContextValue = {
  permission: 'undetermined' | 'granted' | 'denied';
  canAskAgain: boolean;
  deviceCoordinates: Coordinate | null;
  effectiveCoordinates: Coordinate | null;
  locationLabel: string | null;
  isManualLocation: boolean;
  speedMps: number | null;
  heading: number | null;
  accuracy: number | null;
  updatedAt: number | null;
  gpsStatus: GpsStatus;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  refresh: () => Promise<void>;
  openSystemSettings: () => void;
  reverseLabel: (coordinate: Coordinate) => Promise<string | null>;
};

const LocationContext = createContext<LocationContextValue | null>(null);

function buildAddressLabel(address: Location.LocationGeocodedAddress): string | null {
  const parts = [address.name, address.street, address.city, address.region, address.country]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  const unique = parts.filter((part, index) => parts.indexOf(part) === index);
  if (unique.length === 0) return null;
  return unique.slice(0, 2).join(', ');
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [permission, setPermission] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [deviceCoordinates, setDeviceCoordinates] = useState<Coordinate | null>(null);
  const [speedMps, setSpeedMps] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [autoLabel, setAutoLabel] = useState<string | null>(null);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastGeocodedRef = useRef<{ coordinate: Coordinate; at: number; label: string | null } | null>(null);

  const applyPosition = useCallback((position: Location.LocationObject) => {
    const coordinate = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    setDeviceCoordinates(coordinate);
    setSpeedMps(position.coords.speed !== null && position.coords.speed >= 0 ? position.coords.speed : 0);
    setHeading(position.coords.heading);
    setAccuracy(position.coords.accuracy ?? null);
    setUpdatedAt(position.timestamp);
    const acc = position.coords.accuracy ?? 999;
    setGpsStatus(acc <= 25 ? 'excellent' : acc <= 60 ? 'good' : 'weak');
    setError(null);
  }, []);

  const stopWatching = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  const startWatching = useCallback(async () => {
    if (watchRef.current) return;
    try {
      setGpsStatus((current) => (current === 'excellent' || current === 'good' ? current : 'searching'));
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 3,
          mayShowUserSettingsDialog: true,
        },
        applyPosition,
        (reason) => {
          setGpsStatus('error');
          setError(`No fue posible leer la ubicación: ${reason}`);
        },
      );
      watchRef.current = subscription;
    } catch (reason) {
      setGpsStatus('error');
      setError('No fue posible iniciar el seguimiento GPS. Revisa los permisos del sistema.');
      console.warn('[location] watchPositionAsync', reason);
    }
  }, [applyPosition]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setGpsStatus('requesting');
    setError(null);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setGpsStatus('disabled');
        setError('Los servicios de ubicación del dispositivo están desactivados.');
        return false;
      }
      let current = await Location.getForegroundPermissionsAsync();
      if (!current.granted) {
        current = await Location.requestForegroundPermissionsAsync();
      }
      setCanAskAgain(current.canAskAgain);
      if (!current.granted) {
        setPermission('denied');
        setGpsStatus('denied');
        setError('Sin permiso de ubicación. Puedes activarlo en los ajustes del sistema o usar una ubicación manual.');
        return false;
      }
      setPermission('granted');
      const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 120_000 });
      if (lastKnown) applyPosition(lastKnown);
      await startWatching();
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        .then(applyPosition)
        .catch(() => undefined);
      return true;
    } catch (reason) {
      setGpsStatus('error');
      setError('Ocurrió un error al solicitar la ubicación.');
      console.warn('[location] requestPermission', reason);
      return false;
    }
  }, [applyPosition, startWatching]);

  const refresh = useCallback(async () => {
    if (permission !== 'granted') return;
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setGpsStatus('disabled');
        setError('Activa los servicios de ubicación para calcular velocidad y rutas.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      applyPosition(position);
      await startWatching();
    } catch (reason) {
      setGpsStatus('error');
      setError('No fue posible actualizar la ubicación. Inténtalo de nuevo.');
      console.warn('[location] refresh', reason);
    }
  }, [applyPosition, permission, startWatching]);

  // Estado inicial: nunca mostramos un permiso que el usuario no haya otorgado.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await Location.getForegroundPermissionsAsync();
        if (!active) return;
        setCanAskAgain(current.canAskAgain);
        if (current.granted) {
          setPermission('granted');
          const servicesEnabled = await Location.hasServicesEnabledAsync();
          if (!servicesEnabled) {
            setGpsStatus('disabled');
            return;
          }
          const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 300_000 });
          if (active && lastKnown) applyPosition(lastKnown);
          await startWatching();
          if (active) setGpsStatus((status) => (status === 'searching' ? 'searching' : status));
        } else {
          setPermission(current.status === 'denied' ? 'denied' : 'undetermined');
          setGpsStatus('unknown');
        }
      } catch {
        if (active) setGpsStatus('unknown');
      }
    })();
    return () => {
      active = false;
      stopWatching();
    };
  }, [applyPosition, startWatching, stopWatching]);

  // Etiqueta aproximada de la ubicación (geocodificación inversa nativa).
  useEffect(() => {
    if (settings.useManualLocation && settings.manualLocation) {
      setAutoLabel(null);
      return;
    }
    if (!deviceCoordinates) return;
    const previous = lastGeocodedRef.current;
    const moved = previous ? haversineDistance(previous.coordinate, deviceCoordinates) : Infinity;
    const elapsed = previous ? Date.now() - previous.at : Infinity;
    if (previous && moved < 1200 && elapsed < 10 * 60_000) return;
    if (moved < 400 && previous?.label) return;

    let active = true;
    const timer = setTimeout(() => {
      Location.reverseGeocodeAsync(deviceCoordinates)
        .then((results) => {
          if (!active) return;
          const label = results[0] ? buildAddressLabel(results[0]) : null;
          if (label) setAutoLabel(label);
          lastGeocodedRef.current = { coordinate: deviceCoordinates, at: Date.now(), label };
        })
        .catch(() => {
          lastGeocodedRef.current = { coordinate: deviceCoordinates, at: Date.now(), label: null };
        });
    }, 1200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [deviceCoordinates, settings.manualLocation, settings.useManualLocation]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && permission === 'granted') {
        void refresh();
      }
    });
    return () => subscription.remove();
  }, [permission, refresh]);

  const isManualLocation = settings.useManualLocation && Boolean(settings.manualLocation);
  const effectiveCoordinates = useMemo<Coordinate | null>(() => {
    if (isManualLocation && settings.manualLocation) {
      return {
        latitude: settings.manualLocation.latitude,
        longitude: settings.manualLocation.longitude,
      };
    }
    return deviceCoordinates;
  }, [isManualLocation, settings.manualLocation, deviceCoordinates]);

  const locationLabel = isManualLocation
    ? settings.manualLocation!.label
    : autoLabel ??
      (deviceCoordinates
        ? `${deviceCoordinates.latitude.toFixed(4)}, ${deviceCoordinates.longitude.toFixed(4)}`
        : null);

  const reverseLabel = useCallback(async (coordinate: Coordinate) => {
    try {
      const results = await Location.reverseGeocodeAsync(coordinate);
      return results[0] ? buildAddressLabel(results[0]) : null;
    } catch {
      return null;
    }
  }, []);

  const openSystemSettings = useCallback(() => {
    if (Platform.OS === 'android') {
      void Linking.openSettings();
    } else {
      void Linking.openURL('app-settings:');
    }
  }, []);

  const value = useMemo(
    () => ({
      permission,
      canAskAgain,
      deviceCoordinates,
      effectiveCoordinates,
      locationLabel,
      isManualLocation,
      speedMps,
      heading,
      accuracy,
      updatedAt,
      gpsStatus,
      error,
      requestPermission,
      refresh,
      openSystemSettings,
      reverseLabel,
    }),
    [
      permission,
      canAskAgain,
      deviceCoordinates,
      effectiveCoordinates,
      locationLabel,
      isManualLocation,
      speedMps,
      heading,
      accuracy,
      updatedAt,
      gpsStatus,
      error,
      requestPermission,
      refresh,
      openSystemSettings,
      reverseLabel,
    ],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation debe usarse dentro de LocationProvider');
  return context;
}
