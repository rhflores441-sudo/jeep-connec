import {
  CloudSun,
  Database,
  Disc3,
  History,
  Info,
  Map,
  MapPin,
  MonitorSmartphone,
  Moon,
  Palette,
  RotateCcw,
  Ruler,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Volume2,
  type LucideIcon,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { APP } from '@/constants/config';
import { equalizerPresetLabel } from '@/constants/equalizer';
import { radius, spacing } from '@/constants/theme';
import { useLibrary } from '@/store/library';
import { useRadio } from '@/store/radio';
import {
  useSettings,
  useTheme,
  type LayoutMode,
  type MapStyle,
  type ThemeMode,
  type Units,
} from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { Card, CardDivider } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { VolumeSlider } from '@/components/ui/Slider';

const THEME_OPTIONS = [
  { value: 'system' as ThemeMode, label: 'Sistema' },
  { value: 'light' as ThemeMode, label: 'Claro' },
  { value: 'dark' as ThemeMode, label: 'Oscuro' },
];

const UNIT_OPTIONS = [
  { value: 'metric' as Units, label: 'Métrico' },
  { value: 'imperial' as Units, label: 'Imperial' },
];

const LAYOUT_OPTIONS = [
  { value: 'mobile' as LayoutMode, label: 'Móvil' },
  { value: 'auto' as LayoutMode, label: 'Automotriz' },
];

const MAP_OPTIONS = [
  { value: 'auto' as MapStyle, label: 'Automático' },
  { value: 'dark' as MapStyle, label: 'Oscuro' },
  { value: 'light' as MapStyle, label: 'Claro' },
];

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { library, clearHistory } = useLibrary();
  const radio = useRadio();

  const changeLayout = (value: LayoutMode) => {
    updateSettings({ layoutMode: value });
    if (value === 'auto') router.push('/auto');
  };

  const confirmReset = () => {
    Alert.alert(
      'Restablecer preferencias',
      'Se restaurarán el tema, las unidades, el volumen, el mapa, la ubicación manual y el ecualizador. El historial, los favoritos y la sesión de Spotify se conservan.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restablecer', style: 'destructive', onPress: () => void resetSettings() },
      ],
    );
  };

  const confirmClearHistory = () => {
    Alert.alert('Borrar historial', 'Se eliminarán las reproducciones guardadas en este dispositivo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: clearHistory },
    ]);
  };

  return (
    <Screen>
      <Header title="Ajustes" subtitle="Preferencias guardadas en este dispositivo" />

      <View style={styles.section}>
        <SectionHeader title="Apariencia" subtitle="Tema y sistema de unidades" icon={Palette} />
        <Card>
          <SettingField
            icon={Moon}
            title="Tema"
            description={
              settings.themeMode === 'system'
                ? 'Jeep Connect sigue el tema claro u oscuro del sistema.'
                : settings.themeMode === 'dark'
                  ? 'Interfaz oscura con azul eléctrico.'
                  : 'Interfaz clara de alto contraste.'
            }
          >
            <SegmentedControl options={THEME_OPTIONS} value={settings.themeMode} onChange={(value) =>
              updateSettings({ themeMode: value })
            } />
          </SettingField>
          <CardDivider />
          <SettingField
            icon={Ruler}
            title="Unidades"
            description="Velocidad, distancia, viento y temperatura en toda la app."
          >
            <SegmentedControl options={UNIT_OPTIONS} value={settings.units} onChange={(value) =>
              updateSettings({ units: value })
            } />
          </SettingField>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Pantalla y mapa" subtitle="Diseño del tablero y cartografía" icon={MonitorSmartphone} />
        <Card>
          <SettingField
            icon={settings.layoutMode === 'auto' ? MonitorSmartphone : Smartphone}
            title="Diseño"
            description="El modo automotriz bloquea la orientación horizontal y abre el tablero panorámico."
          >
            <SegmentedControl options={LAYOUT_OPTIONS} value={settings.layoutMode} onChange={changeLayout} />
          </SettingField>
          <CardDivider />
          <SettingField
            icon={Map}
            title="Estilo del mapa"
            description="Automático usa teselas claras para mejor legibilidad en el auto. Puedes forzar oscuro o claro."
          >
            <SegmentedControl options={MAP_OPTIONS} value={settings.mapStyle} onChange={(value) =>
              updateSettings({ mapStyle: value })
            } />
          </SettingField>
          <CardDivider />
          <SwitchRow
            icon={Moon}
            title="Mantener pantalla encendida"
            subtitle="Útil con el teléfono montado en el vehículo. Consume más batería."
            value={settings.keepAwake}
            onValueChange={(value) => updateSettings({ keepAwake: value })}
            last
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Audio" subtitle="Volumen persistente y ecualizador" icon={Volume2} />
        <Card>
          <View style={styles.volumeHeader}>
            <View style={styles.volumeTitle}>
              <View
                style={[
                  styles.volumeIcon,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,26,51,0.05)' },
                ]}
              >
                <Volume2 size={19} color={colors.textSecondary} />
              </View>
              <View style={styles.volumeText}>
                <AppText variant="bodyStrong">Volumen general</AppText>
                <AppText variant="caption" color="muted">
                  Se aplica a la radio y se envía a Spotify cuando es posible.
                </AppText>
              </View>
            </View>
            <AppText variant="bodyStrong" color="accent">
              {Math.round(settings.volume * 100)}%
            </AppText>
          </View>
          <VolumeSlider
            value={settings.volume}
            onValueChange={(value) => updateSettings({ volume: value })}
            onSlidingComplete={(value) => radio.setVolume(value)}
          />
          <CardDivider />
          <ListRow
            title="Ecualizador"
            subtitle={`Preset: ${equalizerPresetLabel(settings.equalizerPreset)} · 7 bandas guardadas`}
            icon={SlidersHorizontal}
            onPress={() => router.push('/settings/equalizer')}
            last
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Integraciones" subtitle="Servicios reales y permisos" icon={CloudSun} />
        <Card padded={false}>
          <View style={styles.list}>
            <ListRow
              title="Spotify"
              subtitle="Cuenta, Premium, dispositivos y Redirect URI"
              icon={Disc3}
              iconColor={colors.green}
              onPress={() => router.push('/settings/spotify')}
            />
            <ListRow
              title="Ubicación"
              subtitle={settings.useManualLocation ? 'Ubicación manual activa' : 'GPS del dispositivo'}
              icon={MapPin}
              iconColor={colors.accent}
              onPress={() => router.push('/settings/location')}
            />
            <ListRow
              title="Permisos y notificaciones"
              subtitle="Ubicación, avisos locales y estado del sistema"
              icon={ShieldCheck}
              iconColor={colors.electric}
              onPress={() => router.push('/settings/permissions')}
            />
            <ListRow
              title="Historial de reproducción"
              subtitle={`${library.history.length} entradas guardadas`}
              icon={History}
              iconColor={colors.amber}
              onPress={() => router.push('/history')}
            />
            <ListRow
              title="Acerca de Jeep Connect"
              subtitle={`Versión ${APP.version} · integraciones y privacidad`}
              icon={Info}
              last
              onPress={() => router.push('/settings/about')}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Datos" subtitle="Contenido almacenado localmente" icon={Database} />
        <Card padded={false}>
          <View style={styles.list}>
            <ListRow
              title="Borrar historial"
              subtitle="No afecta favoritos, lugares guardados ni la sesión de Spotify."
              icon={History}
              iconColor={colors.danger}
              danger
              onPress={confirmClearHistory}
            />
            <ListRow
              title="Restablecer preferencias"
              subtitle="Vuelve a los valores predeterminados de la app."
              icon={RotateCcw}
              iconColor={colors.amber}
              danger
              last
              onPress={confirmReset}
            />
          </View>
        </Card>
      </View>

      <View style={styles.footer}>
        <Settings size={14} color={colors.textMuted} />
        <AppText variant="caption" color="muted" align="center">
          {APP.name} {APP.version} · {APP.vehicle}
        </AppText>
      </View>
    </Screen>
  );
}

function SettingField({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <View
          style={[
            styles.fieldIcon,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,26,51,0.05)' },
          ]}
        >
          <Icon size={19} color={colors.textSecondary} strokeWidth={2} />
        </View>
        <View style={styles.fieldText}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText variant="caption" color="muted">
            {description}
          </AppText>
        </View>
      </View>
      <View style={styles.fieldControl}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xxl, gap: spacing.md },
  field: { gap: spacing.md },
  fieldHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  fieldIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  fieldText: { flex: 1, gap: 2 },
  fieldControl: { paddingLeft: 50 },
  volumeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  volumeTitle: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, flex: 1 },
  volumeIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  volumeText: { flex: 1, gap: 2 },
  list: { paddingHorizontal: spacing.lg },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.xxl },
});
