import type { TextStyle } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

export type Palette = {
  background: string;
  backgroundAlt: string;
  backgroundDeep: string;
  surface: string;
  surfaceHigh: string;
  surfaceGlass: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  electric: string;
  green: string;
  greenSoft: string;
  amber: string;
  amberSoft: string;
  danger: string;
  dangerSoft: string;
  white: string;
  black: string;
  overlay: string;
  tabBar: string;
  shadow: string;
  mapOverlay: string;
};

export const darkColors: Palette = {
  background: '#050B14',
  backgroundAlt: '#081628',
  backgroundDeep: '#03070D',
  surface: '#0B1829',
  surfaceHigh: '#10233A',
  surfaceGlass: 'rgba(11, 24, 41, 0.78)',
  border: 'rgba(124, 174, 255, 0.14)',
  borderStrong: 'rgba(124, 174, 255, 0.28)',
  text: '#F2F7FF',
  textSecondary: '#A8BCD7',
  textMuted: '#748AA6',
  accent: '#3B8CFF',
  accentStrong: '#2F80FF',
  accentSoft: 'rgba(59, 140, 255, 0.16)',
  electric: '#79C7FF',
  green: '#3DDC97',
  greenSoft: 'rgba(61, 220, 151, 0.14)',
  amber: '#FFC15E',
  amberSoft: 'rgba(255, 193, 94, 0.14)',
  danger: '#FF7A7A',
  dangerSoft: 'rgba(255, 122, 122, 0.14)',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(3, 8, 15, 0.72)',
  tabBar: 'rgba(5, 11, 20, 0.96)',
  shadow: '#000000',
  mapOverlay: 'rgba(5, 11, 20, 0.88)',
};

export const lightColors: Palette = {
  background: '#EEF3FA',
  backgroundAlt: '#E2EBF7',
  backgroundDeep: '#DCE7F5',
  surface: '#FFFFFF',
  surfaceHigh: '#F5F9FF',
  surfaceGlass: 'rgba(255, 255, 255, 0.86)',
  border: 'rgba(13, 41, 78, 0.10)',
  borderStrong: 'rgba(13, 41, 78, 0.20)',
  text: '#0A1A33',
  textSecondary: '#425878',
  textMuted: '#6B7E99',
  accent: '#1663E0',
  accentStrong: '#0B4FBF',
  accentSoft: 'rgba(22, 99, 224, 0.10)',
  electric: '#0B72E7',
  green: '#0F9D63',
  greenSoft: 'rgba(15, 157, 99, 0.12)',
  amber: '#B87405',
  amberSoft: 'rgba(184, 116, 5, 0.12)',
  danger: '#D64545',
  dangerSoft: 'rgba(214, 69, 69, 0.10)',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(255, 255, 255, 0.72)',
  tabBar: 'rgba(255, 255, 255, 0.94)',
  shadow: '#12335F',
  mapOverlay: 'rgba(255, 255, 255, 0.92)',
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  display: 'Inter_800ExtraBold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  xxl: 32,
  pill: 999,
} as const;

export const typography = {
  display: {
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.5,
  },
  hero: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
  },
  bodyStrong: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  micro: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.1,
  },
  mono: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;

export const layout = {
  screenPadding: 18,
  cardPadding: 18,
  tabBarHeight: 66,
  maxContentWidth: 1180,
  autoPadding: 22,
  autoGap: 14,
} as const;
