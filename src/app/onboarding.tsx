import {
  Bell,
  Car,
  Check,
  ChevronRight,
  CloudSun,
  Disc3,
  MapPin,
  Navigation,
  Palette,
  Radio,
  Ruler,
  Shield,
  Sparkles,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { layout, radius, spacing } from '@/constants/theme';
import { useLocation } from '@/store/location';
import { useSettings, useTheme, type ThemeMode, type Units } from '@/store/settings';
import { APP } from '@/constants/config';
import { requestNotificationPermission, getNotificationPermission, type PermissionState } from '@/utils/permissions';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { JeepLiberty } from '@/components/vehicle/JeepLiberty';

const STEPS = 3;

export default function OnboardingScreen() {
  const { settings, updateSettings } = useSettings();
  const { colors, isDark } = useTheme();
  const { permission, requestPermission, gpsStatus } = useLocation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [notificationState, setNotificationState] = useState<PermissionState>('undetermined');

  useEffect(() => {
    void getNotificationPermission().then(setNotificationState);
  }, []);

  if (settings.onboardingComplete) return <Redirect href="/" />;

  const finish = (goToSettings = false) => {
    updateSettings({ onboardingComplete: true });
    router.replace(goToSettings ? '/settings' : '/');
  };

  const requestLocation = async () => {
    await requestPermission();
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      updateSettings({ notificationsEnabled: false });
      return;
    }
    const result = await requestNotificationPermission();
    setNotificationState(result);
    updateSettings({ notificationsEnabled: result === 'granted' });
  };

  const locationStatus =
    permission === 'granted'
      ? gpsStatus === 'excellent' || gpsStatus === 'good'
        ? 'Ubicación activa'
        : 'Ubicación autorizada'
      : permission === 'denied'
        ? 'Permiso denegado'
        : 'Sin autorizar';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#07182C', '#050B14', '#03101A'] : ['#F3F8FF', '#EAF2FC', '#EEF3FA']}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.glow,
          { backgroundColor: isDark ? 'rgba(59,140,255,0.22)' : 'rgba(22,99,224,0.10)' },
        ]}
      />
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 18,
            paddingHorizontal: layout.screenPadding,
          },
        ]}
      >
        <View style={styles.brandRow}>
          <View style={[styles.logo, { backgroundColor: colors.accent }]}>
            <Car size={20} color={colors.white} strokeWidth={2.2} />
          </View>
          <View style={styles.brandText}>
            <AppText variant="caption" color="muted" style={styles.brandKicker}>
              JEEP CONNECT
            </AppText>
            <AppText variant="caption" color="secondary">
              {APP.vehicle}
            </AppText>
          </View>
          {step < STEPS - 1 ? (
            <PressableScale onPress={() => finish()} scaleTo={0.94} accessibilityRole="button">
              <AppText variant="caption" color="muted">
                Omitir
              </AppText>
            </PressableScale>
          ) : null}
        </View>

        <View style={styles.stepRow}>
          {Array.from({ length: STEPS }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                {
                  backgroundColor: index <= step ? colors.accent : colors.borderStrong,
                  width: index === step ? 26 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.body}>
          {step === 0 ? (
            <View style={styles.slide}>
              <View style={styles.hero}>
                <JeepLiberty height={168} />
              </View>
              <AppText variant="display" style={styles.title}>
                Tu Jeep,{'\n'}conectado.
              </AppText>
              <AppText variant="body" color="secondary" style={styles.lead}>
                Clima en tiempo real, mapas con rutas, radio en vivo y tu música de Spotify en un solo
                tablero, pensado para el camino.
              </AppText>
              <View style={styles.featureGrid}>
                <Feature icon={CloudSun} title="Clima real" text="Open-Meteo" />
                <Feature icon={Navigation} title="Rutas" text="OpenStreetMap" />
                <Feature icon={Radio} title="Radio" text="Radio Browser" />
                <Feature icon={Disc3} title="Spotify" text="Cuenta Premium" />
              </View>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.slide}>
              <AppText variant="title">Hazlo tuyo</AppText>
              <AppText variant="body" color="secondary" style={styles.lead}>
                Ajusta la apariencia y las unidades. Todo se guarda en este dispositivo.
              </AppText>

              <Card style={styles.card}>
                <View style={styles.cardHead}>
                  <Palette size={17} color={colors.accent} />
                  <AppText variant="bodyStrong">Tema</AppText>
                </View>
                <SegmentedControl<ThemeMode>
                  options={[
                    { value: 'dark', label: 'Oscuro' },
                    { value: 'light', label: 'Claro' },
                    { value: 'system', label: 'Sistema' },
                  ]}
                  value={settings.themeMode}
                  onChange={(themeMode) => updateSettings({ themeMode })}
                />
              </Card>

              <Card style={styles.card}>
                <View style={styles.cardHead}>
                  <Ruler size={17} color={colors.accent} />
                  <AppText variant="bodyStrong">Unidades</AppText>
                </View>
                <SegmentedControl<Units>
                  options={[
                    { value: 'metric', label: 'Métrico (km)' },
                    { value: 'imperial', label: 'Imperial (mi)' },
                  ]}
                  value={settings.units}
                  onChange={(units) => updateSettings({ units })}
                />
              </Card>

              <Card style={styles.card}>
                <View style={styles.permissionRow}>
                  <View style={[styles.permissionIcon, { backgroundColor: colors.accentSoft }]}>
                    <MapPin size={18} color={colors.accent} />
                  </View>
                  <View style={styles.permissionText}>
                    <AppText variant="bodyStrong">Ubicación</AppText>
                    <AppText variant="caption" color="muted">
                      {locationStatus}. Se usa para clima, velocidad GPS y rutas.
                    </AppText>
                  </View>
                  {permission === 'granted' ? (
                    <View style={[styles.check, { backgroundColor: colors.greenSoft }]}>
                      <Check size={15} color={colors.green} />
                    </View>
                  ) : (
                    <Chip label="Permitir" selected onPress={requestLocation} compact />
                  )}
                </View>
              </Card>

              <Card style={styles.card}>
                <SwitchRow
                  title="Notificaciones"
                  subtitle="Avisos locales opcionales. Nunca enviamos datos a un servidor propio."
                  icon={Bell}
                  value={settings.notificationsEnabled && notificationState === 'granted'}
                  onValueChange={toggleNotifications}
                  last
                />
              </Card>
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.slide}>
              <View style={[styles.doneBubble, { backgroundColor: colors.greenSoft }]}>
                <Sparkles size={26} color={colors.green} />
              </View>
              <AppText variant="title">Todo listo</AppText>
              <AppText variant="body" color="secondary" style={styles.lead}>
                Jeep Connect funciona sin cuentas para clima, mapas y radio. Spotify y los servicios
                externos se configuran después.
              </AppText>

              <Card style={styles.card}>
                <SetupRow
                  icon={Disc3}
                  title="Spotify"
                  text="Opcional. Requiere Client ID y una Redirect URI HTTPS. Se explica en Ajustes → Spotify."
                />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <SetupRow
                  icon={Shield}
                  title="Privacidad"
                  text="Los tokens de Spotify se guardan cifrados con SecureStore. No hay backend propio."
                />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <SetupRow
                  icon={Car}
                  title="Modo automotriz"
                  text="Actívalo en Ajustes para una pantalla horizontal panorámica con controles grandes."
                />
              </Card>

              <PressableScale
                onPress={() => finish(true)}
                scaleTo={0.97}
                style={[styles.secondaryButton, { borderColor: colors.borderStrong }]}
                accessibilityRole="button"
              >
                <AppText variant="bodyStrong" color="secondary">
                  Abrir ajustes después
                </AppText>
              </PressableScale>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          {step > 0 ? (
            <PressableScale
              onPress={() => setStep((current) => Math.max(0, current - 1))}
              scaleTo={0.95}
              style={styles.backButton}
              accessibilityRole="button"
            >
              <AppText variant="bodyStrong" color="secondary">
                Atrás
              </AppText>
            </PressableScale>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <PressableScale
            onPress={() => (step === STEPS - 1 ? finish() : setStep((current) => current + 1))}
            scaleTo={0.97}
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            accessibilityRole="button"
          >
            <AppText variant="bodyStrong" color="white">
              {step === STEPS - 1 ? 'Entrar a Jeep Connect' : 'Continuar'}
            </AppText>
            <ChevronRight size={18} color={colors.white} strokeWidth={2.4} />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof CloudSun;
  title: string;
  text: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.feature, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
      <Icon size={20} color={colors.electric} strokeWidth={1.9} />
      <AppText variant="caption" font="semibold">
        {title}
      </AppText>
      <AppText variant="micro" color="muted" style={styles.featureText}>
        {text.toUpperCase()}
      </AppText>
    </View>
  );
}

function SetupRow({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Disc3;
  title: string;
  text: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.setupRow}>
      <View style={[styles.permissionIcon, { backgroundColor: colors.accentSoft }]}>
        <Icon size={18} color={colors.accent} />
      </View>
      <View style={styles.permissionText}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" color="muted">
          {text}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glow: { position: 'absolute', top: -120, alignSelf: 'center', width: 360, height: 360, borderRadius: 180 },
  content: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  brandText: { flex: 1 },
  brandKicker: { letterSpacing: 1.6, fontSize: 10 },
  stepRow: { flexDirection: 'row', gap: 6, marginTop: spacing.lg },
  stepDot: { height: 8, borderRadius: 4 },
  body: { flex: 1, justifyContent: 'center' },
  slide: { gap: spacing.md },
  hero: { alignItems: 'center', marginBottom: -8 },
  title: { fontSize: 46, lineHeight: 48 },
  lead: { marginBottom: 2 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  feature: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  featureText: { fontSize: 8.5, letterSpacing: 0.7 },
  card: { backgroundColor: undefined },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  permissionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  permissionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  permissionText: { flex: 1, gap: 2 },
  check: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  doneBubble: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  setupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  backButton: { paddingVertical: 14, paddingHorizontal: spacing.md },
  backPlaceholder: { width: 60 },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: radius.pill,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
});
