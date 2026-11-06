import {
  CloudRain,
  Droplets,
  MapPin,
  RefreshCw,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
} from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { radius, spacing } from '@/constants/theme';
import { useLocation } from '@/store/location';
import { useSettings, useTheme } from '@/store/settings';
import { useWeather } from '@/store/weather';
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
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EmptyState, LoadingState } from '@/components/ui/StateViews';
import { WeatherIcon } from '@/components/weather/WeatherIcon';

export default function WeatherScreen() {
  const { colors } = useTheme();
  const { settings } = useSettings();
  const { weather, loading, refreshing, error, refresh } = useWeather();
  const { locationLabel, permission, requestPermission, isManualLocation } = useLocation();

  const header = (
    <Header
      title="Clima"
      subtitle={locationLabel ?? 'Ubicación sin configurar'}
      right={<IconButton icon={RefreshCw} label="Actualizar clima" onPress={() => void refresh()} />}
    />
  );

  if (!weather) {
    return (
      <Screen>
        {header}
        <Card>
          {loading ? (
            <LoadingState label="Consultando Open-Meteo…" />
          ) : (
            <EmptyState
              icon={MapPin}
              title="Sin datos de clima"
              message={
                isManualLocation
                  ? 'La ubicación manual configurada no permitió obtener el clima. Revisa Ajustes → Ubicación.'
                  : 'El clima necesita una ubicación. Puedes usar el GPS del dispositivo o configurar una ubicación manual.'
              }
              action={
                <View style={styles.actions}>
                  {permission !== 'granted' ? (
                    <Chip
                      label="Permitir ubicación"
                      selected
                      onPress={() => void requestPermission()}
                      compact
                    />
                  ) : null}
                  <Chip label="Ubicación manual" onPress={() => router.push('/settings/location')} compact />
                </View>
              }
            />
          )}
        </Card>
      </Screen>
    );
  }

  const { current, hourly, daily } = weather;
  const today = daily[0];
  const minAll = Math.min(...daily.map((day) => day.min));
  const maxAll = Math.max(...daily.map((day) => day.max));
  const range = Math.max(1, maxAll - minAll);

  return (
    <Screen refreshing={refreshing} onRefresh={() => void refresh()}>
      {header}

      <Card padded={false}>
        <View style={styles.currentHeader}>
          <View style={styles.locationRow}>
            <MapPin size={13} color={colors.accent} />
            <AppText variant="caption" color="muted" numberOfLines={1} style={styles.locationText}>
              {locationLabel ?? 'Ubicación actual'}
            </AppText>
          </View>
          <AppText variant="micro" color="muted" style={styles.updated}>
            {formatUpdatedAt(weather.fetchedAt).toUpperCase()}
          </AppText>
        </View>

        <View style={styles.currentRow}>
          <WeatherIcon
            name={current.icon}
            size={68}
            color={
              weatherAccent(current.icon) === 'amber'
                ? colors.amber
                : weatherAccent(current.icon) === 'electric'
                  ? colors.electric
                  : colors.textSecondary
            }
          />
          <View style={styles.currentText}>
            <AppText variant="display" style={styles.temp}>
              {formatTemperature(current.temperature, settings.units)}
            </AppText>
            <AppText variant="subtitle" numberOfLines={1}>
              {current.condition}
            </AppText>
            <AppText variant="caption" color="muted">
              Sensación {formatTemperature(current.apparentTemperature, settings.units)} ·{' '}
              {temperatureUnit(settings.units)}
            </AppText>
          </View>
          {today ? (
            <View style={styles.highLow}>
              <AppText variant="caption" color="muted">
                MÁX
              </AppText>
              <AppText variant="bodyStrong">{formatTemperature(today.max, settings.units)}</AppText>
              <AppText variant="caption" color="muted" style={styles.highLowMin}>
                MÍN
              </AppText>
              <AppText variant="bodyStrong">{formatTemperature(today.min, settings.units)}</AppText>
            </View>
          ) : null}
        </View>

        <View style={[styles.stats, { borderTopColor: colors.border }]}>
          <Stat icon={Droplets} label="Humedad" value={`${Math.round(current.humidity)}%`} color={colors.electric} />
          <Stat icon={Wind} label="Viento" value={formatWind(current.windSpeed, settings.units)} color={colors.textSecondary} />
          <Stat
            icon={CloudRain}
            label="Lluvia"
            value={`${current.precipitation.toFixed(1)} mm`}
            color={colors.electric}
          />
          <Stat
            icon={Thermometer}
            label="Sensación"
            value={formatTemperature(current.apparentTemperature, settings.units)}
            color={colors.amber}
          />
        </View>
      </Card>

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.amberSoft }]}>
          <AppText variant="caption" color="amber">
            {error}
          </AppText>
          <RefreshCw size={15} color={colors.amber} onPress={() => void refresh()} />
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Próximas 24 horas" subtitle="Hora local del pronóstico" icon={Sun} />
        <Card padded={false}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hourlyRow}
          >
            {hourly.map((hour, index) => (
              <View key={hour.time} style={styles.hourItem}>
                <AppText variant="caption" color="muted">
                  {index === 0 ? 'Ahora' : formatHour(hour.time)}
                </AppText>
                <WeatherIcon
                  name={hour.icon}
                  size={24}
                  color={
                    weatherAccent(hour.icon) === 'amber'
                      ? colors.amber
                      : weatherAccent(hour.icon) === 'electric'
                        ? colors.electric
                        : colors.textSecondary
                  }
                />
                <AppText variant="bodyStrong">{formatTemperature(hour.temperature, settings.units)}</AppText>
                <AppText variant="micro" color={hour.precipitationProbability > 0 ? 'electric' : 'muted'}>
                  {hour.precipitationProbability > 0 ? `${hour.precipitationProbability}%` : '—'}
                </AppText>
              </View>
            ))}
          </ScrollView>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Próximos 7 días" subtitle="Máximas y mínimas" icon={Sun} />
        <Card>
          {daily.map((day, index) => {
            const left = ((day.min - minAll) / range) * 100;
            const width = Math.max(6, ((day.max - day.min) / range) * 100);
            return (
              <View
                key={day.date}
                style={[
                  styles.dayRow,
                  index === 0 ? null : { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <AppText variant="caption" color="secondary" style={styles.dayLabel}>
                  {index === 0 ? 'Hoy' : formatDateShort(day.date)}
                </AppText>
                <WeatherIcon
                  name={day.icon}
                  size={19}
                  color={
                    weatherAccent(day.icon) === 'amber'
                      ? colors.amber
                      : weatherAccent(day.icon) === 'electric'
                        ? colors.electric
                        : colors.textMuted
                  }
                />
                <AppText variant="micro" color={day.precipitationProbability > 0 ? 'electric' : 'muted'} style={styles.dayPrecip}>
                  {day.precipitationProbability > 0 ? `${day.precipitationProbability}%` : ''}
                </AppText>
                <View style={styles.dayBar}>
                  <View style={[styles.dayTrack, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.dayFill,
                        {
                          left: `${left}%` as `${number}%`,
                          width: `${width}%` as `${number}%`,
                          backgroundColor: colors.accent,
                        },
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
              </View>
            );
          })}
        </Card>
      </View>

      {today ? (
        <View style={styles.section}>
          <SectionHeader title="Sol" subtitle="Salida y puesta del sol" icon={Sunrise} />
          <View style={styles.sunRow}>
            <Card style={styles.sunCard}>
              <View style={styles.sunContent}>
                <Sunrise size={24} color={colors.amber} />
                <View>
                  <AppText variant="micro" color="muted" style={styles.sunLabel}>
                    AMANECER
                  </AppText>
                  <AppText variant="subtitle">{formatHour(today.sunrise)}</AppText>
                </View>
              </View>
            </Card>
            <Card style={styles.sunCard}>
              <View style={styles.sunContent}>
                <Sunset size={24} color={colors.electric} />
                <View>
                  <AppText variant="micro" color="muted" style={styles.sunLabel}>
                    ATARDECER
                  </AppText>
                  <AppText variant="subtitle">{formatHour(today.sunset)}</AppText>
                </View>
              </View>
            </Card>
          </View>
        </View>
      ) : null}

      <View style={styles.footer}>
        <AppText variant="micro" color="muted" align="center">
          Open-Meteo · Zona {weather.timezone} ({weather.timezoneAbbreviation})
        </AppText>
        <AppText variant="micro" color="muted" align="center">
          DATOS REALES · SIN SIMULACIÓN
        </AppText>
      </View>
    </Screen>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Droplets;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.stat}>
      <Icon size={16} color={color} strokeWidth={2} />
      <View>
        <AppText variant="micro" color="muted" style={styles.statLabel}>
          {label.toUpperCase()}
        </AppText>
        <AppText variant="caption" font="semibold">
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  locationText: { flexShrink: 1 },
  updated: { fontSize: 8.5, letterSpacing: 0.6 },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  currentText: { flex: 1, gap: 1 },
  temp: { fontSize: 58, lineHeight: 60, letterSpacing: -2 },
  highLow: { alignItems: 'flex-end', gap: 1 },
  highLowMin: { marginTop: spacing.sm },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  stat: { flexBasis: '46%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statLabel: { fontSize: 8.5, letterSpacing: 0.6 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  section: { marginTop: spacing.xxl, gap: spacing.md },
  hourlyRow: { gap: spacing.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  hourItem: { alignItems: 'center', gap: 6, minWidth: 44 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10 },
  dayLabel: { width: 72 },
  dayPrecip: { width: 26, textAlign: 'right' },
  dayBar: { flex: 1 },
  dayTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  dayFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 3 },
  dayTemp: { width: 36, textAlign: 'right' },
  sunRow: { flexDirection: 'row', gap: spacing.md },
  sunCard: { flex: 1 },
  sunContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sunLabel: { fontSize: 8.5, letterSpacing: 0.7 },
  footer: { marginTop: spacing.xxl, gap: 3, alignItems: 'center' },
});
