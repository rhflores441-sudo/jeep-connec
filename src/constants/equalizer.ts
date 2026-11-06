export type EqualizerPreset = {
  id: string;
  label: string;
  description: string;
  bands: number[];
};

/** Frecuencias orientativas de las 7 bandas guardadas por Jeep Connect. */
export const EQ_FREQUENCIES = ['60 Hz', '150 Hz', '400 Hz', '1 kHz', '2.4 kHz', '6 kHz', '15 kHz'] as const;

export const EQ_MIN = -8;
export const EQ_MAX = 8;

export const EQ_PRESETS: EqualizerPreset[] = [
  {
    id: 'flat',
    label: 'Plano',
    description: 'Sin realce; respuesta neutra.',
    bands: [0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: 'music',
    label: 'Música',
    description: 'Curva suave con más presencia en medios y agudos.',
    bands: [2, 1, 0, 1, 2, 3, 3],
  },
  {
    id: 'voice',
    label: 'Voz',
    description: 'Claridad para llamadas y podcasts.',
    bands: [-2, -1, 0, 2, 3, 3, 2],
  },
  {
    id: 'bass',
    label: 'Graves',
    description: 'Refuerzo de bajos para carretera.',
    bands: [5, 4, 2, 0, -1, -1, -2],
  },
  {
    id: 'treble',
    label: 'Agudos',
    description: 'Más detalle en instrumentos y voces.',
    bands: [-2, -1, 0, 1, 3, 4, 5],
  },
  {
    id: 'v-shape',
    label: 'Curva V',
    description: 'Graves y agudos realzados, medios suaves.',
    bands: [4, 3, 1, -1, 2, 4, 5],
  },
];

export function findEqualizerPreset(id: string): EqualizerPreset | null {
  return EQ_PRESETS.find((preset) => preset.id === id) ?? null;
}

export function equalizerPresetLabel(id: string): string {
  return findEqualizerPreset(id)?.label ?? 'Personalizado';
}

export function clampBand(value: number): number {
  return Math.max(EQ_MIN, Math.min(EQ_MAX, Math.round(value)));
}

export function bandsMatchPreset(bands: number[], preset: EqualizerPreset): boolean {
  return preset.bands.every((band, index) => band === bands[index]);
}

export function formatBandValue(value: number): string {
  return value === 0 ? '0 dB' : `${value > 0 ? '+' : ''}${value} dB`;
}
