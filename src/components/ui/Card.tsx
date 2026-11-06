import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { layout, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { PressableScale } from '@/components/ui/PressableScale';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'accent' | 'green' | 'amber';
  borderless?: boolean;
};

export function Card({ children, style, padded = true, onPress, tone = 'default', borderless = false }: CardProps) {
  const { colors, isDark } = useTheme();
  const background =
    tone === 'accent'
      ? isDark
        ? 'rgba(28, 68, 130, 0.55)'
        : 'rgba(22, 99, 224, 0.08)'
      : tone === 'green'
        ? isDark
          ? 'rgba(20, 72, 54, 0.52)'
          : 'rgba(15, 157, 99, 0.08)'
        : tone === 'amber'
          ? isDark
            ? 'rgba(92, 66, 20, 0.48)'
            : 'rgba(184, 116, 5, 0.08)'
          : colors.surfaceGlass;

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: background,
          borderColor: borderless ? 'transparent' : colors.border,
          shadowColor: colors.shadow,
          padding: padded ? layout.cardPadding : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;
  return (
    <PressableScale onPress={onPress} scaleTo={0.985} accessibilityRole="button">
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
});

export function CardDivider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}
