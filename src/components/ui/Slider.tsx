import { Volume1, Volume2, VolumeX } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { radius } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { formatPlaybackTime } from '@/utils/format';
import { AppText } from '@/components/ui/AppText';

type SliderProps = {
  value: number;
  onChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  disabled?: boolean;
  color?: string;
  step?: number;
  trackHeight?: number;
  hitHeight?: number;
};

export function Slider({
  value,
  onChange,
  onSlidingComplete,
  disabled = false,
  color,
  step,
  trackHeight = 5,
  hitHeight = 28,
}: SliderProps) {
  const { colors } = useTheme();
  const widthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const onCompleteRef = useRef(onSlidingComplete);
  const stepRef = useRef(step);
  const disabledRef = useRef(disabled);
  const [dragValue, setDragValue] = useState<number | null>(null);
  onChangeRef.current = onChange;
  onCompleteRef.current = onSlidingComplete;
  stepRef.current = step;
  disabledRef.current = disabled;

  const update = useCallback((x: number) => {
    const width = widthRef.current;
    if (width <= 0 || disabledRef.current) return;
    let next = Math.max(0, Math.min(1, x / width));
    if (stepRef.current && stepRef.current > 0) {
      next = Math.round(next / stepRef.current) * stepRef.current;
      next = Math.max(0, Math.min(1, next));
    }
    setDragValue(next);
    onChangeRef.current?.(next);
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabledRef.current,
        onMoveShouldSetPanResponder: () => !disabledRef.current,
        onPanResponderGrant: (event) => update(event.nativeEvent.locationX),
        onPanResponderMove: (event) => update(event.nativeEvent.locationX),
        onPanResponderRelease: () => {
          setDragValue((current) => {
            if (current !== null) onCompleteRef.current?.(current);
            return null;
          });
        },
        onPanResponderTerminate: () => {
          setDragValue((current) => {
            if (current !== null) onCompleteRef.current?.(current);
            return null;
          });
        },
      }),
    [update],
  );

  const displayed = dragValue ?? Math.max(0, Math.min(1, value));
  const fillColor = color ?? colors.accent;

  return (
    <View
      style={styles.hitArea}
      onLayout={(event: LayoutChangeEvent) => {
        widthRef.current = event.nativeEvent.layout.width;
      }}
      {...panResponder.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(displayed * 100) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (disabled) return;
        const delta = event.nativeEvent.actionName === 'increment' ? 0.05 : -0.05;
        const next = Math.max(0, Math.min(1, value + delta));
        onChange?.(next);
        onSlidingComplete?.(next);
      }}
      pointerEvents={disabled ? 'none' : 'auto'}
    >
      <View style={{ height: hitHeight, justifyContent: 'center' }}>
        <View
          style={[
            styles.track,
            { height: trackHeight, backgroundColor: colors.borderStrong, opacity: disabled ? 0.4 : 1 },
          ]}
        >
          <View style={[styles.fill, { width: `${displayed * 100}%`, backgroundColor: fillColor }]} />
        </View>
        <View
          style={[
            styles.thumb,
            {
              left: `${displayed * 100}%`,
              backgroundColor: colors.white,
              borderColor: fillColor,
              opacity: disabled ? 0.4 : 1,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function VolumeSlider({
  value,
  onValueChange,
  onSlidingComplete,
  disabled,
  compact = false,
}: {
  value: number;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const VolumeIcon = value <= 0.01 ? VolumeX : value < 0.5 ? Volume1 : Volume2;
  return (
    <View style={[styles.volumeRow, compact ? styles.volumeCompact : null]}>
      <VolumeIcon size={compact ? 16 : 18} color={colors.textMuted} strokeWidth={2} />
      <View style={styles.volumeSlider}>
        <Slider
          value={value}
          onChange={onValueChange}
          onSlidingComplete={onSlidingComplete}
          disabled={disabled}
          trackHeight={4}
          hitHeight={compact ? 22 : 28}
        />
      </View>
      <AppText variant="caption" color="muted" style={styles.volumeValue}>
        {Math.round(value * 100)}
      </AppText>
    </View>
  );
}

export function SeekBar({
  positionMs,
  durationMs,
  onSeek,
  disabled,
  live = false,
}: {
  positionMs: number;
  durationMs: number;
  onSeek?: (positionMs: number) => void;
  disabled?: boolean;
  live?: boolean;
}) {
  const { colors } = useTheme();
  const [preview, setPreview] = useState<number | null>(null);
  const safeDuration = Math.max(1, durationMs);
  const value = preview !== null ? preview : Math.max(0, Math.min(1, positionMs / safeDuration));
  const displayMs = preview !== null ? preview * safeDuration : positionMs;

  if (live) {
    return (
      <View style={styles.liveRow}>
        <View style={[styles.liveDot, { backgroundColor: colors.danger }]} />
        <AppText variant="caption" color="muted">
          EN VIVO
        </AppText>
      </View>
    );
  }

  return (
    <View>
      <Slider
        value={value}
        onChange={(next) => setPreview(next)}
        onSlidingComplete={(next) => {
          setPreview(null);
          onSeek?.(next * safeDuration);
        }}
        disabled={disabled || !onSeek || durationMs <= 0}
        trackHeight={4}
        hitHeight={24}
      />
      <View style={styles.timeRow}>
        <AppText variant="caption" color="muted" style={styles.time}>
          {formatPlaybackTime(displayMs)}
        </AppText>
        <AppText variant="caption" color="muted" style={styles.time}>
          {formatPlaybackTime(safeDuration)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: { width: '100%' },
  track: { width: '100%', borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    marginLeft: -8,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  volumeCompact: { gap: 8 },
  volumeSlider: { flex: 1 },
  volumeValue: { width: 26, textAlign: 'right' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  time: { fontVariant: ['tabular-nums'] },
});
