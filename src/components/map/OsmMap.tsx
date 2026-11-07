import { Crosshair, Minus, Plus, RefreshCw } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, G, Polygon, Polyline } from 'react-native-svg';
import { API, APP_USER_AGENT, MAP, SPOTIFY } from '@/constants/config';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { clampZoom, fitZoom, moveCenter, project, unproject, worldSize, type Coordinate } from '@/utils/geo';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';

export type MapMarker = {
  id: string;
  coordinate: Coordinate;
  kind?: 'origin' | 'destination' | 'place' | 'user';
  label?: string;
};

type OsmMapProps = {
  center: Coordinate;
  zoom?: number;
  route?: Coordinate[] | null;
  markers?: MapMarker[];
  dark?: boolean;
  interactive?: boolean;
  showControls?: boolean;
  style?: StyleProp<ViewStyle>;
  onRegionChange?: (center: Coordinate, zoom: number) => void;
  onPressCoordinate?: (coordinate: Coordinate) => void;
  onLocate?: () => void;
  location?: Coordinate | null;
  /** Rumbo en grados (0=norte, sentido horario). -1 o null = sin rumbo. */
  heading?: number | null;
  /** Precisión GPS en metros (radio aproximado). */
  accuracy?: number | null;
  /** Ajusta la vista a estos puntos cuando cambia `token`. */
  fitTo?: { points: Coordinate[]; token: number; padding?: number } | null;
};

type ViewState = { center: Coordinate; zoom: number };

const TILE_SIZE = MAP.tileSize;

function metersToPixels(meters: number, latitude: number, zoomLevel: number): number {
  const metersPerPixel = (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / 2 ** zoomLevel;
  return meters / Math.max(metersPerPixel, 0.0001);
}

export function OsmMap({
  center,
  zoom = MAP.defaultZoom,
  route,
  markers = [],
  dark = true,
  interactive = true,
  showControls = true,
  style,
  onRegionChange,
  onPressCoordinate,
  onLocate,
  location,
  heading,
  accuracy,
  fitTo,
}: OsmMapProps) {
  const { colors } = useTheme();
  const [view, setView] = useState<ViewState>({ center, zoom });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [tileAttempt, setTileAttempt] = useState<'primary' | 'fallback'>('primary');
  const [tileError, setTileError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [tilesReady, setTilesReady] = useState(false);
  const viewRef = useRef(view);
  viewRef.current = view;
  const onRegionChangeRef = useRef(onRegionChange);
  onRegionChangeRef.current = onRegionChange;
  const tileAttemptRef = useRef(tileAttempt);
  tileAttemptRef.current = tileAttempt;
  const failedTilesRef = useRef(new Set<string>());
  const tileFailureCountRef = useRef(0);
  const tilesLoadedRef = useRef(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setView((previous) => {
      const sameCenter =
        Math.abs(previous.center.latitude - center.latitude) < 1e-6 &&
        Math.abs(previous.center.longitude - center.longitude) < 1e-6;
      if (sameCenter && Math.abs(previous.zoom - zoom) < 1e-6) return previous;
      return { center, zoom };
    });
  }, [center, zoom]);

  useEffect(() => {
    if (!fitTo?.points?.length || size.width === 0 || size.height === 0) return;
    const result = fitZoom(fitTo.points, size, fitTo.padding ?? 56);
    if (!result) return;
    setView({ center: result.center, zoom: clampZoom(result.zoom) });
    onRegionChangeRef.current?.(result.center, clampZoom(result.zoom));
  }, [fitTo, size]);

  // Si cambia el estilo del mapa, vuelve a intentar el proveedor principal.
  useEffect(() => {
    failedTilesRef.current.clear();
    tileFailureCountRef.current = 0;
    tilesLoadedRef.current = false;
    setTilesReady(false);
    setTileAttempt('primary');
    setTileError(false);
  }, [dark]);

  useEffect(() => {
    if (size.width === 0 || size.height === 0 || tileError || tilesReady) return;
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    loadTimeoutRef.current = setTimeout(() => {
      if (tilesLoadedRef.current || tileError) return;
      if (tileAttemptRef.current === 'primary') {
        failedTilesRef.current.clear();
        tileFailureCountRef.current = 0;
        tilesLoadedRef.current = false;
        setTilesReady(false);
        setTileAttempt('fallback');
        return;
      }
      setTileError(true);
    }, 9000);
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [size.height, size.width, tileAttempt, tileError, tilesReady, reloadToken]);

  const finishGesture = useCallback(() => {
    onRegionChangeRef.current?.(viewRef.current.center, viewRef.current.zoom);
  }, []);

  const handleTileLoad = useCallback(() => {
    if (tilesLoadedRef.current) return;
    tilesLoadedRef.current = true;
    setTilesReady(true);
  }, []);

  const handleTileError = useCallback((key: string) => {
    if (failedTilesRef.current.has(key)) return;
    failedTilesRef.current.add(key);
    tileFailureCountRef.current += 1;
    if (tileFailureCountRef.current < 3) return;
    if (tileAttemptRef.current === 'primary') {
      failedTilesRef.current.clear();
      tileFailureCountRef.current = 0;
      tilesLoadedRef.current = false;
      setTilesReady(false);
      setTileAttempt('fallback');
      return;
    }
    setTileError(true);
  }, []);

  const retryTiles = useCallback(() => {
    failedTilesRef.current.clear();
    tileFailureCountRef.current = 0;
    tilesLoadedRef.current = false;
    setTilesReady(false);
    setTileError(false);
    setTileAttempt('primary');
    setReloadToken((token) => token + 1);
  }, []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .enabled(interactive)
        .onChange((event) => {
          setView((previous) => ({
            ...previous,
            center: moveCenter(previous.center, -event.changeX, -event.changeY, previous.zoom),
          }));
        })
        .onEnd(finishGesture)
        .onFinalize(finishGesture),
    [finishGesture, interactive],
  );

  const pinchStart = useRef(zoom);
  const pinch = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .enabled(interactive)
        .onStart(() => {
          pinchStart.current = viewRef.current.zoom;
        })
        .onUpdate((event) => {
          const next = Math.max(
            MAP.minZoom,
            Math.min(MAP.maxZoom, pinchStart.current + Math.log2(Math.max(0.2, event.scale))),
          );
          setView((previous) => ({ ...previous, zoom: next }));
        })
        .onEnd(finishGesture)
        .onFinalize(finishGesture),
    [finishGesture, interactive],
  );

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .enabled(interactive && Boolean(onPressCoordinate))
        .maxDistance(8)
        .onEnd((event) => {
          if (!onPressCoordinate || size.width === 0 || size.height === 0) return;
          const world = project(viewRef.current.center, viewRef.current.zoom);
          const coordinate = unproject(
            world.x + (event.x - size.width / 2),
            world.y + (event.y - size.height / 2),
            viewRef.current.zoom,
          );
          onPressCoordinate(coordinate);
        }),
    [interactive, onPressCoordinate, size.height, size.width],
  );

  const gesture = useMemo(
    () => Gesture.Simultaneous(Gesture.Race(pan, tap), pinch),
    [pan, pinch, tap],
  );

  const tiles = useMemo(() => {
    if (size.width === 0 || size.height === 0) return [];
    const tileZoom = Math.max(MAP.minZoom, Math.floor(view.zoom));
    const scale = 2 ** (view.zoom - tileZoom);
    const tileSize = TILE_SIZE * scale;
    const count = 2 ** tileZoom;
    const centerPx = project(view.center, tileZoom);
    const startX = Math.floor((centerPx.x - size.width / 2 / scale) / TILE_SIZE) - 1;
    const endX = Math.ceil((centerPx.x + size.width / 2 / scale) / TILE_SIZE) + 1;
    const startY = Math.max(0, Math.floor((centerPx.y - size.height / 2 / scale) / TILE_SIZE) - 1);
    const endY = Math.min(count - 1, Math.ceil((centerPx.y + size.height / 2 / scale) / TILE_SIZE) + 1);
    const proxyBase = SPOTIFY.authProxyUrl;
    const primaryTemplate = proxyBase
      ? `${proxyBase}/tiles/${dark ? 'dark' : 'light'}/{z}/{x}/{y}.png`
      : dark
        ? API.tileDark
        : API.tileLight;
    const template = tileAttempt === 'fallback' ? API.tileFallback : primaryTemplate;
    const result: { key: string; uri: string; x: number; y: number; size: number }[] = [];

    for (let x = startX; x <= endX; x += 1) {
      for (let y = startY; y <= endY; y += 1) {
        const wrappedX = ((x % count) + count) % count;
        const screenX = (x * TILE_SIZE - centerPx.x) * scale + size.width / 2;
        const screenY = (y * TILE_SIZE - centerPx.y) * scale + size.height / 2;
        result.push({
          key: `${tileZoom}/${wrappedX}/${y}/${x}`,
          uri: template
            .replace('{z}', String(tileZoom))
            .replace('{x}', String(wrappedX))
            .replace('{y}', String(y)),
          x: screenX,
          y: screenY,
          size: tileSize + 0.4,
        });
      }
    }
    return result;
  }, [dark, size.height, size.width, tileAttempt, view.center, view.zoom]);

  const overlayPoints = useMemo(() => {
    if (!route?.length || size.width === 0) return '';
    const centerPx = project(view.center, view.zoom);
    const world = worldSize(view.zoom);
    return route
      .map((point) => {
        const projected = project(point, view.zoom);
        let dx = projected.x - centerPx.x;
        if (dx > world / 2) dx -= world;
        if (dx < -world / 2) dx += world;
        return `${(size.width / 2 + dx).toFixed(1)},${(size.height / 2 + projected.y - centerPx.y).toFixed(1)}`;
      })
      .join(' ');
  }, [route, size.height, size.width, view.center, view.zoom]);

  const projectedMarkers = useMemo(() => {
    if (size.width === 0) return [];
    const centerPx = project(view.center, view.zoom);
    return markers.map((marker) => {
      const projected = project(marker.coordinate, view.zoom);
      return {
        ...marker,
        x: size.width / 2 + projected.x - centerPx.x,
        y: size.height / 2 + projected.y - centerPx.y,
      };
    });
  }, [markers, size.height, size.width, view.center, view.zoom]);

  const projectedLocation = useMemo(() => {
    if (!location || size.width === 0) return null;
    const centerPx = project(view.center, view.zoom);
    const projected = project(location, view.zoom);
    return {
      x: size.width / 2 + projected.x - centerPx.x,
      y: size.height / 2 + projected.y - centerPx.y,
    };
  }, [location, size.height, size.width, view.center, view.zoom]);

  const changeZoom = (delta: number) => {
    setView((previous) => {
      const next = Math.max(MAP.minZoom, Math.min(MAP.maxZoom, previous.zoom + delta));
      const nextView = { ...previous, zoom: next };
      onRegionChange?.(nextView.center, nextView.zoom);
      return nextView;
    });
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: dark ? '#0A1420' : '#DDE6EF' }, style]}
      onLayout={handleLayout}
    >
      <GestureDetector gesture={gesture}>
        <View style={styles.fill} collapsable={false}>
          {tiles.map((tile) => (
            <Image
              key={`${tile.key}-${tileAttempt}-${reloadToken}`}
              source={{
                uri: tile.uri,
                headers: { 'User-Agent': APP_USER_AGENT },
              }}
              style={[styles.tile, { left: tile.x, top: tile.y, width: tile.size, height: tile.size }]}
              contentFit="cover"
              transition={120}
              cachePolicy="disk"
              onLoad={handleTileLoad}
              onError={() => handleTileError(tile.key)}
            />
          ))}

          {!tilesReady && !tileError && size.width > 0 ? (
            <View pointerEvents="none" style={styles.loadingOverlay}>
              <View style={[styles.loadingPill, { backgroundColor: colors.mapOverlay }]}>
                <AppText variant="caption" color="secondary">
                  Cargando mapa…
                </AppText>
              </View>
            </View>
          ) : null}

          {tileAttempt === 'fallback' && dark ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.fallbackTint]} />
          ) : null}

          <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill} pointerEvents="none">
            {overlayPoints ? (
              <>
                <Polyline
                  points={overlayPoints}
                  fill="none"
                  stroke={dark ? 'rgba(2, 8, 16, 0.75)' : 'rgba(255, 255, 255, 0.95)'}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Polyline
                  points={overlayPoints}
                  fill="none"
                  stroke={colors.electric}
                  strokeWidth={4.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : null}
            {projectedMarkers.map((marker) => {
              const fill =
                marker.kind === 'destination'
                  ? colors.danger
                  : marker.kind === 'origin'
                    ? colors.green
                    : colors.accent;
              return (
                <Circle
                  key={marker.id}
                  cx={marker.x}
                  cy={marker.y}
                  r={marker.kind === 'place' ? 7 : 8}
                  fill={fill}
                  stroke={colors.white}
                  strokeWidth={3}
                />
              );
            })}
            {projectedLocation && location ? (
              <>
                {typeof accuracy === 'number' &&
                Number.isFinite(accuracy) &&
                accuracy > 0 &&
                accuracy < 500 ? (
                  <Circle
                    cx={projectedLocation.x}
                    cy={projectedLocation.y}
                    r={Math.max(10, Math.min(120, metersToPixels(accuracy, location.latitude, view.zoom)))}
                    fill={colors.accent}
                    opacity={0.1}
                    stroke={colors.accent}
                    strokeWidth={1}
                    strokeOpacity={0.22}
                  />
                ) : null}
                {typeof heading === 'number' && Number.isFinite(heading) && heading >= 0 ? (
                  <G
                    transform={`rotate(${heading} ${projectedLocation.x} ${projectedLocation.y})`}
                  >
                    <Polygon
                      points={`${projectedLocation.x},${projectedLocation.y - 22} ${projectedLocation.x - 8},${projectedLocation.y - 6} ${projectedLocation.x + 8},${projectedLocation.y - 6}`}
                      fill={colors.accent}
                      opacity={0.35}
                    />
                  </G>
                ) : null}
                <Circle
                  cx={projectedLocation.x}
                  cy={projectedLocation.y}
                  r={16}
                  fill={colors.accent}
                  opacity={0.2}
                />
                <Circle
                  cx={projectedLocation.x}
                  cy={projectedLocation.y}
                  r={7}
                  fill={colors.accent}
                  stroke={colors.white}
                  strokeWidth={3}
                />
              </>
            ) : null}
          </Svg>
        </View>
      </GestureDetector>

      {tileError ? (
        <View style={styles.errorOverlay} pointerEvents="box-none">
          <View
            style={[
              styles.errorCard,
              { backgroundColor: dark ? 'rgba(8, 18, 30, 0.94)' : 'rgba(255, 255, 255, 0.96)' },
            ]}
          >
            <AppText variant="bodyStrong" align="center">
              No se pudo cargar el mapa
            </AppText>
            <AppText variant="caption" color="muted" align="center">
              Revisa tu conexión a internet y vuelve a intentarlo.
            </AppText>
            <PressableScale
              onPress={retryTiles}
              accessibilityRole="button"
              accessibilityLabel="Reintentar cargar el mapa"
              scaleTo={0.95}
              style={[styles.retryButton, { backgroundColor: colors.accent }]}
            >
              <RefreshCw size={15} color={colors.white} />
              <AppText variant="caption" font="semibold" color="white">
                Reintentar
              </AppText>
            </PressableScale>
          </View>
        </View>
      ) : null}

      {showControls ? (
        <View style={styles.controls} pointerEvents="box-none">
          <IconButton
            icon={Plus}
            label="Acercar"
            size={38}
            iconSize={18}
            onPress={() => changeZoom(1)}
          />
          <IconButton
            icon={Minus}
            label="Alejar"
            size={38}
            iconSize={18}
            onPress={() => changeZoom(-1)}
          />
          {onLocate ? (
            <IconButton
              icon={Crosshair}
              label="Centrar en mi ubicación"
              size={38}
              iconSize={18}
              onPress={onLocate}
            />
          ) : null}
        </View>
      ) : null}

      <View style={[styles.attribution, { backgroundColor: dark ? 'rgba(3,8,15,0.55)' : 'rgba(255,255,255,0.72)' }]}>
        <AppText variant="micro" color={dark ? 'secondary' : 'muted'} style={styles.attributionText}>
          {MAP.attribution}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  fill: { flex: 1, overflow: 'hidden' },
  tile: { position: 'absolute' },
  fallbackTint: { backgroundColor: 'rgba(2, 10, 20, 0.35)' },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorCard: {
    width: '100%',
    maxWidth: 300,
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  retryButton: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  controls: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    gap: spacing.sm,
  },
  attribution: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderTopRightRadius: radius.sm,
  },
  attributionText: { fontSize: 9, letterSpacing: 0.1 },
});
