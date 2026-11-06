import { Crosshair, Minus, Plus } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { API, MAP } from '@/constants/config';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { moveCenter, project, unproject, worldSize, type Coordinate } from '@/utils/geo';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';

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
};

type ViewState = { center: Coordinate; zoom: number };

const TILE_SIZE = MAP.tileSize;

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
}: OsmMapProps) {
  const { colors } = useTheme();
  const [view, setView] = useState<ViewState>({ center, zoom });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const onRegionChangeRef = useRef(onRegionChange);
  onRegionChangeRef.current = onRegionChange;

  useEffect(() => {
    setView((previous) => {
      const sameCenter =
        Math.abs(previous.center.latitude - center.latitude) < 1e-6 &&
        Math.abs(previous.center.longitude - center.longitude) < 1e-6;
      if (sameCenter && Math.abs(previous.zoom - zoom) < 1e-6) return previous;
      return { center, zoom };
    });
  }, [center, zoom]);

  const finishGesture = useCallback(() => {
    onRegionChangeRef.current?.(viewRef.current.center, viewRef.current.zoom);
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
    const template = dark ? API.tileDark : API.tileLight;
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
  }, [dark, size.height, size.width, view.center, view.zoom]);

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
              key={tile.key}
              source={{ uri: tile.uri }}
              style={[styles.tile, { left: tile.x, top: tile.y, width: tile.size, height: tile.size }]}
              contentFit="cover"
              transition={120}
              cachePolicy="disk"
            />
          ))}

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
            {projectedLocation ? (
              <>
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
