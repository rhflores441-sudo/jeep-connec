import { Image } from 'expo-image';
import { Clock, Disc3, History, Play, RadioTower, Trash2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { radius, spacing } from '@/constants/theme';
import { useLibrary, type HistoryEntry } from '@/store/library';
import { useRadio } from '@/store/radio';
import { useTheme } from '@/store/settings';
import { formatTime } from '@/utils/format';
import { AppText } from '@/components/ui/AppText';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState } from '@/components/ui/StateViews';

const HISTORY_LIMIT_NOTE = 'Se conservan las últimas 60 reproducciones en este dispositivo.';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { library, clearHistory } = useLibrary();
  const radio = useRadio();

  const groups = useMemo(() => {
    const grouped = new Map<string, HistoryEntry[]>();
    for (const entry of library.history) {
      const key = dayKey(entry.playedAt);
      const bucket = grouped.get(key);
      if (bucket) bucket.push(entry);
      else grouped.set(key, [entry]);
    }
    return Array.from(grouped.entries());
  }, [library.history]);

  const confirmClear = () => {
    Alert.alert(
      'Borrar historial',
      'Se eliminarán todas las reproducciones guardadas en este dispositivo. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: clearHistory },
      ],
    );
  };

  const openEntry = (entry: HistoryEntry) => {
    if (entry.source === 'radio' && entry.station) {
      radio.playStation(entry.station, [entry.station]);
      return;
    }
    router.push('/music');
  };

  return (
    <Screen>
      <Header
        title="Historial"
        subtitle={`${library.history.length} reproducciones recientes`}
        right={
          <IconButton
            icon={Trash2}
            label="Borrar historial"
            variant="danger"
            disabled={library.history.length === 0}
            onPress={confirmClear}
          />
        }
      />

      <View style={[styles.note, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
        <History size={17} color={colors.accent} />
        <AppText variant="caption" color="secondary" style={styles.noteText}>
          Historial real de lo reproducido en Jeep Connect. Toca una entrada de radio para volver a
          escucharla; las canciones de Spotify se abren en la pestaña Música.
        </AppText>
      </View>

      {library.history.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={History}
            title="Todavía no hay reproducciones"
            message="Cuando escuches radio o música desde Jeep Connect, aparecerá aquí."
            action={
              <View style={styles.emptyActions}>
                <PressableScale
                  onPress={() => router.push('/radio')}
                  accessibilityRole="button"
                  scaleTo={0.95}
                  style={[styles.emptyButton, { backgroundColor: colors.accent }]}
                >
                  <RadioTower size={15} color={colors.white} />
                  <AppText variant="caption" color="white">
                    Explorar radio
                  </AppText>
                </PressableScale>
                <PressableScale
                  onPress={() => router.push('/music')}
                  accessibilityRole="button"
                  scaleTo={0.95}
                  style={[styles.emptyButton, { borderColor: colors.borderStrong, borderWidth: 1 }]}
                >
                  <Disc3 size={15} color={colors.text} />
                  <AppText variant="caption">Abrir Spotify</AppText>
                </PressableScale>
              </View>
            }
          />
        </View>
      ) : (
        groups.map(([key, entries]) => (
          <View key={key} style={styles.section}>
            <SectionHeader title={dayLabel(entries[0].playedAt)} icon={Clock} />
            <View style={[styles.group, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
              {entries.map((entry, index) => (
                <HistoryRow
                  key={`${entry.source}-${entry.id}-${entry.playedAt}-${index}`}
                  entry={entry}
                  last={index === entries.length - 1}
                  onPress={() => openEntry(entry)}
                />
              ))}
            </View>
          </View>
        ))
      )}

      {library.history.length > 0 ? (
        <AppText variant="caption" color="muted" align="center" style={styles.footer}>
          {HISTORY_LIMIT_NOTE}
        </AppText>
      ) : null}
    </Screen>
  );
}

function HistoryRow({
  entry,
  last,
  onPress,
}: {
  entry: HistoryEntry;
  last: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const isRadio = entry.source === 'radio';
  const accent = isRadio ? colors.green : colors.accent;
  const FallbackIcon = isRadio ? RadioTower : Disc3;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      accessibilityRole="button"
      accessibilityLabel={`${isRadio ? 'Reproducir' : 'Abrir'} ${entry.title}`}
      style={[
        styles.row,
        last ? null : { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <View style={[styles.artwork, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surfaceHigh }]}>
        {entry.artwork ? (
          <Image
            source={{ uri: entry.artwork }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={140}
            cachePolicy="disk"
          />
        ) : (
          <FallbackIcon size={20} color={accent} />
        )}
      </View>

      <View style={styles.rowText}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {entry.title}
        </AppText>
        <AppText variant="caption" color="muted" numberOfLines={1}>
          {entry.subtitle}
        </AppText>
        <View style={styles.metaRow}>
          <View style={[styles.sourceTag, { backgroundColor: isRadio ? colors.greenSoft : colors.accentSoft }]}>
            <AppText variant="micro" color={isRadio ? 'green' : 'accent'} style={styles.sourceTagText}>
              {isRadio ? 'RADIO' : 'SPOTIFY'}
            </AppText>
          </View>
          <AppText variant="micro" color="muted">
            {formatTime(new Date(entry.playedAt))}
          </AppText>
        </View>
      </View>

      <View style={[styles.action, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.accentSoft }]}>
        <Play size={15} color={accent} fill={accent} />
      </View>
    </PressableScale>
  );
}

function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const startOf = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(date)) / 86_400_000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  try {
    return new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  noteText: { flex: 1 },
  emptyWrap: { marginTop: spacing.lg },
  emptyActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: spacing.md,
  },
  section: { marginTop: spacing.xxl, gap: spacing.sm },
  group: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden', paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, minHeight: 74 },
  artwork: { width: 50, height: 50, borderRadius: radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 3 },
  sourceTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  sourceTagText: { fontSize: 8, letterSpacing: 0.8 },
  action: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  footer: { marginTop: spacing.xxl },
});
