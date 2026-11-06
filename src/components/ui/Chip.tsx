import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  compact?: boolean;
};

export function Chip({ label, selected = false, onPress, icon, compact = false }: ChipProps) {
  const { colors, isDark } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.accent : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(10,26,51,0.04)',
          borderColor: selected ? colors.accent : colors.border,
          paddingVertical: compact ? 6 : 9,
          paddingHorizontal: compact ? 10 : spacing.md,
        },
      ]}
    >
      {icon}
      <AppText variant="caption" color={selected ? 'white' : 'secondary'} font="semibold">
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
