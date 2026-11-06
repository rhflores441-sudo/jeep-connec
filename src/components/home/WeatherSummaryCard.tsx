import { ChevronRight, Droplets, MapPin, RefreshCw, Wind } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { radius, spacing } from '@/constants/theme';
import { useSettings, useTheme } from '@/store/settings';
import { useWeather } from '@/store/weather';
import { useLocation } from '@/store/location';
import {
  formatDateShort,
  formatHour,
  formatTemperature,
  formatUpdatedAt,
  formatWind,
  temperatureUnit,
} from '@/utils/format';
import { weatherAccent } from '@/utils/weatherCodes';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { PressableScale } from '@/components/ui/PressableScale';
import { WeatherIcon } from '@/components/weather/WeatherIcon';

type WeatherSummaryCardProps = {
  compact?: boolean;
  showDaily?: boolean;
  showHourly?: boolean;
  onOpen?: () => void;
};

export function WeatherSummaryCard({
  compact = false,
  showDaily = true,
  showHourly = true,
  onOpen,
}: WeatherSummaryCardProps) {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const { weather, loading, error, refresh } = useWeather();
  const { permission, requestPermission, locationLabel, isManualLocation } = useLocation();

  if (!weather) {
    return (
      <Card>
        {loading ? (
          <LoadingState label="Consultando el clima…" compact />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} compact />
        ) : (
          <EmptyState
            icon={MapPin}
            title="Activa tu ubicación"
            message={
              isManualLocation
                ? 'Elige una ubicación manual en Ajustes para ver el clima.'
                : 'El clima usa Open-Meteo y necesita una ubicación. También puedes configurar una ubicación manual.'
            }
            compact
            action={
              <View style={styles.actions}>
                {permission !== 'granted' ? (
                  <Chip label="Permitir ubicación" selected onPress={() => void requestPermission()} compact />
                ) : null}
                <Chip label="Ubicación manual" onPress={() => router.push('/settings/location')} compact />
              </View>
            }
          />
        )}
      </Card>
    );
  }

  const { current, hourly, daily } = weather;

  return (
    <Card padded={false}>
      <PressableScale
        onPress={onOpen ?? (() => router.push('/weather'))}
        scaleTo={0.99}
        accessibilityRole="button"
        accessibilityLabel="Ver el clima completo"
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.location}>
              <MapPin size={13} color={colors.textMuted} />
              <AppText variant="caption" color="muted" numberOfLines={1} style={styles.locationText}>
                {locationLabel ?? 'Ubicación actual'}
              </AppText>
            </View>
            <View style={styles.updated}>
              <AppText variant="micro" color="muted" style={styles.updatedText}>
                {formatUpdatedAt(weather.fetchedAt).toUpperCase()}
              </AppText>
              <ChevronRight size={15} color={colors.textMuted} />
            </View>
          </View>

          <View style={styles.currentRow}>
            <WeatherIcon
              name={current.icon}
              size={compact ? 38 : 48}
              color={
                weatherAccent(current.icon) === 'amber'
                  ? colors.amber
                  : weatherAccent(current.icon) === 'electric'
                    ? colors.electric
                    : colors.textSecondary
              }
            />
            <View style={styles.tempBlock}>
              <AppText variant="display" style={compact ? styles.tempCompact : styles.temp}>
                {formatTemperature(current.temperature, settings.units)}
              </AppText>
              <View style={styles.conditionBlock}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {current.condition}
                </AppText>
                <AppText variant="caption" color="muted">
                  Sensación {formatTemperature(current.apparentTemperature, settings.units)} ·{' '}
                  {temperatureUnit(settings.units)}
                </AppText>
              </View>
            </View>
            <View style={styles.details}>
              <View style={styles.detailRow}>
                <Droplets size={14} color={colors.electric} />
                <AppText variant="caption" color="secondary">
                  {Math.round(current.humidity)}%
                </AppText>
              </View>
              <View style={styles.detailRow}>
                <Wind size={14} color={colors.textMuted} />
                <AppText variant="caption" color="secondary">
                  {formatWind(current.windSpeed, settings.units)}
                </AppText>
              </View>
            </View>
          </View>

          {showHourly && hourly.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourlyRow}
            >
              {hourly.slice(0, 8).map((hour, index) => (
                <View key={hour.time} style={styles.hourItem}>
                  <AppText variant="caption" color="muted">
                    {index === 0 ? 'Ahora' : formatHour(hour.time)}
                  </AppText>
                  <WeatherIcon
                    name={hour.icon}
                    size={20}
                    color={
                      weatherAccent(hour.icon) === 'amber'
                        ? colors.amber
                        : weatherAccent(hour.icon) === 'electric'
                          ? colors.electric
                          : colors.textSecondary
                    }
                  />
                  <AppText variant="caption" font="semibold">
                    {formatTemperature(hour.temperature, settings.units)}
                  </AppText>
                  {hour.precipitationProbability > 0 ? (
                    <AppText variant="micro" color="electric" style={styles.precip}>
                      {hour.precipitationProbability}%
                    </AppText>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          ) : null}

          {error ? (
            <View style={[styles.inlineError, { backgroundColor: colors.amberSoft }]}>
              <AppText variant="caption" color="amber" numberOfLines={2}>
                {error}
              </AppText>
              <RefreshCw size={14} color={colors.amber} onPress={() => void refresh()} />
            </View>
          ) : null}

          {showDaily && daily.length > 0 ? (
            <View style={[styles.daily, { borderTopColor: colors.border }]}>
              {daily.slice(0, compact ? 3 : 5).map((day) => (
                <View key={day.date} style={styles.dayRow}>
                  <AppText variant="caption" color="secondary" style={styles.dayLabel}>
                    {formatDateShort(day.date)}
                  </AppText>
                  <WeatherIcon
                    name={day.icon}
                    size={17}
                    color={
                      weatherAccent(day.icon) === 'amber'
                        ? colors.amber
                        : weatherAccent(day.icon) === 'electric'
                          ? colors.electric
                          : colors.textMuted
                    }
                  />
                  <View style={styles.dayBar}>
                    <View style={[styles.dayBarTrack, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.dayBarFill,
                          { backgroundColor: colors.accent, opacity: 0.55 + (day.max % 10) / 25 },
                        ]}
                      />
                    </View>
                  </View>
                  <AppText variant="caption" color="muted" style={styles.dayTemp}>
                    {formatTemperature(day.min, settings.units)}
                  </AppText>
                  <AppText variant="caption" font="semibold" style={styles.dayTemp}>
                    {formatTemperature(day.max, settings.units)}
                  </AppText>
                  <AppText variant="micro" color="electric" style={styles.dayPrecip}>
                    {day.precipitationProbability > 0 ? `${day.precipitationProbability}%` : ''}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </PressableScale>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  locationText: { flexShrink: 1 },
  updated: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  updatedText: { fontSize: 8.5, letterSpacing: 0.6 },
  currentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tempBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  temp: { fontSize: 50, lineHeight: 54 },
  tempCompact: { fontSize: 38, lineHeight: 42 },
  conditionBlock: { flex: 1, gap: 1 },
  details: { gap: 6, alignItems: 'flex-end' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  hourlyRow: { gap: spacing.lg, paddingVertical: 2 },
  hourItem: { alignItems: 'center', gap: 5, minWidth: 42 },
  precip: { fontSize: 8.5 },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: 9,
    borderRadius: radius.sm,
  },
  daily: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm, gap: 9 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayLabel: { width: 72 },
  dayBar: { flex: 1 },
  dayBarTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  dayBarFill: { height: '100%', borderRadius: 2, width: '62%' },
  dayTemp: { width: 34, textAlign: 'right' },
  dayPrecip: { width: 28, textAlign: 'right', fontSize: 8.5 },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
});
