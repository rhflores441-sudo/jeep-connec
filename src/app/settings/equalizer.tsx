import { AudioLines, Info, RotateCcw, SlidersHorizontal, TriangleAlert, Volume2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import {
  bandsMatchPreset,
  clampBand,
  EQ_FREQUENCIES,
  EQ_MAX,
  EQ_MIN,
  EQ_PRESETS,
  equalizerPresetLabel,
  formatBandValue,
} from '@/constants/equalizer';
import { useSettings, useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { Card, CardDivider } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Slider } from '@/components/ui/Slider';

const RANGE = EQ_MAX - EQ_MIN;
const STEP = 1 / RANGE;

export default function EqualizerSettingsScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings } = useSettings();

  const applyPreset = (presetId: string) => {
    const preset = EQ_PRESETS.find((candidate) => candidate.id === presetId);
    if (!preset) return;
    updateSettings({ equalizerPreset: preset.id, equalizerBands: [...preset.bands] });
  };

  const updateBand = (index: number, normalized: number) => {
    const next = settings.equalizerBands.map((value, position) =>
      position === index ? clampBand(EQ_MIN + normalized * RANGE) : value,
    );
    const matching = EQ_PRESETS.find((preset) => bandsMatchPreset(next, preset));
    updateSettings({ equalizerBands: next, equalizerPreset: matching?.id ?? 'custom' });
  };

  const reset = () => {
    updateSettings({ equalizerPreset: 'flat', equalizerBands: [...EQ_PRESETS[0].bands] });
  };

  return (
    <Screen>
      <Header
        title="Ecualizador"
        subtitle={`Preset: ${equalizerPresetLabel(settings.equalizerPreset)}`}
        right={<IconButton icon={RotateCcw} label="Restablecer ecualizador" onPress={reset} />}
      />

      <Card>
        <View style={styles.titleRow}>
          <View style={[styles.iconBubble, { backgroundColor: colors.accentSoft }]}>
            <AudioLines size={22} color={colors.accent} />
          </View>
          <View style={styles.titleText}>
            <AppText variant="bodyStrong">Curva de 7 bandas</AppText>
            <AppText variant="caption" color="muted">
              Ajusta cada banda entre {EQ_MIN} y +{EQ_MAX} dB. La preferencia se guarda en este
              dispositivo.
            </AppText>
          </View>
        </View>
        <CurvePreview bands={settings.equalizerBands} />
      </Card>

      <View style={styles.section}>
        <SectionHeader title="Presets" subtitle="Curvas predefinidas" icon={SlidersHorizontal} />
        <View style={styles.chips}>
          {EQ_PRESETS.map((preset) => (
            <Chip
              key={preset.id}
              label={preset.label}
              selected={settings.equalizerPreset === preset.id}
              onPress={() => applyPreset(preset.id)}
            />
          ))}
          <Chip label="Personalizado" selected={settings.equalizerPreset === 'custom'} onPress={() => undefined} />
        </View>
        <AppText variant="caption" color="muted">
          {EQ_PRESETS.find((preset) => preset.id === settings.equalizerPreset)?.description ??
            'Curva personalizada guardada con tus propios ajustes.'}
        </AppText>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Bandas" subtitle="Graves a la izquierda, agudos a la derecha" icon={AudioLines} />
        <Card>
          {settings.equalizerBands.map((band, index) => (
            <View
              key={EQ_FREQUENCIES[index]}
              style={[
                styles.bandRow,
                index === 0 ? null : { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
              ]}
            >
              <AppText variant="caption" color="secondary" font="semibold" style={styles.bandLabel}>
                {EQ_FREQUENCIES[index]}
              </AppText>
              <View style={styles.bandSlider}>
                <Slider
                  value={(band - EQ_MIN) / RANGE}
                  onChange={(value) => updateBand(index, value)}
                  step={STEP}
                  trackHeight={4}
                  hitHeight={30}
                  color={band >= 0 ? colors.accent : colors.amber}
                />
              </View>
              <AppText
                variant="caption"
                font="semibold"
                color={band === 0 ? 'muted' : band > 0 ? 'accent' : 'amber'}
                style={styles.bandValue}
              >
                {formatBandValue(band)}
              </AppText>
            </View>
          ))}
          <CardDivider />
          <View style={styles.scaleRow}>
            <AppText variant="micro" color="muted">
              {EQ_MIN} dB
            </AppText>
            <AppText variant="micro" color="muted">
              0 dB
            </AppText>
            <AppText variant="micro" color="muted">
              +{EQ_MAX} dB
            </AppText>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Volumen" subtitle="Nivel general guardado" icon={Volume2} />
        <Card>
          <View style={styles.volumeRow}>
            <Volume2 size={18} color={colors.textMuted} />
            <AppText variant="bodyStrong" style={styles.volumeLabel}>
              Volumen actual
            </AppText>
            <AppText variant="bodyStrong" color="accent">
              {Math.round(settings.volume * 100)}%
            </AppText>
          </View>
          <AppText variant="caption" color="muted">
            Cambia el volumen desde la tarjeta de reproducción o en Ajustes → Audio.
          </AppText>
        </Card>
      </View>

      <View style={[styles.warning, { backgroundColor: colors.amberSoft }]}>
        <TriangleAlert size={18} color={colors.amber} />
        <View style={styles.warningText}>
          <AppText variant="bodyStrong" color="amber">
            Sin procesamiento de audio simulado
          </AppText>
          <AppText variant="caption" color="amber">
            Expo/React Native no expone un ecualizador DSP nativo. Jeep Connect guarda tu curva y la
            muestra, pero no altera el audio de la radio ni de Spotify. Para aplicar el efecto se
            necesita un módulo nativo o un reproductor con DSP.
          </AppText>
        </View>
      </View>

      <View style={[styles.info, { backgroundColor: colors.accentSoft }]}>
        <Info size={16} color={colors.accent} />
        <AppText variant="caption" color="secondary" style={styles.infoText}>
          La curva se conserva entre sesiones y se incluye en la configuración local de la app.
        </AppText>
      </View>
    </Screen>
  );
}

function CurvePreview({ bands }: { bands: number[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.curve}>
      <View style={[styles.centerLine, { backgroundColor: colors.border }]} />
      {bands.map((band, index) => {
        const height = (Math.abs(band) / EQ_MAX) * 38;
        const positive = band >= 0;
        return (
          <View key={`${index}-${band}`} style={styles.curveColumn}>
            <View
              style={[
                styles.curveBar,
                {
                  height: Math.max(3, height),
                  top: positive ? 42 - height : 42,
                  backgroundColor: band === 0 ? colors.borderStrong : positive ? colors.accent : colors.amber,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconBubble: { width: 46, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  titleText: { flex: 1, gap: 2 },
  curve: { height: 84, flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, position: 'relative' },
  centerLine: { position: 'absolute', left: 0, right: 0, top: 41, height: StyleSheet.hairlineWidth },
  curveColumn: { flex: 1, height: 84, alignItems: 'center' },
  curveBar: { position: 'absolute', width: 12, borderRadius: 4 },
  section: { marginTop: spacing.xxl, gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  bandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8 },
  bandLabel: { width: 48 },
  bandSlider: { flex: 1 },
  bandValue: { width: 52, textAlign: 'right', fontVariant: ['tabular-nums'] },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  volumeLabel: { flex: 1 },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xxl,
  },
  warningText: { flex: 1, gap: 3 },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  infoText: { flex: 1 },
});
