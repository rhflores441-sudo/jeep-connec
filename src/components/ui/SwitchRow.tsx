import { StyleSheet, Switch, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';

type SwitchRowProps = {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: LucideIcon;
  disabled?: boolean;
  last?: boolean;
};

export function SwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
  icon: Icon,
  disabled,
  last,
}: SwitchRowProps) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.row,
        last ? null : { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
        disabled ? { opacity: 0.55 } : null,
      ]}
    >
      {Icon ? (
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,26,51,0.05)' },
          ]}
        >
          <Icon size={19} color={colors.textSecondary} strokeWidth={2} />
        </View>
      ) : null}
      <View style={styles.textBlock}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color="muted" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(10,26,51,0.16)', true: colors.accent }}
        thumbColor={colors.white}
        ios_backgroundColor={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(10,26,51,0.16)'}
      />
    </View>
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
});
