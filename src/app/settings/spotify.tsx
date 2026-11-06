import { Image } from 'expo-image';
import {
  CircleCheck,
  Crown,
  Disc3,
  ExternalLink,
  Link2,
  LoaderCircle,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
} from 'lucide-react-native';
import { Alert, Linking, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { radius, spacing } from '@/constants/theme';
import { useSpotify } from '@/store/spotify';
import { useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { Card, CardDivider } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';

const SPOTIFY_DASHBOARD = 'https://developer.spotify.com/dashboard';
const SPOTIFY_PREMIUM = 'https://www.spotify.com/premium/';

export default function SpotifySettingsScreen() {
  const { colors, isDark } = useTheme();
  const spotify = useSpotify();

  const connected = spotify.status === 'connected';
  const busy = spotify.status === 'connecting' || spotify.status === 'initializing';
  const avatar = spotify.profile?.images?.[0]?.url ?? null;
  const displayName = spotify.profile?.display_name ?? spotify.profile?.id ?? 'Cuenta de Spotify';
  const planLabel = spotify.isPremium ? 'Premium' : spotify.isFree ? 'Free' : 'Sin dato';
  const planTone: 'good' | 'warn' | 'danger' = spotify.isPremium
    ? 'good'
    : spotify.isFree
      ? 'warn'
      : 'warn';
  const proxyRequired = Platform.OS !== 'web' && !spotify.proxyConfigured;

  const confirmDisconnect = () => {
    Alert.alert(
      'Desconectar Spotify',
      'Se borrarán los tokens seguros de este dispositivo. Podrás volver a conectar la cuenta cuando quieras.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desconectar', style: 'destructive', onPress: () => void spotify.disconnect() },
      ],
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('No se pudo abrir el enlace', url);
    });
  };

  return (
    <Screen>
      <Header
        title="Spotify"
        subtitle="Cuenta, reproducción y Redirect URI"
        right={
          connected ? (
            <IconButton
              icon={RefreshCw}
              label="Actualizar estado de reproducción"
              onPress={() => void spotify.syncPlayback()}
            />
          ) : undefined
        }
      />

      <Card>
        <View style={styles.statusHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surfaceHigh },
            ]}
          >
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={150}
                cachePolicy="disk"
              />
            ) : (
              <Disc3 size={26} color={colors.green} />
            )}
          </View>
          <View style={styles.statusText}>
            <AppText variant="micro" color="muted" style={styles.kicker}>
              SPOTIFY WEB API
            </AppText>
            <AppText variant="subtitle" numberOfLines={1}>
              {connected ? displayName : statusTitle(spotify.status, spotify.configured)}
            </AppText>
            <AppText variant="caption" color="muted" numberOfLines={2}>
              {connected
                ? spotify.profile?.email ?? `Cuenta ${spotify.profile?.country ?? 'vinculada'}`
                : statusSubtitle(spotify.status, spotify.configured)}
            </AppText>
          </View>
          <StatusBadge
            label={
              connected
                ? planLabel
                : busy
                  ? 'Conectando'
                  : spotify.status === 'error'
                    ? 'Error'
                    : spotify.configured
                      ? 'Desconectado'
                      : 'Sin configurar'
            }
            tone={connected ? planTone : busy ? 'warn' : 'danger'}
          />
        </View>

        {connected ? (
          <>
            <View style={[styles.profileStats, { borderTopColor: colors.border }]}>
              <ProfileStat label="Plan" value={planLabel} icon={Crown} />
              <ProfileStat
                label="Modo OAuth"
                value={spotify.proxyConfigured ? 'Proxy HTTPS' : 'Directo'}
                icon={Link2}
              />
              <ProfileStat
                label="Dispositivo"
                value={spotify.playback?.device?.name ?? 'Sin activo'}
                icon={Smartphone}
              />
            </View>

            {spotify.isFree ? (
              <View style={[styles.warning, { backgroundColor: colors.amberSoft }]}>
                <TriangleAlert size={17} color={colors.amber} />
                <AppText variant="caption" color="amber" style={styles.warningText}>
                  Tu cuenta es Free. Spotify solo permite iniciar, pausar y cambiar de canción
                  desde la app con una cuenta Premium y un dispositivo activo.
                </AppText>
              </View>
            ) : !spotify.planKnown ? (
              <View style={[styles.warning, { backgroundColor: colors.amberSoft }]}>
                <TriangleAlert size={17} color={colors.amber} />
                <AppText variant="caption" color="amber" style={styles.warningText}>
                  Spotify no devolvió el plan de la cuenta (cambio de la API 2026). La app no
                  bloquea la reproducción: si falta Premium, Spotify responderá con el error real.
                </AppText>
              </View>
            ) : null}

            <View style={styles.buttons}>
              <PressableScale
                onPress={() => router.push('/music')}
                accessibilityRole="button"
                scaleTo={0.97}
                style={[styles.primaryButton, { backgroundColor: colors.accent }]}
              >
                <Disc3 size={17} color={colors.white} />
                <AppText variant="bodyStrong" color="white">
                  Abrir Música
                </AppText>
              </PressableScale>
              <PressableScale
                onPress={confirmDisconnect}
                accessibilityRole="button"
                scaleTo={0.97}
                style={[styles.secondaryButton, { borderColor: colors.borderStrong }]}
              >
                <LogOut size={16} color={colors.danger} />
                <AppText variant="bodyStrong" color="danger">
                  Desconectar
                </AppText>
              </PressableScale>
            </View>
          </>
        ) : (
          <View style={styles.buttons}>
            <PressableScale
              onPress={() => void spotify.connect()}
              disabled={!spotify.configured || busy}
              accessibilityRole="button"
              scaleTo={0.97}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: spotify.configured ? colors.green : colors.borderStrong,
                  opacity: spotify.configured ? 1 : 0.65,
                },
              ]}
            >
              {busy ? (
                <LoaderCircle size={17} color={colors.white} />
              ) : (
                <Lock size={17} color={colors.white} />
              )}
              <AppText variant="bodyStrong" color="white">
                {busy ? 'Conectando…' : 'Conectar con Spotify'}
              </AppText>
            </PressableScale>
          </View>
        )}

        {spotify.error ? (
          <View style={[styles.error, { backgroundColor: colors.dangerSoft }]}>
            <TriangleAlert size={17} color={colors.danger} />
            <View style={styles.errorText}>
              <AppText variant="caption" color="danger">
                {spotify.error}
              </AppText>
              <PressableScale
                onPress={spotify.clearError}
                scaleTo={0.95}
                accessibilityRole="button"
                style={styles.dismiss}
              >
                <AppText variant="caption" color="muted">
                  Ocultar
                </AppText>
              </PressableScale>
            </View>
          </View>
        ) : null}
      </Card>

      <View style={styles.section}>
        <SectionHeader
          title="Configuración OAuth"
          subtitle="Datos que deben coincidir con el dashboard de Spotify"
          icon={Link2}
        />
        <Card>
          <View style={styles.configRow}>
            <View style={styles.configText}>
              <AppText variant="bodyStrong">Client ID</AppText>
              <AppText variant="caption" color="muted">
                Variable EXPO_PUBLIC_SPOTIFY_CLIENT_ID del archivo .env
              </AppText>
            </View>
            <StatusBadge
              label={spotify.configured ? 'Configurado' : 'Faltante'}
              tone={spotify.configured ? 'good' : 'danger'}
            />
          </View>
          <CardDivider />
          <View style={styles.redirectBlock}>
            <View style={styles.redirectHeader}>
              <AppText variant="bodyStrong">Redirect URI registrada</AppText>
              <StatusBadge
                label={spotify.redirectCompatible ? 'Compatible' : 'No compatible'}
                tone={spotify.redirectCompatible ? 'good' : 'danger'}
              />
            </View>
            <View
              style={[
                styles.redirectValue,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surfaceHigh, borderColor: colors.border },
              ]}
            >
              <AppText variant="mono" selectable numberOfLines={2} style={styles.redirectText}>
                {spotify.redirectUri}
              </AppText>
            </View>
            <View style={styles.configRow}>
              <View style={styles.configText}>
                <AppText variant="bodyStrong">Proxy de autorización</AppText>
                <AppText variant="caption" color="muted">
                  {spotify.proxyConfigured
                    ? 'El proxy HTTPS recibe el callback de Spotify y lo devuelve a la app.'
                    : 'Sin proxy: el callback debe ser HTTPS o loopback accesible desde el navegador.'}
                </AppText>
              </View>
              <StatusBadge
                label={spotify.proxyConfigured ? 'Activo' : proxyRequired ? 'Falta' : 'Opcional'}
                tone={spotify.proxyConfigured ? 'good' : proxyRequired ? 'danger' : 'warn'}
              />
            </View>
            {proxyRequired ? (
              <View style={[styles.warning, { backgroundColor: colors.dangerSoft }]}>
                <TriangleAlert size={16} color={colors.danger} />
                <AppText variant="caption" color="danger" style={styles.warningText}>
                  En iOS y Android el retorno debe usar el esquema jeepconnect://, pero Spotify no
                  lo acepta. Configura EXPO_PUBLIC_SPOTIFY_AUTH_PROXY_URL con un proxy HTTPS; sin
                  él, el navegador no podrá devolver el código a la app.
                </AppText>
              </View>
            ) : null}
            {spotify.proxyConfigured ? (
              <View
                style={[
                  styles.redirectValue,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surfaceHigh, borderColor: colors.border },
                ]}
              >
                <AppText variant="micro" color="muted" style={styles.returnLabel}>
                  RETORNO A LA APP
                </AppText>
                <AppText variant="mono" selectable numberOfLines={2} style={styles.redirectText}>
                  {spotify.appReturnUri}
                </AppText>
              </View>
            ) : null}
            {!spotify.redirectCompatible ? (
              <View style={[styles.warning, { backgroundColor: colors.amberSoft }]}>
                <TriangleAlert size={16} color={colors.amber} />
                <AppText variant="caption" color="amber" style={styles.warningText}>
                  Spotify rechaza esquemas personalizados como jeepconnect://. Registra una URI HTTPS
                  (por ejemplo, un Worker proxy) en el dashboard y en
                  EXPO_PUBLIC_SPOTIFY_REDIRECT_URI. Consulta docs/SPOTIFY.md.
                </AppText>
              </View>
            ) : null}
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Requisitos de reproducción" subtitle="Límites reales de Spotify" icon={CircleCheck} />
        <Card>
          <Requirement
            title="Cuenta Premium"
            text="La Web API solo permite controlar la reproducción de cuentas Premium. La app muestra y respeta el plan real."
          />
          <Requirement
            title="Dispositivo activo"
            text="Spotify necesita al menos un dispositivo abierto (teléfono, computadora o bocina). La app intenta transferir la reproducción sin simular dispositivos."
          />
          <Requirement
            title="Sesión segura"
            text="Los tokens se guardan con expo-secure-store (Keychain/Keystore). El client secret no se usa: el flujo es PKCE."
          />
          <Requirement
            title="Modo desarrollo 2026"
            text="La app de Spotify debe pertenecer a una cuenta Premium y admite hasta 5 usuarios. Además, GET /me puede omitir el plan, el país y el correo. La app tolera esos campos ausentes."
            last
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Enlaces" subtitle="Documentación oficial" icon={ExternalLink} />
        <Card padded={false}>
          <View style={styles.list}>
            <ListRow
              title="Spotify Developer Dashboard"
              subtitle="Crea la app y registra la Redirect URI"
              icon={Disc3}
              iconColor={colors.green}
              onPress={() => openLink(SPOTIFY_DASHBOARD)}
            />
            <ListRow
              title="Spotify Premium"
              subtitle="Requisito para controlar la reproducción"
              icon={Crown}
              iconColor={colors.amber}
              onPress={() => openLink(SPOTIFY_PREMIUM)}
            />
            <ListRow
              title="Documentación del proyecto"
              subtitle="docs/SPOTIFY.md incluye el proxy HTTPS de ejemplo"
              icon={ShieldCheck}
              last
              onPress={() =>
                Alert.alert(
                  'Documentación local',
                  'Abre docs/SPOTIFY.md en el repositorio para ver el flujo PKCE, el proxy HTTPS y la configuración del dashboard.',
                )
              }
            />
          </View>
        </Card>
      </View>

      <View style={styles.footer}>
        <AppText variant="caption" color="muted" align="center">
          Spotify es una marca de Spotify AB. Jeep Connect no está afiliado a Spotify.
        </AppText>
      </View>
    </Screen>
  );
}

function ProfileStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Crown;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.profileStat}>
      <Icon size={15} color={colors.textMuted} />
      <View style={styles.profileStatText}>
        <AppText variant="micro" color="muted" style={styles.statLabel}>
          {label.toUpperCase()}
        </AppText>
        <AppText variant="caption" font="semibold" numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

function Requirement({ title, text, last }: { title: string; text: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.requirement,
        last ? null : { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <View style={[styles.requirementDot, { backgroundColor: colors.greenSoft }]}>
        <CircleCheck size={15} color={colors.green} />
      </View>
      <View style={styles.requirementText}>
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

function statusTitle(status: string, configured: boolean): string {
  if (!configured) return 'Spotify sin configurar';
  switch (status) {
    case 'initializing':
      return 'Restaurando sesión';
    case 'connecting':
      return 'Conectando con Spotify';
    case 'error':
      return 'No se pudo conectar';
    default:
      return 'Cuenta desconectada';
  }
}

function statusSubtitle(status: string, configured: boolean): string {
  if (!configured) {
    return 'Agrega el Client ID en .env para habilitar la autenticación PKCE.';
  }
  if (status === 'initializing') return 'Buscando tokens seguros en este dispositivo…';
  if (status === 'connecting') return 'Completa la autorización en tu navegador.';
  if (status === 'error') return 'Revisa la Redirect URI y vuelve a intentarlo.';
  return 'Conecta tu cuenta para buscar y reproducir música.';
}

const styles = StyleSheet.create({
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 58, height: 58, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  statusText: { flex: 1, gap: 1 },
  kicker: { fontSize: 9, letterSpacing: 1.1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  profileStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  profileStat: { flexBasis: '30%', flexGrow: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  profileStatText: { flex: 1, gap: 1 },
  statLabel: { fontSize: 8, letterSpacing: 0.7 },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  warningText: { flex: 1 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  primaryButton: {
    flexGrow: 1,
    flexBasis: '55%',
    minHeight: 46,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  secondaryButton: {
    flexGrow: 1,
    minHeight: 46,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: { flex: 1, gap: 4 },
  dismiss: { alignSelf: 'flex-start' },
  section: { marginTop: spacing.xxl, gap: spacing.md },
  configRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  configText: { flex: 1, gap: 2 },
  redirectBlock: { gap: spacing.sm },
  redirectHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  redirectValue: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  redirectText: { fontSize: 12, lineHeight: 18 },
  returnLabel: { fontSize: 8, letterSpacing: 0.8, marginBottom: 4 },
  requirement: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md },
  requirementDot: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  requirementText: { flex: 1, gap: 2 },
  list: { paddingHorizontal: spacing.lg },
  footer: { marginTop: spacing.xxl },
});
