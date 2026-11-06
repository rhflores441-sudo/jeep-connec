import {
  Battery,
  BatteryCharging,
  Bluetooth,
  Car,
  CloudSun,
  Gauge,
  History,
  LayoutGrid,
  Map,
  MapPin,
  Phone,
  Radio,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { APP } from '@/constants/config';
import { spacing } from '@/constants/theme';
import { useClock } from '@/hooks/useClock';
import { connectivityLabel, useConnectivity } from '@/hooks/useConnectivity';
import { useLibrary } from '@/store/library';
import { useLocation, type GpsStatus } from '@/store/location';
import { useSettings, useTheme } from '@/store/settings';
import { useWeather } from '@/store/weather';
import { formatDateLong, formatSpeed, formatTime } from '@/utils/format';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ShortcutTile } from '@/components/home/ShortcutTile';
import { StatusPill } from '@/components/home/StatusPill';
import { WeatherSummaryCard } from '@/components/home/WeatherSummaryCard';
import { PlayerCard } from '@/components/player/PlayerCard';
import { JeepLiberty } from '@/components/vehicle/JeepLiberty';

function gpsLabel(status: GpsStatus, granted: boolean): string {
  if (!granted) return status === 'denied' ? 'Permiso denegado' : 'Sin autorizar';
  switch (status) {
    case 'excellent':
      return 'Señal excelente';
    case 'good':
      return 'Señal buena';
    case 'weak':
      return 'Señal débil';
    case 'searching':
      return 'Buscando satélites';
    case 'requesting':
      return 'Solicitando permiso';
    case 'disabled':
      return 'GPS desactivado';
    case 'error':
      return 'Error de GPS';
    default:
      return 'Sin iniciar';
  }
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { weather, refreshing, refresh } = useWeather();
  const {
    permission,
    effectiveCoordinates,
    locationLabel,
    speedMps,
    gpsStatus,
    refresh: refreshLocation,
  } = useLocation();
  const connectivity = useConnectivity();
  const { library } = useLibrary();
  const now = useClock();

  const speed = formatSpeed(speedMps, settings.units);
  const speedUnit = settings.units === 'metric' ? 'km/h' : 'mph';
  const gpsTone =
    permission !== 'granted'
      ? 'bad'
      : gpsStatus === 'excellent' || gpsStatus === 'good'
        ? 'good'
        : gpsStatus === 'weak' || gpsStatus === 'searching'
          ? 'warn'
          : gpsStatus === 'denied' || gpsStatus === 'error' || gpsStatus === 'disabled'
            ? 'bad'
            : 'default';

  const internetValue = connectivity.isConnected
    ? connectivity.isInternetReachable === false
      ? 'Sin acceso a Internet'
      : connectivityLabel(connectivity.connectionType)
    : 'Sin conexión';

  const refreshAll = useCallback(() => {
    void Promise.all([refresh(), refreshLocation()]).catch(() => undefined);
  }, [refresh, refreshLocation]);

  const openAuto = () => {
    updateSettings({ layoutMode: 'auto' });
    router.push('/auto');
  };

  const current = weather?.current;
  const battery = connectivity.batteryLevel;
  const BatteryIcon = connectivity.isCharging ? BatteryCharging : Battery;

  return (
    <Screen tabInset refreshing={refreshing} onRefresh={refreshAll}>
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: colors.accent }]}>
            <Car size={19} color={colors.white} strokeWidth={2.2} />
          </View>
          <View>
            <AppText variant="micro" color="muted" style={styles.brandKicker}>
              JEEP CONNECT
            </AppText>
            <AppText variant="caption" color="secondary">
              {APP.vehicle}
            </AppText>
          </View>
        </View>
        <View style={styles.topActions}>
          <IconButton icon={Car} label="Abrir modo automotriz" variant="surface" onPress={openAuto} />
          <IconButton icon={Settings} label="Abrir ajustes" variant="surface" onPress={() => router.push('/settings')} />
        </View>
      </View>

      <View style={styles.clockRow}>
        <View style={styles.clockBlock}>
          <AppText variant="display" style={styles.clock} numberOfLines={1}>
            {formatTime(now)}
          </AppText>
          <AppText variant="caption" color="secondary">
            {formatDateLong(now)}
          </AppText>
        </View>
        <View style={styles.clockMeta}>
          <View style={styles.metaRow}>
            <MapPin size={13} color={colors.accent} />
            <AppText variant="caption" color="secondary" numberOfLines={1} style={styles.metaText}>
              {locationLabel ?? 'Ubicación sin configurar'}
            </AppText>
          </View>
          {battery !== null ? (
            <View style={styles.metaRow}>
              <BatteryIcon size={14} color={connectivity.isCharging ? colors.green : colors.textMuted} />
              <AppText variant="caption" color="muted">
                {Math.round(battery * 100)}%{connectivity.isCharging ? ' · Cargando' : ''}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>

      <Card padded={false} style={styles.vehicleCard}>
        <View
          style={[
            StyleSheet.absoluteFill,
            isDark ? styles.vehicleTintDark : styles.vehicleTintLight,
          ]}
        />
        <View style={styles.vehicleArt}>
          <JeepLiberty height={148} />
        </View>
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleText}>
            <AppText variant="micro" color="electric" style={styles.vehicleKicker}>
              TU VEHÍCULO
            </AppText>
            <AppText variant="subtitle" numberOfLines={1}>
              {APP.vehicle}
            </AppText>
            <AppText variant="caption" color="muted" numberOfLines={1}>
              {APP.vehicleColor}
            </AppText>
          </View>
          <View style={styles.speedBlock}>
            <AppText variant="display" style={styles.speed}>
              {String(speed).padStart(2, '0')}
            </AppText>
            <AppText variant="micro" color="muted" style={styles.speedUnit}>
              {speedUnit.toUpperCase()}
            </AppText>
          </View>
        </View>
        <View style={[styles.statusGrid, { borderTopColor: colors.border }]}>
          <View style={styles.statusItem}>
            <StatusPill
              icon={Gauge}
              label="GPS"
              value={gpsLabel(gpsStatus, permission === 'granted')}
              tone={gpsTone}
              compact
            />
          </View>
          <View style={styles.statusItem}>
            <StatusPill
              icon={connectivity.isConnected ? Wifi : WifiOff}
              label="Internet"
              value={internetValue}
              tone={connectivity.isConnected && connectivity.isInternetReachable !== false ? 'good' : 'bad'}
              compact
            />
          </View>
          <View style={styles.statusItem}>
            <StatusPill
              icon={Bluetooth}
              label="Bluetooth"
              value="Lo gestiona el SO"
              tone="default"
              compact
            />
          </View>
          <View style={styles.statusItem}>
            <StatusPill icon={Phone} label="Teléfono" value="Control del sistema" tone="default" compact />
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHeader
          title="Accesos rápidos"
          subtitle="Todo lo esencial a un toque"
          icon={LayoutGrid}
          actionLabel="Ver todo"
          onAction={() => router.push('/apps')}
        />
        <View style={styles.shortcutRow}>
          <ShortcutTile
            icon={Map}
            label="Mapa"
            subtitle="Rutas y lugares"
            color={colors.accent}
            onPress={() => router.push('/map')}
          />
          <ShortcutTile
            icon={Radio}
            label="Radio"
            subtitle="En vivo"
            color={colors.green}
            onPress={() => router.push('/radio')}
            badge={library.radioFavorites.length > 0 ? `${library.radioFavorites.length}` : null}
          />
        </View>
        <View style={styles.shortcutRow}>
          <ShortcutTile
            icon={CloudSun}
            label="Clima"
            subtitle={current ? `${Math.round(current.temperature)}° · ${current.condition}` : 'Open-Meteo'}
            color={colors.amber}
            onPress={() => router.push('/weather')}
          />
          <ShortcutTile
            icon={History}
            label="Historial"
            subtitle="Lo que has escuchado"
            color={colors.electric}
            onPress={() => router.push('/history')}
            badge={library.history.length > 0 ? `${library.history.length}` : null}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Clima"
          subtitle={effectiveCoordinates ? 'Datos reales de Open-Meteo' : 'Configura tu ubicación'}
          icon={CloudSun}
          actionLabel="Detalle"
          onAction={() => router.push('/weather')}
        />
        <WeatherSummaryCard compact showDaily={false} />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Reproducción"
          subtitle="Radio y Spotify unificados"
          icon={Radio}
          actionLabel="Historial"
          onAction={() => router.push('/history')}
        />
        <PlayerCard compact />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Conectividad" subtitle="Estado real del dispositivo" icon={Wifi} />
        <Card>
          <View style={styles.connectivityRow}>
            <View style={[styles.connectivityIcon, { backgroundColor: colors.greenSoft }]}>
              <Wifi size={18} color={colors.green} />
            </View>
            <View style={styles.connectivityText}>
              <AppText variant="bodyStrong">Red</AppText>
              <AppText variant="caption" color="muted">
                {internetValue}
                {connectivity.isWifi ? ' · Wi-Fi' : connectivity.isCellular ? ' · Datos móviles' : ''}
              </AppText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.connectivityRow}>
            <View style={[styles.connectivityIcon, { backgroundColor: colors.accentSoft }]}>
              <Bluetooth size={18} color={colors.accent} />
            </View>
            <View style={styles.connectivityText}>
              <AppText variant="bodyStrong">Bluetooth del vehículo</AppText>
              <AppText variant="caption" color="muted">
                {connectivity.bluetoothNote}
              </AppText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.connectivityRow}>
            <View
              style={[
                styles.connectivityIcon,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,26,51,0.05)' },
              ]}
            >
              <Car size={18} color={colors.textSecondary} />
            </View>
            <View style={styles.connectivityText}>
              <AppText variant="bodyStrong">Proyección en el auto</AppText>
              <AppText variant="caption" color="muted">
                La app está preparada para Android Auto y CarPlay, pero no simula la proyección. Usa el modo
                automotriz para una pantalla panorámica.
              </AppText>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.footer}>
        <AppText variant="micro" color="muted" align="center">
          {APP.name.toUpperCase()} · {APP.version}
        </AppText>
      </View>
    </Screen>
  );
}

const layoutPadding = 18;

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  brandKicker: { letterSpacing: 1.6, fontSize: 9.5 },
  topActions: { flexDirection: 'row', gap: spacing.sm },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  clockBlock: { flex: 1, gap: 1 },
  clock: { fontSize: 64, lineHeight: 66, letterSpacing: -2.4 },
  clockMeta: { alignItems: 'flex-end', gap: 5, paddingBottom: 6, maxWidth: '46%' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { flexShrink: 1 },
  vehicleCard: { marginTop: spacing.xl },
  vehicleTintDark: { backgroundColor: 'rgba(15, 52, 42, 0.42)' },
  vehicleTintLight: { backgroundColor: 'rgba(20, 120, 82, 0.08)' },
  vehicleArt: { paddingTop: spacing.sm, paddingHorizontal: spacing.sm },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layoutPadding,
    marginTop: -8,
  },
  vehicleText: { flex: 1, gap: 1 },
  vehicleKicker: { fontSize: 9 },
  speedBlock: { alignItems: 'flex-end', flexDirection: 'row', gap: 4 },
  speed: { fontSize: 42, lineHeight: 44, letterSpacing: -1.6 },
  speedUnit: { fontSize: 9, marginBottom: 7 },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: layoutPadding,
    marginTop: spacing.md,
  },
  statusItem: { flexBasis: '47%', flexGrow: 1 },
  section: { marginTop: spacing.xxl, gap: spacing.md },
  shortcutRow: { flexDirection: 'row', gap: spacing.md },
  connectivityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  connectivityIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  connectivityText: { flex: 1, gap: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  footer: { marginTop: spacing.xxl, alignItems: 'center' },
});
