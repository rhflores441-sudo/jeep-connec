import {
  Battery,
  BatteryCharging,
  Bell,
  Bluetooth,
  CircleCheck,
  Crosshair,
  Info,
  MapPin,
  Send,
  Settings2,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  Wifi,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { radius, spacing } from '@/constants/theme';
import { connectivityLabel, useConnectivity } from '@/hooks/useConnectivity';
import { useLocation, type GpsStatus } from '@/store/location';
import { useSettings, useTheme } from '@/store/settings';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  type PermissionState,
} from '@/utils/permissions';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SwitchRow } from '@/components/ui/SwitchRow';

export default function PermissionsSettingsScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings } = useSettings();
  const location = useLocation();
  const connectivity = useConnectivity();
  const [notificationState, setNotificationState] = useState<PermissionState>('undetermined');
  const [sendingTest, setSendingTest] = useState(false);

  const refreshNotifications = useCallback(async () => {
    const state = await getNotificationPermission();
    setNotificationState(state);
    if (state !== 'granted' && settings.notificationsEnabled) {
      updateSettings({ notificationsEnabled: false });
    }
  }, [settings.notificationsEnabled, updateSettings]);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  useFocusEffect(
    useCallback(() => {
      void refreshNotifications();
    }, [refreshNotifications]),
  );

  const toggleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      updateSettings({ notificationsEnabled: false });
      return;
    }
    const result = await requestNotificationPermission();
    setNotificationState(result);
    updateSettings({ notificationsEnabled: result === 'granted' });
    if (result !== 'granted') {
      Alert.alert(
        'Notificaciones bloqueadas',
        'El sistema no concedió el permiso. Puedes activarlo manualmente en los ajustes del dispositivo.',
      );
    }
  };

  const testNotification = async () => {
    setSendingTest(true);
    try {
      await sendTestNotification();
      Alert.alert('Notificación programada', 'Recibirás un aviso local en unos segundos.');
    } catch (error) {
      Alert.alert(
        'No se pudo enviar la notificación',
        error instanceof Error ? error.message : 'Revisa el permiso de notificaciones del sistema.',
      );
    } finally {
      setSendingTest(false);
    }
  };

  const notificationGranted = notificationState === 'granted';
  const notificationsEffective = notificationGranted && settings.notificationsEnabled;
  const BatteryIcon = connectivity.isCharging ? BatteryCharging : Battery;
  const locationStatus =
    location.permission === 'granted' ? 'Concedido' : location.permission === 'denied' ? 'Denegado' : 'Sin autorizar';

  return (
    <Screen>
      <Header title="Permisos" subtitle="Notificaciones, ubicación y sistema" />

      <View style={styles.section}>
        <SectionHeader title="Notificaciones locales" subtitle="Avisos generados por la app" icon={Bell} />
        <Card>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: notificationGranted ? colors.greenSoft : colors.amberSoft }]}>
              <Bell size={21} color={notificationGranted ? colors.green : colors.amber} />
            </View>
            <View style={styles.statusText}>
              <AppText variant="bodyStrong">Permiso de notificaciones</AppText>
              <AppText variant="caption" color="muted">
                {notificationGranted
                  ? 'El sistema permite mostrar avisos de Jeep Connect.'
                  : notificationState === 'denied'
                    ? 'Bloqueado en el sistema. Ábrelo desde los ajustes del dispositivo.'
                    : 'Todavía no has autorizado las notificaciones.'}
              </AppText>
            </View>
            <StatusBadge
              label={notificationGranted ? 'Concedido' : notificationState === 'denied' ? 'Bloqueado' : 'Pendiente'}
              tone={notificationGranted ? 'good' : notificationState === 'denied' ? 'danger' : 'warn'}
            />
          </View>

          <SwitchRow
            title="Avisos de Jeep Connect"
            subtitle="Se guarda la preferencia; el permiso real lo controla el sistema."
            icon={Bell}
            value={notificationsEffective}
            onValueChange={(value) => void toggleNotifications(value)}
            last
          />

          <View style={styles.actions}>
            <PressableScale
              onPress={() => void testNotification()}
              disabled={!notificationGranted || sendingTest}
              scaleTo={0.97}
              accessibilityRole="button"
              style={[
                styles.primaryButton,
                { backgroundColor: notificationGranted ? colors.accent : colors.borderStrong },
              ]}
            >
              <Send size={16} color={colors.white} />
              <AppText variant="bodyStrong" color="white">
                {sendingTest ? 'Programando…' : 'Enviar notificación de prueba'}
              </AppText>
            </PressableScale>
            <PressableScale
              onPress={location.openSystemSettings}
              scaleTo={0.97}
              accessibilityRole="button"
              style={[styles.secondaryButton, { borderColor: colors.borderStrong }]}
            >
              <Settings2 size={16} color={colors.text} />
              <AppText variant="bodyStrong">Ajustes del sistema</AppText>
            </PressableScale>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Ubicación" subtitle="GPS y servicios del sistema" icon={MapPin} />
        <Card>
          <InfoRow
            icon={Crosshair}
            title="Permiso de ubicación"
            value={locationStatus}
            tone={location.permission === 'granted' ? 'good' : location.permission === 'denied' ? 'danger' : 'warn'}
          />
          <Divider />
          <InfoRow
            icon={MapPin}
            title="Señal GPS"
            value={gpsLabel(location.gpsStatus)}
            tone={location.gpsStatus === 'excellent' || location.gpsStatus === 'good' ? 'good' : 'warn'}
          />
          <Divider />
          <InfoRow
            icon={Crosshair}
            title="Modo de ubicación"
            value={location.isManualLocation ? 'Manual' : 'Dispositivo'}
            tone="neutral"
          />
          <View style={styles.actions}>
            {location.permission !== 'granted' ? (
              <PressableScale
                onPress={() => void location.requestPermission()}
                scaleTo={0.97}
                accessibilityRole="button"
                style={[styles.primaryButton, { backgroundColor: colors.accent }]}
              >
                <Crosshair size={16} color={colors.white} />
                <AppText variant="bodyStrong" color="white">
                  Permitir ubicación
                </AppText>
              </PressableScale>
            ) : (
              <PressableScale
                onPress={() => void location.refresh()}
                scaleTo={0.97}
                accessibilityRole="button"
                style={[styles.primaryButton, { backgroundColor: colors.accent }]}
              >
                <MapPin size={16} color={colors.white} />
                <AppText variant="bodyStrong" color="white">
                  Actualizar posición
                </AppText>
              </PressableScale>
            )}
            <PressableScale
              onPress={location.openSystemSettings}
              scaleTo={0.97}
              accessibilityRole="button"
              style={[styles.secondaryButton, { borderColor: colors.borderStrong }]}
            >
              <Settings2 size={16} color={colors.text} />
              <AppText variant="bodyStrong">Abrir ajustes</AppText>
            </PressableScale>
          </View>
          {location.error ? (
            <View style={[styles.warning, { backgroundColor: colors.amberSoft }]}>
              <TriangleAlert size={16} color={colors.amber} />
              <AppText variant="caption" color="amber" style={styles.warningText}>
                {location.error}
              </AppText>
            </View>
          ) : null}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Estado del dispositivo" subtitle="Lecturas reales del sistema" icon={Smartphone} />
        <Card>
          <InfoRow
            icon={Wifi}
            title="Conectividad"
            value={
              connectivity.isConnected
                ? `${connectivityLabel(connectivity.connectionType)}${
                    connectivity.isInternetReachable === false ? ' · sin acceso' : ''
                  }`
                : 'Sin conexión'
            }
            tone={connectivity.isConnected ? 'good' : 'danger'}
          />
          <Divider />
          <InfoRow
            icon={BatteryIcon}
            title="Batería"
            value={
              connectivity.batteryLevel === null
                ? 'No disponible'
                : `${Math.round(connectivity.batteryLevel * 100)}%${connectivity.isCharging ? ' · cargando' : ''}`
            }
            tone={connectivity.isCharging ? 'good' : 'neutral'}
          />
          <Divider />
          <InfoRow icon={Bluetooth} title="Bluetooth" value="Administrado por el sistema" tone="neutral" />
          <AppText variant="caption" color="muted" style={styles.bluetoothNote}>
            {connectivity.bluetoothNote}
          </AppText>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Transparencia" subtitle="Lo que la app no simula" icon={ShieldCheck} />
        <Card>
          <HonestyRow
            title="Bluetooth y llamadas"
            text="Jeep Connect no activa Bluetooth, no empareja dispositivos ni simula llamadas. Esas funciones pertenecen al sistema operativo y al vehículo."
          />
          <Divider />
          <HonestyRow
            title="Android Auto y CarPlay"
            text="No se simula proyección. El modo automotriz es una pantalla panorámica propia de la app."
          />
          <Divider />
          <HonestyRow
            title="Ecualizador"
            text="Las bandas se guardan, pero Expo/React Native no expone un procesador DSP nativo; no se aplica un efecto falso."
            last
          />
          <View style={[styles.warning, { backgroundColor: colors.accentSoft }]}>
            <Info size={16} color={colors.accent} />
            <AppText variant="caption" color="secondary" style={styles.warningText}>
              Todos los permisos se pueden revocar en cualquier momento desde los ajustes del sistema.
            </AppText>
          </View>
        </Card>
      </View>

      <View style={styles.footer}>
        <CircleCheck size={14} color={colors.textMuted} />
        <AppText variant="caption" color="muted" align="center">
          Sin permisos simulados: la app consulta el estado real en cada apertura.
        </AppText>
      </View>
    </Screen>
  );
}

function InfoRow({
  icon: Icon,
  title,
  value,
  tone,
}: {
  icon: typeof Bell;
  title: string;
  value: string;
  tone: 'good' | 'warn' | 'danger' | 'neutral';
}) {
  const { colors } = useTheme();
  const color = tone === 'good' ? colors.green : tone === 'warn' ? colors.amber : tone === 'danger' ? colors.danger : colors.textSecondary;
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.accentSoft }]}>
        <Icon size={18} color={colors.textSecondary} />
      </View>
      <AppText variant="bodyStrong" style={styles.infoTitle}>
        {title}
      </AppText>
      <AppText variant="caption" font="semibold" style={[styles.infoValue, { color }]}>
        {value}
      </AppText>
    </View>
  );
}

function HonestyRow({ title, text, last }: { title: string; text: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.honestyRow,
        last ? null : { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <View style={[styles.bullet, { backgroundColor: colors.amberSoft }]}>
        <TriangleAlert size={14} color={colors.amber} />
      </View>
      <View style={styles.honestyText}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" color="muted">
          {text}
        </AppText>
      </View>
    </View>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: 'good' | 'warn' | 'danger' }) {
  const { colors } = useTheme();
  const color = tone === 'good' ? colors.green : tone === 'warn' ? colors.amber : colors.danger;
  const background = tone === 'good' ? colors.greenSoft : tone === 'warn' ? colors.amberSoft : colors.dangerSoft;
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <AppText variant="micro" color={tone === 'good' ? 'green' : tone === 'warn' ? 'amber' : 'danger'}>
        {label.toUpperCase()}
      </AppText>
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

function gpsLabel(status: GpsStatus): string {
  switch (status) {
    case 'excellent':
      return 'Excelente';
    case 'good':
      return 'Buena';
    case 'weak':
      return 'Débil';
    case 'searching':
      return 'Buscando';
    case 'requesting':
      return 'Solicitando';
    case 'denied':
      return 'Denegado';
    case 'disabled':
      return 'Apagado';
    case 'error':
      return 'Error';
    default:
      return 'Sin señal';
  }
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xxl, gap: spacing.md },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusIcon: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  statusText: { flex: 1, gap: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  primaryButton: {
    flexGrow: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  secondaryButton: {
    flexGrow: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 46, paddingVertical: spacing.xs },
  infoIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { flex: 1 },
  infoValue: { textAlign: 'right', flexShrink: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  warningText: { flex: 1 },
  honestyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md },
  bullet: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  honestyText: { flex: 1, gap: 2 },
  bluetoothNote: { marginTop: spacing.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.xxl },
});
