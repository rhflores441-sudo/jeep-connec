import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBackground?: string;
  right?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
  danger?: boolean;
  last?: boolean;
};

export function ListRow({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  iconBackground,
  right,
  onPress,
  showChevron = Boolean(onPress),
  disabled,
  danger,
  last,
}: ListRowProps) {
  const { colors, isDark } = useTheme();
  const content = (
    <View style={[styles.row, last ? null : { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      {Icon ? (
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor:
                iconBackground ?? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,26,51,0.05)'),
            },
          ]}
        >
          <Icon size={19} color={iconColor ?? (danger ? colors.danger : colors.textSecondary)} strokeWidth={2} />
        </View>
      ) : null}
      <View style={styles.textBlock}>
        <AppText variant="bodyStrong" color={danger ? 'danger' : 'text'} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="muted" numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>
        {right}
        {showChevron ? <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} /> : null}
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.99}
      accessibilityRole="button"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 58,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  subtitle: { marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
