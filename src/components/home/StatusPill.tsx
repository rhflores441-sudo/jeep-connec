import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';

type StatusPillProps = {
  icon: LucideIcon;
  label: string;
  value?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'accent';
  compact?: boolean;
};

export function StatusPill({ icon: Icon, label, value, tone = 'default', compact = false }: StatusPillProps) {
  const { colors, isDark } = useTheme();
  const color =
    tone === 'good'
      ? colors.green
      : tone === 'warn'
        ? colors.amber
        : tone === 'bad'
          ? colors.danger
          : tone === 'accent'
            ? colors.accent
            : colors.textSecondary;

  return (
    <View
      style={[
        styles.pill,
        compact ? styles.compact : null,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.white,
          borderColor: colors.border,
        },
      ]}
    >
      <Icon size={compact ? 14 : 16} color={color} strokeWidth={2.2} />
      <View style={styles.textBlock}>
        <AppText variant="micro" color="muted" style={styles.label} numberOfLines={1}>
          {label.toUpperCase()}
        </AppText>
        {value ? (
          <AppText variant="caption" color={tone === 'default' ? 'text' : tone === 'accent' ? 'accent' : tone === 'good' ? 'green' : tone === 'warn' ? 'amber' : 'danger'} numberOfLines={1} font="semibold">
            {value}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  compact: { paddingVertical: 6, paddingHorizontal: 9, borderRadius: radius.sm },
  textBlock: { flexShrink: 1 },
  label: { fontSize: 8.5, letterSpacing: 0.7 },
});
