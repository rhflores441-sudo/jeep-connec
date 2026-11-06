import { Image } from 'expo-image';
import { Disc3, Music, Pause, Play, RadioTower, SkipBack, SkipForward, Volume2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { SeekBar, VolumeSlider } from '@/components/ui/Slider';

type PlayerCardProps = {
  showVolume?: boolean;
  compact?: boolean;
  onOpen?: () => void;
};

export function PlayerCard({ showVolume = true, compact = false, onOpen }: PlayerCardProps) {
  const { colors } = useTheme();
  const now = useNowPlaying();
  const [localVolume, setLocalVolume] = useState(now.volume);

  useEffect(() => {
    setLocalVolume(now.volume);
  }, [now.volume]);

  if (!now.source) {
    return (
      <Card>
        <View style={styles.emptyRow}>
          <View style={[styles.artwork, { backgroundColor: colors.accentSoft }]}>
            <Music size={compact ? 22 : 28} color={colors.accent} strokeWidth={1.9} />
          </View>
          <View style={styles.textBlock}>
            <AppText variant="bodyStrong">Nada suena todavía</AppText>
            <AppText variant="caption" color="muted">
              Elige una estación de radio o conecta Spotify.
            </AppText>
          </View>
        </View>
        <View style={styles.emptyActions}>
          <PressableScale
            onPress={() => router.push('/radio')}
            style={[styles.emptyButton, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}
          >
            <RadioTower size={16} color={colors.accent} />
            <AppText variant="caption" color="accent">
              Radio
            </AppText>
          </PressableScale>
          <PressableScale
            onPress={() => router.push('/music')}
            style={[styles.emptyButton, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}
          >
            <Disc3 size={16} color={colors.accent} />
            <AppText variant="caption" color="accent">
              Spotify
            </AppText>
          </PressableScale>
        </View>
      </Card>
    );
  }

  const artworkSize = compact ? 54 : 70;
  const SourceIcon = now.source === 'radio' ? RadioTower : Disc3;

  return (
    <Card padded={false}>
      <View style={styles.header}>
        <View style={styles.sourceRow}>
          <SourceIcon size={13} color={colors.electric} strokeWidth={2.2} />
          <AppText variant="micro" color="muted" numberOfLines={1} style={styles.sourceLabel}>
            {now.sourceLabel.toUpperCase()}
          </AppText>
          {now.isBuffering ? <ActivityIndicator size="small" color={colors.accent} /> : null}
        </View>
        <PressableScale
          onPress={onOpen ?? (() => router.push(now.source === 'radio' ? '/radio' : '/music'))}
          scaleTo={0.94}
          accessibilityRole="button"
        >
          <AppText variant="caption" color="accent">
            Abrir
          </AppText>
        </PressableScale>
      </View>

      <View style={styles.body}>
        <View style={[styles.artwork, { width: artworkSize, height: artworkSize, borderRadius: radius.lg }]}>
          {now.artwork ? (
            <Image
              source={{ uri: now.artwork }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={180}
              cachePolicy="disk"
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
              ]}
            >
              <SourceIcon size={26} color={colors.accent} strokeWidth={1.8} />
            </View>
          )}
        </View>
        <View style={styles.textBlock}>
          <AppText variant={compact ? 'bodyStrong' : 'subtitle'} numberOfLines={1}>
            {now.title}
          </AppText>
          <AppText variant="caption" color="muted" numberOfLines={1}>
            {now.subtitle}
          </AppText>
          {now.isLive ? (
            <View style={styles.liveRow}>
              <View style={[styles.liveDot, { backgroundColor: colors.danger }]} />
              <AppText variant="micro" color="muted" style={styles.liveText}>
                EN VIVO
              </AppText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.progress}>
        <SeekBar
          positionMs={now.progressMs}
          durationMs={now.durationMs}
          onSeek={now.canSeek ? now.seek : undefined}
          disabled={!now.canSeek}
          live={now.isLive}
        />
      </View>

      <View style={styles.controls}>
        <IconButton
          icon={SkipBack}
          label="Anterior"
          variant="plain"
          size={40}
          iconSize={22}
          onPress={now.previous}
          disabled={!now.canPrevious}
        />
        <IconButton
          icon={now.isPlaying ? Pause : Play}
          label={now.isPlaying ? 'Pausar' : 'Reproducir'}
          variant="accent"
          size={50}
          iconSize={24}
          loading={now.isBuffering}
          onPress={now.toggle}
        />
        <IconButton
          icon={SkipForward}
          label="Siguiente"
          variant="plain"
          size={40}
          iconSize={22}
          onPress={now.next}
          disabled={!now.canNext}
        />
      </View>

      {showVolume ? (
        <View style={[styles.volume, { borderTopColor: colors.border }]}>
          <View style={styles.volumeIcon}>
            <Volume2 size={15} color={colors.textMuted} strokeWidth={2} />
          </View>
          <View style={styles.volumeSlider}>
            <VolumeSlider
              compact
              value={localVolume}
              onValueChange={setLocalVolume}
              onSlidingComplete={(value) => {
                setLocalVolume(value);
                now.setVolume(value);
              }}
            />
          </View>
        </View>
      ) : null}

      {now.error ? (
        <View style={[styles.error, { backgroundColor: colors.dangerSoft }]}>
          <AppText variant="caption" color="danger" numberOfLines={2}>
            {now.error}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  sourceLabel: { letterSpacing: 1, flexShrink: 1 },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  artwork: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, gap: 2 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 8.5, letterSpacing: 1 },
  progress: { paddingHorizontal: spacing.lg, marginTop: 6 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  volume: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  volumeIcon: { width: 20 },
  volumeSlider: { flex: 1 },
  error: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: 8,
    borderRadius: radius.sm,
  },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emptyActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
