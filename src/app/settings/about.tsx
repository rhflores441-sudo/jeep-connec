import Constants from 'expo-constants';
import {
  Car,
  CloudSun,
  Code2,
  Database,
  Disc3,
  ExternalLink,
  Globe,
  Heart,
  Info,
  Lock,
  Map,
  MapPin,
  Radio,
  Server,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { APP } from '@/constants/config';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { Card, CardDivider } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { JeepLiberty } from '@/components/vehicle/JeepLiberty';

type DataSource = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  url: string;
  color?: 'accent' | 'green' | 'amber' | 'electric';
};

const DATA_SOURCES: DataSource[] = [
  {
    icon: CloudSun,
    title: 'Open-Meteo',
    subtitle: 'Clima actual, por horas y pronóstico de 7 días.',
    url: 'https://open-meteo.com/',
    color: 'electric',
  },
  {
    icon: Map,
    title: 'OpenStreetMap + CARTO',
    subtitle: 'Teselas raster del mapa y atribución de datos.',
    url: 'https://www.openstreetmap.org/copyright',
    color: 'green',
  },
  {
    icon: MapPin,
    title: 'Nominatim',
    subtitle: 'Búsqueda de lugares y geocodificación inversa.',
    url: 'https://nominatim.org/',
    color: 'amber',
  },
  {
    icon: Globe,
    title: 'OSRM',
    subtitle: 'Cálculo de rutas y distancias sobre la red vial.',
    url: 'https://project-osrm.org/',
    color: 'accent',
  },
  {
    icon: Radio,
    title: 'Radio Browser',
    subtitle: 'Directorio comunitario de estaciones de radio.',
    url: 'https://www.radio-browser.info/',
    color: 'amber',
  },
  {
    icon: Disc3,
    title: 'Spotify Web API',
    subtitle: 'Reproducción y biblioteca con tu propia cuenta.',
    url: 'https://developer.spotify.com/documentation/web-api',
    color: 'green',
  },
];

const TECH = ['Expo SDK 58', 'React Native 0.88', 'TypeScript', 'Reanimated', 'react-native-svg'];

export default function AboutScreen() {
  const { colors, isDark } = useTheme();
  const sdk = Constants.expoConfig?.sdkVersion ?? '58';

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('No se pudo abrir el enlace', url);
    });
  };

  return (
    <Screen>
      <Header title="Acerca de" subtitle="Integraciones, privacidad y transparencia" />

      <Card>
        <View style={styles.hero}>
          <View style={[styles.vehicleStage, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(10,26,51,0.03)' }]}>
            <JeepLiberty height={150} />
          </View>
          <View style={styles.heroText}>
            <AppText variant="micro" color="accent">
              CENTRO DE INFOENTRETENIMIENTO
            </AppText>
            <AppText variant="title">{APP.name}</AppText>
            <AppText variant="caption" color="muted">
              {APP.vehicle} · {APP.vehicleColor}
            </AppText>
            <View style={styles.versionRow}>
              <View style={[styles.versionBadge, { backgroundColor: colors.accentSoft }]}>
                <AppText variant="caption" color="accent" font="semibold">
                  Versión {APP.version}
                </AppText>
              </View>
              <View style={[styles.versionBadge, { backgroundColor: colors.surfaceHigh }]}>
                <AppText variant="caption" color="secondary" font="semibold">
                  Expo SDK {sdk}
                </AppText>
              </View>
            </View>
          </View>
        </View>
        <View style={[styles.note, { backgroundColor: colors.amberSoft }]}>
          <TriangleAlert size={16} color={colors.amber} />
          <AppText variant="caption" color="secondary" style={styles.noteText}>
            La ilustración del vehículo es un dibujo vectorial original, no una fotografía. Puedes sustituirla por una
            imagen propia en el código fuente.
          </AppText>
        </View>
      </Card>

      <View style={styles.section}>
        <SectionHeader
          title="Integraciones reales"
          subtitle="Servicios abiertos consultados en vivo, sin datos inventados"
          icon={Server}
        />
        <Card padded={false}>
          <View style={styles.list}>
            {DATA_SOURCES.map((source, index) => (
              <ListRow
                key={source.title}
                title={source.title}
                subtitle={source.subtitle}
                icon={source.icon}
                iconColor={resolveSourceColor(source.color, colors)}
                onPress={() => openLink(source.url)}
                right={<ExternalLink size={15} color={colors.textMuted} />}
                last={index === DATA_SOURCES.length - 1}
              />
            ))}
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Privacidad"
          subtitle="Todo se guarda en tu dispositivo"
          icon={ShieldCheck}
        />
        <Card>
          <PrivacyRow
            icon={Database}
            title="Almacenamiento local"
            text="Preferencias, favoritos, historial, lugares y ajustes del ecualizador viven en el almacenamiento local de la app."
          />
          <CardDivider />
          <PrivacyRow
            icon={Lock}
            title="Tokens protegidos"
            text="Los tokens de Spotify se guardan en expo-secure-store (Keychain en iOS y Keystore en Android), nunca en texto plano."
          />
          <CardDivider />
          <PrivacyRow
            icon={Globe}
            title="Sin servidores propios"
            text="Jeep Connect no envía telemetría ni crea cuentas. Las consultas van directo a las APIs públicas que elegiste usar."
          />
          <CardDivider />
          <PrivacyRow
            icon={MapPin}
            title="Ubicación bajo tu control"
            text="El GPS solo se usa para clima, velocidad y rutas. Puedes desactivarlo o fijar una ubicación manual en Ajustes."
            last
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Limitaciones honestas"
          subtitle="Lo que la app no finge hacer"
          icon={Info}
        />
        <Card>
          <LimitationRow
            title="Bluetooth y llamadas"
            text="No se activa el Bluetooth ni se emparejan dispositivos. Esa función pertenece al sistema operativo del teléfono y al vehículo."
          />
          <CardDivider />
          <LimitationRow
            title="Android Auto y CarPlay"
            text="No se simula proyección. El modo automotriz es una pantalla panorámica propia de la app, pensada para un soporte o pantalla externa."
          />
          <CardDivider />
          <LimitationRow
            title="Spotify y cuentas Free"
            text="La reproducción remota exige Spotify Premium y un dispositivo activo. La app respeta los límites de la API y muestra el error real."
          />
          <CardDivider />
          <LimitationRow
            title="Ecualizador"
            text="Las bandas se guardan, pero React Native no expone un procesador DSP nativo. No se aplica un efecto de audio falso."
            last
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Tecnología" subtitle="Construido con herramientas abiertas" icon={Code2} />
        <Card>
          <View style={styles.techWrap}>
            {TECH.map((item) => (
              <View
                key={item}
                style={[
                  styles.techPill,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,26,51,0.05)' },
                ]}
              >
                <AppText variant="caption" color="secondary" font="semibold">
                  {item}
                </AppText>
              </View>
            ))}
          </View>
          <CardDivider />
          <ListRow
            title="Documentación de Expo"
            subtitle="Guías oficiales del SDK usado por esta app"
            icon={Sparkles}
            iconColor={colors.electric}
            onPress={() => openLink('https://docs.expo.dev/')}
            right={<ExternalLink size={15} color={colors.textMuted} />}
          />
          <ListRow
            title="Lucide"
            subtitle="Set de iconos de código abierto"
            icon={Heart}
            iconColor={colors.green}
            onPress={() => openLink('https://lucide.dev/')}
            right={<ExternalLink size={15} color={colors.textMuted} />}
            last
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Card tone="accent">
          <View style={styles.brandRow}>
            <View style={[styles.brandIcon, { backgroundColor: colors.accent }]}>
              <Car size={22} color={colors.white} strokeWidth={2} />
            </View>
            <View style={styles.brandText}>
              <AppText variant="bodyStrong">Proyecto independiente</AppText>
              <AppText variant="caption" color="secondary">
                Jeep Connect no está afiliado a Stellantis, Jeep, Spotify, OpenStreetMap ni a los proveedores de datos.
                Las marcas pertenecen a sus respectivos titulares.
              </AppText>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.footer}>
        <Heart size={14} color={colors.textMuted} />
        <AppText variant="caption" color="muted" align="center">
          Hecho para el Jeep Liberty 2010 · {APP.version}
        </AppText>
      </View>
    </Screen>
  );
}

function PrivacyRow({
  icon: Icon,
  title,
  text,
  last,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.privacyRow}>
      <View style={[styles.privacyIcon, { backgroundColor: colors.greenSoft }]}>
        <Icon size={17} color={colors.green} />
      </View>
      <View style={styles.privacyText}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" color="muted">
          {text}
        </AppText>
      </View>
    </View>
  );
}

function LimitationRow({ title, text, last }: { title: string; text: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.limitRow, last ? null : { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.limitDot, { backgroundColor: colors.amberSoft }]}>
        <TriangleAlert size={13} color={colors.amber} />
      </View>
      <View style={styles.limitText}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" color="muted">
          {text}
        </AppText>
      </View>
    </View>
  );
}

function resolveSourceColor(color: DataSource['color'], colors: ReturnType<typeof useTheme>['colors']) {
  switch (color) {
    case 'green':
      return colors.green;
    case 'amber':
      return colors.amber;
    case 'electric':
      return colors.electric;
    default:
      return colors.accent;
  }
}

const styles = StyleSheet.create({
  hero: { gap: spacing.lg },
  vehicleStage: { borderRadius: radius.lg, paddingVertical: spacing.sm, overflow: 'hidden' },
  heroText: { gap: 4 },
  versionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  versionBadge: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  noteText: { flex: 1 },
  section: { marginTop: spacing.xxl, gap: spacing.md },
  list: { paddingHorizontal: spacing.lg },
  privacyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md },
  privacyIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  privacyText: { flex: 1, gap: 2 },
  limitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.md },
  limitDot: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  limitText: { flex: 1, gap: 2 },
  techWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  techPill: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.pill },
  brandRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  brandIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  brandText: { flex: 1, gap: 3 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.xxl },
});
