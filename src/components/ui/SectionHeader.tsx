import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
};

export function SectionHeader({ title, subtitle, actionLabel, onAction, icon: Icon }: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <View style={styles.titleRow}>
          {Icon ? <Icon size={16} color={colors.textSecondary} strokeWidth={2.2} /> : null}
          <AppText variant="micro" color="muted" style={styles.eyebrow}>
            {title.toUpperCase()}
          </AppText>
        </View>
        {subtitle ? (
          <AppText variant="caption" color="muted" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} scaleTo={0.94} accessibilityRole="button">
          <AppText variant="caption" color="accent">
            {actionLabel}
          </AppText>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  textBlock: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { letterSpacing: 1.4 },
  subtitle: { marginTop: 2 },
});
