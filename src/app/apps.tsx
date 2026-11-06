import {
  Car,
  CloudSun,
  Disc3,
  History,
  Info,
  Map,
  MapPin,
  Radio,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { spacing } from '@/constants/theme';
import { useLibrary } from '@/store/library';
import { useSettings, useTheme } from '@/store/settings';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ShortcutTile } from '@/components/home/ShortcutTile';

export default function AppsScreen() {
  const { colors } = useTheme();
  const { updateSettings } = useSettings();
  const { library } = useLibrary();

  const openAuto = () => {
    updateSettings({ layoutMode: 'auto' });
    router.push('/auto');
  };

  return (
    <Screen>
      <Header title="Aplicaciones" subtitle="Todo Jeep Connect en un lugar" />

      <View style={styles.section}>
        <SectionHeader title="Conducción" subtitle="Lo que necesitas al volante" icon={Car} />
        <View style={styles.row}>
          <ShortcutTile
            icon={Map}
            label="Mapa"
            subtitle="Rutas y lugares guardados"
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
        <View style={styles.row}>
          <ShortcutTile
            icon={Disc3}
            label="Música"
            subtitle="Spotify"
            color={colors.electric}
            onPress={() => router.push('/music')}
            compact
          />
          <ShortcutTile
            icon={CloudSun}
            label="Clima"
            subtitle="Open-Meteo"
            color={colors.amber}
            onPress={() => router.push('/weather')}
            compact
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Configuración" subtitle="Personaliza la experiencia" icon={Settings} />
        <View style={styles.row}>
          <ShortcutTile
            icon={Settings}
            label="Ajustes"
            subtitle="Tema, unidades y mapa"
            color={colors.accent}
            onPress={() => router.push('/settings')}
            compact
          />
          <ShortcutTile
            icon={MapPin}
            label="Ubicación"
            subtitle="GPS o ubicación manual"
            color={colors.green}
            onPress={() => router.push('/settings/location')}
            compact
          />
        </View>
        <View style={styles.row}>
          <ShortcutTile
            icon={ShieldCheck}
            label="Permisos"
            subtitle="Notificaciones y sistema"
            color={colors.electric}
            onPress={() => router.push('/settings/permissions')}
            compact
          />
          <ShortcutTile
            icon={SlidersHorizontal}
            label="Ecualizador"
            subtitle="Presets guardados"
            color={colors.amber}
            onPress={() => router.push('/settings/equalizer')}
            compact
          />
        </View>
        <View style={styles.row}>
          <ShortcutTile
            icon={Disc3}
            label="Spotify"
            subtitle="Cuenta y Redirect URI"
            color={colors.green}
            onPress={() => router.push('/settings/spotify')}
            compact
          />
          <ShortcutTile
            icon={History}
            label="Historial"
            subtitle={`${library.history.length} reproducciones`}
            color={colors.accent}
            onPress={() => router.push('/history')}
            compact
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Pantalla del vehículo" subtitle="Vista panorámica" icon={Car} />
        <ShortcutTile
          icon={Car}
          label="Modo automotriz"
          subtitle="Tablero horizontal con reloj, clima y reproductor"
          color={colors.accent}
          onPress={openAuto}
          wide
        />
      </View>

      <View style={styles.section}>
        <ShortcutTile
          icon={Info}
          label="Acerca de Jeep Connect"
          subtitle="Integraciones, privacidad y créditos"
          color={colors.textSecondary}
          onPress={() => router.push('/settings/about')}
          wide
          compact
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
});
