import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';

type ShortcutTileProps = {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  color?: string;
  onPress: () => void;
  badge?: string | null;
  compact?: boolean;
  wide?: boolean;
};

export function ShortcutTile({
  icon: Icon,
  label,
  subtitle,
  color,
  onPress,
  badge,
  compact = false,
  wide = false,
}: ShortcutTileProps) {
  const { colors, isDark } = useTheme();
  const tint = color ?? colors.accent;
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.955}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.tile,
        wide ? styles.wide : null,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.055)' : colors.white,
          borderColor: colors.border,
          padding: compact ? spacing.md : spacing.lg,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconBubble,
            {
              backgroundColor: tint,
              width: compact ? 36 : 42,
              height: compact ? 36 : 42,
              borderRadius: compact ? 11 : 14,
            },
          ]}
        >
          <Icon size={compact ? 18 : 21} color={colors.white} strokeWidth={2} />
        </View>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
            <AppText variant="micro" color="accent" style={styles.badgeText}>
              {badge}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.bottom}>
        <AppText variant={compact ? 'bodyStrong' : 'subtitle'} numberOfLines={1}>
          {label}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 104,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  wide: { flexBasis: '100%' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBubble: { alignItems: 'center', justifyContent: 'center' },
  bottom: { gap: 1 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: 9, letterSpacing: 0.4 },
});
