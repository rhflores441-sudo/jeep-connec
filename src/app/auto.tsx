import { Image } from 'expo-image';
import {
  Bluetooth,
  CloudSun,
  Disc3,
  Gauge,
  LayoutGrid,
  Map,
  Music,
  Pause,
  Phone,
  Play,
  Radio,
  RadioTower,
  Settings,
  SkipBack,
  SkipForward,
  Smartphone,
  Wifi,
  WifiOff,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { APP } from '@/constants/config';
import { radius, spacing } from '@/constants/theme';
import { useClock } from '@/hooks/useClock';
import { connectivityLabel, useConnectivity } from '@/hooks/useConnectivity';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { useLocation } from '@/store/location';
import { useSettings, useTheme } from '@/store/settings';
import { useWeather } from '@/store/weather';
import {
  formatDateLong,
  formatSpeed,
  formatTemperature,
  formatTime,
  temperatureUnit,
} from '@/utils/format';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { JeepLiberty } from '@/components/vehicle/JeepLiberty';

export default function AutoScreen() {
  const { colors, isDark } = useTheme();
  const { settings, updateSettings } = useSettings();
  const now = useClock(true);
  const { effectiveCoordinates, locationLabel, speedMps, gpsStatus, permission } = useLocation();
  const connectivity = useConnectivity();
  const { weather, loading } = useWeather();
  const nowPlaying = useNowPlaying();

  const speed = formatSpeed(speedMps, settings.units);
  const current = weather?.current;
  const today = weather?.daily[0];

  const exitAuto = () => {
    updateSettings({ layoutMode: 'mobile' });
    router.replace('/');
  };

  const gpsValue =
    permission !== 'granted'
      ? 'Sin permiso'
      : gpsStatus === 'excellent'
        ? 'Excelente'
        : gpsStatus === 'good'
          ? 'Buena'
          : gpsStatus === 'weak'
            ? 'Débil'
            : gpsStatus === 'searching'
              ? 'Buscando'
              : 'Sin señal';

  return (
    <Screen scroll={false} bottomInset={14} edges={{ top: true, bottom: true }}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: colors.accent }]}>
            <Gauge size={18} color={colors.white} strokeWidth={2.3} />
          </View>
          <View>
            <AppText variant="micro" color="muted" style={styles.brandKicker}>
              JEEP CONNECT · MODO AUTOMOTRIZ
            </AppText>
            <AppText variant="caption" color="secondary" numberOfLines={1}>
              {locationLabel ?? 'Ubicación sin configurar'}
            </AppText>
          </View>
        </View>
        <View style={styles.headerStatus}>
          <AutoStatus icon={Gauge} label="GPS" value={gpsValue} tone={permission === 'granted' ? 'good' : 'warn'} />
          <AutoStatus
            icon={connectivity.isConnected ? Wifi : WifiOff}
            label="RED"
            value={
              connectivity.isConnected
                ? connectivityLabel(connectivity.connectionType)
                : 'Sin conexión'
            }
            tone={connectivity.isConnected ? 'good' : 'bad'}
          />
          <AutoStatus icon={Bluetooth} label="BT" value="Sistema" tone="neutral" />
          <AutoStatus icon={Phone} label="TEL" value="Sistema" tone="neutral" />
        </View>
        <PressableScale
          onPress={exitAuto}
          scaleTo={0.95}
          accessibilityRole="button"
          accessibilityLabel="Salir del modo automotriz"
          style={[styles.exitButton, { borderColor: colors.borderStrong, backgroundColor: colors.surfaceGlass }]}
        >
          <Smartphone size={18} color={colors.text} />
          <AppText variant="caption" font="semibold">
            Modo móvil
          </AppText>
        </PressableScale>
      </View>

      <View style={styles.body}>
        <View style={[styles.column, styles.leftColumn]}>
          <View style={styles.vehicleArt}>
            <JeepLiberty height={126} />
          </View>
          <AppText variant="micro" color="electric" style={styles.kicker}>
            TU VEHÍCULO
          </AppText>
          <AppText variant="subtitle" numberOfLines={1}>
            {APP.vehicle}
          </AppText>
          <AppText variant="caption" color="muted" numberOfLines={1}>
            {APP.vehicleColor}
          </AppText>
          <View style={styles.speedRow}>
            <AppText variant="display" style={styles.speed}>
              {String(speed).padStart(2, '0')}
            </AppText>
            <View style={styles.speedUnitBlock}>
              <AppText variant="micro" color="muted">
                {settings.units === 'metric' ? 'KM/H' : 'MPH'}
              </AppText>
              <AppText variant="micro" color={permission === 'granted' ? 'green' : 'amber'} style={styles.gpsTag}>
                GPS {gpsValue.toUpperCase()}
              </AppText>
            </View>
          </View>
        </View>

        <View style={[styles.column, styles.centerColumn]}>
          <AppText variant="display" style={styles.clock} numberOfLines={1}>
            {formatTime(now, { seconds: true })}
          </AppText>
          <AppText variant="caption" color="secondary" style={styles.date}>
            {formatDateLong(now)}
          </AppText>

          <Card style={styles.weatherCard} padded={false}>
            {current ? (
              <View style={styles.weatherContent}>
                <View style={styles.weatherMain}>
                  <WeatherIcon
                    name={current.icon}
                    size={42}
                    color={current.icon === 'sun' || current.icon === 'cloud-sun' ? colors.amber : colors.electric}
                  />
                  <View>
                    <AppText variant="display" style={styles.weatherTemp}>
                      {formatTemperature(current.temperature, settings.units)}
                    </AppText>
                    <AppText variant="micro" color="muted">
                      {temperatureUnit(settings.units)} · ST {formatTemperature(current.apparentTemperature, settings.units)}
                    </AppText>
                  </View>
                  <View style={styles.weatherText}>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {current.condition}
                    </AppText>
                    {today ? (
                      <AppText variant="micro" color="muted">
                        MÁX {formatTemperature(today.max, settings.units)} · MÍN{' '}
                        {formatTemperature(today.min, settings.units)}
                      </AppText>
                    ) : null}
                  </View>
                </View>
                {weather?.hourly.length ? (
                  <View style={styles.hourlyRow}>
                    {weather.hourly.slice(0, 5).map((hour) => (
                      <View key={hour.time} style={styles.hourItem}>
                        <AppText variant="micro" color="muted">
                          {formatTime(new Date(hour.time))}
                        </AppText>
                        <AppText variant="caption" font="semibold">
                          {formatTemperature(hour.temperature, settings.units)}
                        </AppText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.weatherEmpty}>
                <CloudSun size={22} color={colors.amber} />
                <AppText variant="caption" color="muted">
                  {loading ? 'Consultando el clima…' : effectiveCoordinates ? 'Clima no disponible.' : 'Activa la ubicación para ver el clima.'}
                </AppText>
              </View>
            )}
          </Card>
        </View>

        <View style={[styles.column, styles.rightColumn]}>
          <View style={styles.shortcutRow}>
            <AutoShortcut icon={Map} label="Mapa" color={colors.accent} onPress={() => router.push('/map')} />
            <AutoShortcut icon={Radio} label="Radio" color={colors.green} onPress={() => router.push('/radio')} />
            <AutoShortcut icon={Music} label="Música" color={colors.electric} onPress={() => router.push('/music')} />
          </View>
          <View style={styles.shortcutRow}>
            <AutoShortcut icon={CloudSun} label="Clima" color={colors.amber} onPress={() => router.push('/weather')} />
            <AutoShortcut icon={LayoutGrid} label="Apps" color={colors.accent} onPress={() => router.push('/apps')} />
            <AutoShortcut icon={Settings} label="Ajustes" color={colors.textSecondary} onPress={() => router.push('/settings')} />
          </View>

          <View
            style={[
              styles.nowPlaying,
              { backgroundColor: colors.surfaceGlass, borderColor: colors.border },
            ]}
          >
            {nowPlaying.source ? (
              <>
                <View style={styles.nowRow}>
                  <View style={[styles.nowArtwork, { backgroundColor: colors.accentSoft }]}>
                    {nowPlaying.artwork ? (
                      <Image
                        source={{ uri: nowPlaying.artwork }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="disk"
                      />
                    ) : nowPlaying.source === 'radio' ? (
                      <RadioTower size={20} color={colors.accent} />
                    ) : (
                      <Disc3 size={20} color={colors.accent} />
                    )}
                  </View>
                  <View style={styles.nowText}>
                    <AppText variant="micro" color="electric" numberOfLines={1}>
                      {nowPlaying.sourceLabel.toUpperCase()}
                    </AppText>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {nowPlaying.title}
                    </AppText>
                    <AppText variant="caption" color="muted" numberOfLines={1}>
                      {nowPlaying.subtitle}
                    </AppText>
                  </View>
                </View>
                <View style={styles.nowControls}>
                  <IconButton
                    icon={SkipBack}
                    label="Anterior"
                    variant="plain"
                    size={34}
                    iconSize={18}
                    onPress={nowPlaying.previous}
                    disabled={!nowPlaying.canPrevious}
                  />
                  <IconButton
                    icon={nowPlaying.isPlaying ? Pause : Play}
                    label={nowPlaying.isPlaying ? 'Pausar' : 'Reproducir'}
                    variant="accent"
                    size={44}
                    iconSize={21}
                    loading={nowPlaying.isBuffering}
                    onPress={nowPlaying.toggle}
                  />
                  <IconButton
                    icon={SkipForward}
                    label="Siguiente"
                    variant="plain"
                    size={34}
                    iconSize={18}
                    onPress={nowPlaying.next}
                    disabled={!nowPlaying.canNext}
                  />
                </View>
              </>
            ) : (
              <View style={styles.nowEmpty}>
                <Disc3 size={20} color={colors.textMuted} />
                <View style={styles.nowText}>
                  <AppText variant="bodyStrong">Sin reproducción</AppText>
                  <AppText variant="caption" color="muted">
                    Elige radio o Spotify.
                  </AppText>
                </View>
              </View>
            )}
          </View>

          <View style={styles.autoNote}>
            <AppText variant="micro" color="muted" numberOfLines={2}>
              {isDark ? 'TABLERO PANORÁMICO' : 'TABLERO PANORÁMICO'} · {APP.vehicle.toUpperCase()}
            </AppText>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function AutoStatus({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}) {
  const { colors } = useTheme();
  const color =
    tone === 'good' ? colors.green : tone === 'warn' ? colors.amber : tone === 'bad' ? colors.danger : colors.textSecondary;
  return (
    <View style={styles.autoStatus}>
      <Icon size={13} color={color} strokeWidth={2.2} />
      <View>
        <AppText variant="micro" color="muted" style={styles.autoStatusLabel}>
          {label}
        </AppText>
        <AppText variant="micro" color="secondary" style={styles.autoStatusValue} numberOfLines={1}>
          {value.toUpperCase()}
        </AppText>
      </View>
    </View>
  );
}

function AutoShortcut({
  icon: Icon,
  label,
  color,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.shortcut,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.055)' : colors.white,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.shortcutIcon, { backgroundColor: color }]}>
        <Icon size={19} color={colors.white} strokeWidth={2} />
      </View>
      <AppText variant="caption" font="semibold" numberOfLines={1}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 190 },
  logo: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  brandKicker: { fontSize: 8.5, letterSpacing: 1.2 },
  headerStatus: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  autoStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  autoStatusLabel: { fontSize: 7.5, letterSpacing: 0.8 },
  autoStatusValue: { fontSize: 8.5, letterSpacing: 0.4 },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  body: { flex: 1, flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  column: { flex: 1, justifyContent: 'flex-start' },
  leftColumn: { flex: 1.05, justifyContent: 'center' },
  centerColumn: { flex: 1.25, alignItems: 'center', justifyContent: 'center' },
  rightColumn: { flex: 1.1, gap: spacing.sm, justifyContent: 'center' },
  vehicleArt: { marginHorizontal: -6, marginTop: -6, marginBottom: -2 },
  kicker: { fontSize: 8.5, letterSpacing: 1.2 },
  speedRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 2 },
  speed: { fontSize: 46, lineHeight: 48, letterSpacing: -1.6 },
  speedUnitBlock: { gap: 1, paddingBottom: 6 },
  gpsTag: { fontSize: 8, letterSpacing: 0.6 },
  clock: { fontSize: 58, lineHeight: 60, letterSpacing: -2 },
  date: { marginTop: -2 },
  weatherCard: { width: '100%', marginTop: spacing.md },
  weatherContent: { padding: spacing.md, gap: spacing.sm },
  weatherMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  weatherTemp: { fontSize: 34, lineHeight: 36, letterSpacing: -1 },
  weatherText: { flex: 1, gap: 1 },
  hourlyRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(124,174,255,0.16)', paddingTop: 6 },
  hourItem: { alignItems: 'center', gap: 1, flex: 1 },
  weatherEmpty: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  shortcutRow: { flexDirection: 'row', gap: spacing.sm },
  shortcut: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  shortcutIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  nowPlaying: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: 6, marginTop: 2 },
  nowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nowArtwork: { width: 38, height: 38, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  nowText: { flex: 1, gap: 1 },
  nowControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  nowEmpty: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  autoNote: { alignItems: 'center', marginTop: 2 },
});
