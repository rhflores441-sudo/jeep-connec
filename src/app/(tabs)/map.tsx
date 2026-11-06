import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Trash2,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useSettings, useTheme } from '@/store/settings';
import { useLibrary, type FavoritePlace } from '@/store/library';
import { useLocation } from '@/store/location';
import { searchPlaces, reversePlace, type Place } from '@/services/geocoding';
import { fetchRoute, type RouteResult } from '@/services/routing';
import { errorMessage } from '@/utils/http';
import { formatCoord, formatDistance, formatDuration } from '@/utils/format';
import type { Coordinate } from '@/utils/geo';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Header } from '@/components/ui/Header';
import { ListRow } from '@/components/ui/ListRow';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { OsmMap, type MapMarker } from '@/components/map/OsmMap';

type Destination = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

function destinationFromPlace(place: Place): Destination {
  return {
    id: `nominatim-${place.id}`,
    name: place.name,
    address: place.displayName,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

function destinationFromFavorite(place: FavoritePlace): Destination {
  return {
    id: place.id,
    name: place.name,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

export default function MapScreen() {
  const { colors, isDark } = useTheme();
  const { settings } = useSettings();
  const { effectiveCoordinates, locationLabel, permission, requestPermission, refresh, gpsStatus } =
    useLocation();
  const { library, savePlace, removePlace } = useLibrary();
  const places = library.places;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Destination | null>(null);
  const [center, setCenter] = useState<Coordinate>(
    effectiveCoordinates ?? { latitude: 19.4326, longitude: -99.1332 },
  );
  const [zoom, setZoom] = useState(12);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [stepsOpen, setStepsOpen] = useState(false);

  const mapDark = settings.mapStyle === 'auto' ? isDark : settings.mapStyle === 'dark';

  useEffect(() => {
    if (!effectiveCoordinates) return;
    setCenter((previous) => {
      if (Math.abs(previous.latitude - effectiveCoordinates.latitude) < 1e-6) return previous;
      return effectiveCoordinates;
    });
  }, [effectiveCoordinates]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(() => {
      searchPlaces(trimmed, {
        proximity: effectiveCoordinates ?? undefined,
        limit: 6,
        signal: controller.signal,
      })
        .then((found) => {
          if (controller.signal.aborted) return;
          setResults(found);
          setSearchError(null);
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setSearchError(errorMessage(error, 'No fue posible buscar direcciones.'));
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 650);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, effectiveCoordinates]);

  const calculateRoute = useCallback(
    async (destination: Destination) => {
      if (!effectiveCoordinates) {
        setRoute(null);
        setRouteError('Activa tu ubicación para calcular una ruta desde donde estás.');
        return;
      }
      setRouteLoading(true);
      setRouteError(null);
      try {
        const result = await fetchRoute(effectiveCoordinates, destination);
        setRoute(result);
        setStepsOpen(false);
        const middle = {
          latitude: (effectiveCoordinates.latitude + destination.latitude) / 2,
          longitude: (effectiveCoordinates.longitude + destination.longitude) / 2,
        };
        setCenter(middle);
        setZoom(result.distance > 60_000 ? 9 : result.distance > 20_000 ? 10 : result.distance > 6_000 ? 12 : 13);
      } catch (error) {
        setRoute(null);
        setRouteError(errorMessage(error, 'No fue posible calcular la ruta.'));
      } finally {
        setRouteLoading(false);
      }
    },
    [effectiveCoordinates],
  );

  const chooseDestination = useCallback(
    (destination: Destination) => {
      setSelected(destination);
      setQuery('');
      setResults([]);
      setCenter({ latitude: destination.latitude, longitude: destination.longitude });
      setZoom(14);
      setStepsOpen(false);
      void calculateRoute(destination);
    },
    [calculateRoute],
  );

  const handleMapPress = useCallback((coordinate: Coordinate) => {
    const id = `punto-${coordinate.latitude.toFixed(5)}-${coordinate.longitude.toFixed(5)}`;
    const destination: Destination = {
      id,
      name: 'Punto en el mapa',
      address: formatCoord(coordinate.latitude, coordinate.longitude),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };
    setSelected(destination);
    setRoute(null);
    setRouteError(null);
    setStepsOpen(false);
    setCenter(coordinate);
    setZoom(15);
    reversePlace(coordinate)
      .then((place) => {
        if (!place) return;
        setSelected((previous) =>
          previous && previous.id === id
            ? { ...previous, name: place.name, address: place.displayName }
            : previous,
        );
      })
      .catch(() => undefined);
  }, []);

  const centerOnUser = useCallback(async () => {
    if (effectiveCoordinates) {
      setCenter(effectiveCoordinates);
      setZoom(15);
      return;
    }
    const granted = await requestPermission();
    if (granted) await refresh();
  }, [effectiveCoordinates, refresh, requestPermission]);

  const markers = useMemo<MapMarker[]>(() => {
    const saved: MapMarker[] = places.map((place) => ({
      id: `saved-${place.id}`,
      coordinate: { latitude: place.latitude, longitude: place.longitude },
      kind: 'place',
      label: place.name,
    }));
    if (!selected) return saved;
    const destination: MapMarker = {
      id: selected.id,
      coordinate: { latitude: selected.latitude, longitude: selected.longitude },
      kind: 'destination',
      label: selected.name,
    };
    return [...saved, destination];
  }, [places, selected]);

  const isSaved = selected ? places.some((place) => place.id === selected.id) : false;
  const showSearchPanel = query.trim().length >= 3;

  const gpsText =
    permission !== 'granted'
      ? 'Sin permiso de ubicación'
      : gpsStatus === 'excellent' || gpsStatus === 'good'
        ? 'GPS activo'
        : gpsStatus === 'searching'
          ? 'Buscando GPS'
          : 'GPS limitado';

  const saveSelected = () => {
    if (!selected) return;
    savePlace({
      id: selected.id,
      name: selected.name,
      address: selected.address,
      latitude: selected.latitude,
      longitude: selected.longitude,
    });
  };

  return (
    <Screen scroll={false} bottomInset={12}>
      <Header
        title="Mapa"
        subtitle={`${locationLabel ?? 'Ubicación sin configurar'} · ${gpsText}`}
        showBack={false}
        right={<View style={{ width: 42 }} />}
      />

      <View style={styles.mapWrap}>
        <OsmMap
          center={center}
          zoom={zoom}
          dark={mapDark}
          route={route?.geometry ?? null}
          markers={markers}
          location={effectiveCoordinates}
          onRegionChange={(nextCenter, nextZoom) => {
            setCenter(nextCenter);
            setZoom(nextZoom);
          }}
          onPressCoordinate={handleMapPress}
          onLocate={() => void centerOnUser()}
          style={styles.map}
        />

        <View style={styles.searchOverlay} pointerEvents="box-none">
          <TextField
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery('')}
            placeholder="Busca una dirección o lugar"
            right={searching ? <ActivityIndicator size="small" color={colors.accent} /> : undefined}
          />
          {showSearchPanel ? (
            <Card padded={false} style={styles.resultsCard}>
              {searching && results.length === 0 ? (
                <LoadingState label="Buscando en OpenStreetMap…" compact />
              ) : searchError ? (
                <ErrorState message={searchError} compact />
              ) : results.length === 0 ? (
                <View style={styles.noResults}>
                  <AppText variant="caption" color="muted">
                    Sin resultados. Prueba con una dirección más específica.
                  </AppText>
                </View>
              ) : (
                <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
                  {results.map((place, index) => (
                    <ListRow
                      key={place.id}
                      title={place.name}
                      subtitle={place.displayName}
                      icon={MapPin}
                      last={index === results.length - 1}
                      onPress={() => chooseDestination(destinationFromPlace(place))}
                    />
                  ))}
                </ScrollView>
              )}
            </Card>
          ) : null}
        </View>

        <Card style={styles.sheet}>
          {selected ? (
            <>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetText}>
                  <AppText variant="micro" color="accent" style={styles.destinationKicker}>
                    DESTINO
                  </AppText>
                  <AppText variant="subtitle" numberOfLines={1}>
                    {selected.name}
                  </AppText>
                  <AppText variant="caption" color="muted" numberOfLines={2}>
                    {selected.address}
                  </AppText>
                </View>
                <PressableScale
                  onPress={saveSelected}
                  disabled={isSaved}
                  scaleTo={0.9}
                  accessibilityRole="button"
                  accessibilityLabel={isSaved ? 'Lugar guardado' : 'Guardar lugar'}
                  style={[
                    styles.bookmark,
                    {
                      backgroundColor: isSaved ? colors.greenSoft : colors.accentSoft,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {isSaved ? (
                    <BookmarkCheck size={18} color={colors.green} />
                  ) : (
                    <Bookmark size={18} color={colors.accent} />
                  )}
                </PressableScale>
              </View>

              {routeLoading ? (
                <LoadingState label="Calculando ruta por carretera…" compact />
              ) : route ? (
                <View style={[styles.routeSummary, { backgroundColor: colors.accentSoft }]}>
                  <View style={styles.routeMetric}>
                    <Route size={16} color={colors.accent} />
                    <AppText variant="bodyStrong">{formatDistance(route.distance, settings.units)}</AppText>
                  </View>
                  <View style={styles.routeMetric}>
                    <Navigation size={16} color={colors.accent} />
                    <AppText variant="bodyStrong">{formatDuration(route.duration)}</AppText>
                  </View>
                  <AppText variant="caption" color="muted">
                    {route.steps.length} indicaciones · OSRM
                  </AppText>
                </View>
              ) : routeError ? (
                <View style={[styles.routeError, { backgroundColor: colors.amberSoft }]}>
                  <AppText variant="caption" color="amber">
                    {routeError}
                  </AppText>
                </View>
              ) : null}

              <View style={styles.sheetActions}>
                <PressableScale
                  onPress={() => void calculateRoute(selected)}
                  scaleTo={0.97}
                  accessibilityRole="button"
                  style={[styles.primaryAction, { backgroundColor: colors.accent }]}
                >
                  <Navigation size={16} color={colors.white} />
                  <AppText variant="bodyStrong" color="white">
                    {route ? 'Recalcular ruta' : 'Calcular ruta'}
                  </AppText>
                </PressableScale>
                <PressableScale
                  onPress={() => void centerOnUser()}
                  scaleTo={0.94}
                  accessibilityRole="button"
                  style={[styles.iconAction, { borderColor: colors.border }]}
                >
                  <LocateFixed size={18} color={colors.textSecondary} />
                </PressableScale>
                {isSaved ? (
                  <PressableScale
                    onPress={() => {
                      removePlace(selected.id);
                      setSelected(null);
                      setRoute(null);
                    }}
                    scaleTo={0.94}
                    accessibilityRole="button"
                    style={[styles.iconAction, { borderColor: colors.border }]}
                  >
                    <Trash2 size={18} color={colors.danger} />
                  </PressableScale>
                ) : null}
              </View>

              {route && route.steps.length > 0 ? (
                <>
                  <PressableScale
                    onPress={() => setStepsOpen((open) => !open)}
                    scaleTo={0.98}
                    accessibilityRole="button"
                    style={[styles.stepsToggle, { borderTopColor: colors.border }]}
                  >
                    <AppText variant="caption" color="secondary">
                      {stepsOpen ? 'Ocultar indicaciones' : 'Ver indicaciones paso a paso'}
                    </AppText>
                    {stepsOpen ? (
                      <ChevronUp size={16} color={colors.textMuted} />
                    ) : (
                      <ChevronDown size={16} color={colors.textMuted} />
                    )}
                  </PressableScale>
                  {stepsOpen ? (
                    <ScrollView style={styles.stepsList} nestedScrollEnabled>
                      {route.steps
                        .filter((step) => step.type !== 'arrive' || step.distance > 0)
                        .slice(0, 16)
                        .map((step, index) => (
                          <View
                            key={`${step.location.latitude}-${step.location.longitude}-${index}`}
                            style={[styles.stepRow, { borderTopColor: colors.border }]}
                          >
                            <View style={[styles.stepIndex, { backgroundColor: colors.surfaceHigh }]}>
                              <AppText variant="micro" color="muted">
                                {index + 1}
                              </AppText>
                            </View>
                            <View style={styles.stepText}>
                              <AppText variant="caption" color="secondary">
                                {step.instruction}
                              </AppText>
                              <AppText variant="micro" color="muted">
                                {formatDistance(step.distance, settings.units)} ·{' '}
                                {formatDuration(step.duration)}
                              </AppText>
                            </View>
                          </View>
                        ))}
                    </ScrollView>
                  ) : null}
                </>
              ) : null}
            </>
          ) : (
            <>
              <AppText variant="bodyStrong">Explora y traza tu ruta</AppText>
              <AppText variant="caption" color="muted">
                Busca un destino, toca el mapa o elige un lugar guardado. Las rutas se calculan con OSRM y
                los lugares con OpenStreetMap.
              </AppText>
              {places.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedRow}>
                  {places.map((place) => (
                    <Chip
                      key={place.id}
                      label={place.name}
                      icon={<BookmarkCheck size={13} color={colors.textSecondary} />}
                      onPress={() => chooseDestination(destinationFromFavorite(place))}
                      compact
                    />
                  ))}
                </ScrollView>
              ) : null}
              {permission !== 'granted' ? (
                <View style={styles.permissionRow}>
                  <Chip
                    label="Activar ubicación"
                    selected
                    onPress={() => void requestPermission()}
                    compact
                  />
                  <AppText variant="micro" color="muted">
                    Necesaria para rutas desde tu posición.
                  </AppText>
                </View>
              ) : null}
            </>
          )}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapWrap: { flex: 1, borderRadius: radius.xl, overflow: 'hidden' },
  map: { flex: 1 },
  searchOverlay: { position: 'absolute', top: 10, left: 10, right: 10, zIndex: 20 },
  resultsCard: { marginTop: 8, maxHeight: 260 },
  resultsList: { maxHeight: 230 },
  noResults: { padding: spacing.lg },
  sheet: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    zIndex: 15,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  sheetText: { flex: 1, gap: 1 },
  destinationKicker: { fontSize: 9, letterSpacing: 1.2 },
  bookmark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  routeMetric: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  routeError: { padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  iconAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  stepsList: { maxHeight: 150, marginTop: 6 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  stepIndex: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, gap: 1 },
  savedRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  permissionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
});
