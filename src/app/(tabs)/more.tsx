import {
  Battery,
  BatteryCharging,
  Bluetooth,
  Car,
  CircleHelp,
  CloudSun,
  Disc3,
  History,
  Info,
  LayoutGrid,
  Map,
  MapPin,
  Radio,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Wifi,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { APP } from '@/constants/config';
import { spacing } from '@/constants/theme';
import { connectivityLabel, useConnectivity } from '@/hooks/useConnectivity';
import { useLibrary } from '@/store/library';
import { useLocation } from '@/store/location';
import { useSettings, useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ShortcutTile } from '@/components/home/ShortcutTile';
import { JeepLiberty } from '@/components/vehicle/JeepLiberty';

export default function MoreScreen() {
  const { colors, isDark } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { library } = useLibrary();
  const { locationLabel, permission } = useLocation();
  const connectivity = useConnectivity();

  const openAuto = () => {
    updateSettings({ layoutMode: 'auto' });
    router.push('/auto');
  };

  const battery = connectivity.batteryLevel;
  const BatteryIcon = connectivity.isCharging ? BatteryCharging : Battery;

  return (
    <Screen tabInset>
      <Header
        title="Más"
        subtitle="Aplicaciones, ajustes y estado"
        showBack={false}
        right={
          <IconButton icon={Settings} label="Abrir ajustes" onPress={() => router.push('/settings')} />
        }
      />

      <Card padded={false}>
        <View style={[styles.vehicleTint, { backgroundColor: isDark ? 'rgba(15,52,42,0.38)' : 'rgba(20,120,82,0.07)' }]} />
        <View style={styles.vehicleRow}>
          <View style={styles.vehicleArt}>
            <JeepLiberty height={92} />
          </View>
          <View style={styles.vehicleText}>
            <AppText variant="micro" color="electric" style={styles.kicker}>
              TU VEHÍCULO
            </AppText>
            <AppText variant="subtitle" numberOfLines={1}>
              {APP.vehicle}
            </AppText>
            <AppText variant="caption" color="muted" numberOfLines={1}>
              {APP.vehicleColor}
            </AppText>
            <View style={styles.vehicleBadge}>
              <MapPin size={12} color={colors.accent} />
              <AppText variant="micro" color="muted" numberOfLines={1} style={styles.vehicleBadgeText}>
                {permission === 'granted' ? locationLabel ?? 'GPS activo' : 'Ubicación sin permiso'}
              </AppText>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHeader
          title="Aplicaciones"
          subtitle="Accesos directos"
          icon={LayoutGrid}
          actionLabel="Ver todas"
          onAction={() => router.push('/apps')}
        />
        <View style={styles.gridRow}>
          <ShortcutTile
            icon={Map}
            label="Mapa"
            subtitle="Rutas OSRM"
            color={colors.accent}
            onPress={() => router.push('/map')}
            compact
          />
          <ShortcutTile
            icon={Radio}
            label="Radio"
            subtitle={`${library.radioFavorites.length} favoritas`}
            color={colors.green}
            onPress={() => router.push('/radio')}
            compact
          />
        </View>
        <View style={styles.gridRow}>
          <ShortcutTile
            icon={CloudSun}
            label="Clima"
            subtitle="Open-Meteo"
            color={colors.amber}
            onPress={() => router.push('/weather')}
            compact
          />
          <ShortcutTile
            icon={Disc3}
            label="Música"
            subtitle="Spotify"
            color={colors.electric}
            onPress={() => router.push('/music')}
            compact
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Modo automotriz" subtitle="Pantalla panorámica para el vehículo" icon={Car} />
        <Card>
          <View style={styles.autoRow}>
            <View style={[styles.autoIcon, { backgroundColor: colors.accentSoft }]}>
              <Car size={22} color={colors.accent} />
            </View>
            <View style={styles.autoText}>
              <AppText variant="bodyStrong">Tablero horizontal</AppText>
              <AppText variant="caption" color="muted">
                Reloj grande, velocidad GPS, clima, accesos y reproductor en una sola vista. Bloquea la
                orientación horizontal mientras está activo.
              </AppText>
            </View>
          </View>
          <PressableScale
            onPress={openAuto}
            scaleTo={0.97}
            accessibilityRole="button"
            style={[styles.autoButton, { backgroundColor: colors.accent }]}
          >
            <Smartphone size={17} color={colors.white} />
            <AppText variant="bodyStrong" color="white">
              Abrir modo automotriz
            </AppText>
          </PressableScale>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Ajustes" subtitle="Todo se guarda en este dispositivo" icon={Settings} />
        <Card padded={false}>
          <View style={styles.list}>
            <ListRow
              title="Ajustes generales"
              subtitle="Tema, unidades, mapa, diseño y volumen"
              icon={Settings}
              onPress={() => router.push('/settings')}
            />
            <ListRow
              title="Spotify"
              subtitle="Cuenta, Premium y Redirect URI"
              icon={Disc3}
              onPress={() => router.push('/settings/spotify')}
            />
            <ListRow
              title="Ubicación"
              subtitle={settings.useManualLocation ? 'Ubicación manual activa' : 'GPS del dispositivo'}
              icon={MapPin}
              onPress={() => router.push('/settings/location')}
            />
            <ListRow
              title="Permisos y notificaciones"
              subtitle="Ubicación, avisos locales y sistema"
              icon={ShieldCheck}
              onPress={() => router.push('/settings/permissions')}
            />
            <ListRow
              title="Ecualizador"
              subtitle="Presets y bandas guardadas"
              icon={SlidersHorizontal}
              onPress={() => router.push('/settings/equalizer')}
            />
            <ListRow
              title="Historial"
              subtitle={`${library.history.length} reproducciones registradas`}
              icon={History}
              onPress={() => router.push('/history')}
            />
            <ListRow
              title="Acerca de Jeep Connect"
              subtitle={`Versión ${APP.version}`}
              icon={Info}
              last
              onPress={() => router.push('/settings/about')}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Estado del dispositivo" subtitle="Sin datos simulados" icon={Wifi} />
        <Card>
          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, { backgroundColor: colors.greenSoft }]}>
              <Wifi size={18} color={colors.green} />
            </View>
            <View style={styles.statusText}>
              <AppText variant="bodyStrong">Internet</AppText>
              <AppText variant="caption" color="muted">
                {connectivity.isConnected
                  ? `${connectivityLabel(connectivity.connectionType)}${
                      connectivity.isInternetReachable === false ? ' · Sin acceso' : ''
                    }`
                  : 'Sin conexión'}
              </AppText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, { backgroundColor: colors.amberSoft }]}>
              <BatteryIcon size={18} color={colors.amber} />
            </View>
            <View style={styles.statusText}>
              <AppText variant="bodyStrong">Batería</AppText>
              <AppText variant="caption" color="muted">
                {battery === null
                  ? 'No disponible en este dispositivo'
                  : `${Math.round(battery * 100)}%${connectivity.isCharging ? ' · Cargando' : ''}`}
              </AppText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, { backgroundColor: colors.accentSoft }]}>
              <Bluetooth size={18} color={colors.accent} />
            </View>
            <View style={styles.statusText}>
              <AppText variant="bodyStrong">Bluetooth</AppText>
              <AppText variant="caption" color="muted">
                {connectivity.bluetoothNote}
              </AppText>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.footer}>
        <CircleHelp size={14} color={colors.textMuted} />
        <AppText variant="caption" color="muted" align="center">
          Jeep Connect no está afiliado a Jeep ni Stellantis.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  vehicleTint: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  vehicleArt: { width: 150 },
  vehicleText: { flex: 1, gap: 1 },
  kicker: { fontSize: 9, letterSpacing: 1.3 },
  vehicleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  vehicleBadgeText: { flexShrink: 1 },
  section: { marginTop: spacing.xxl, gap: spacing.md },
  gridRow: { flexDirection: 'row', gap: spacing.md },
  autoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  autoIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  autoText: { flex: 1, gap: 2 },
  autoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: spacing.lg,
  },
  list: { paddingHorizontal: spacing.lg },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusText: { flex: 1, gap: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.xxl },
});
