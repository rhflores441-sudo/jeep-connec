import { CircleAlert, Inbox, RefreshCw, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';

export function LoadingState({ label = 'Cargando…', compact = false }: { label?: string; compact?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.state, compact ? styles.compact : null]}>
      <ActivityIndicator size="small" color={colors.accent} />
      <AppText variant="caption" color="muted" align="center">
        {label}
      </AppText>
    </View>
  );
}

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
};

export function ErrorState({ message, onRetry, retryLabel = 'Reintentar', compact = false }: ErrorStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.state, compact ? styles.compact : null]}>
      <View style={[styles.iconBubble, { backgroundColor: colors.dangerSoft }]}>
        <CircleAlert size={22} color={colors.danger} strokeWidth={2} />
      </View>
      <AppText variant="caption" color="secondary" align="center">
        {message}
      </AppText>
      {onRetry ? (
        <PressableScale
          onPress={onRetry}
          accessibilityRole="button"
          style={[styles.retry, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}
        >
          <RefreshCw size={14} color={colors.accent} strokeWidth={2.2} />
          <AppText variant="caption" color="accent">
            {retryLabel}
          </AppText>
        </PressableScale>
      ) : null}
    </View>
  );
}

type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({ title, message, icon: Icon = Inbox, action, compact = false }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.state, compact ? styles.compact : null]}>
      <View style={[styles.iconBubble, { backgroundColor: colors.accentSoft }]}>
        <Icon size={22} color={colors.accent} strokeWidth={2} />
      </View>
      <AppText variant="bodyStrong" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="caption" color="muted" align="center">
          {message}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  compact: { paddingVertical: spacing.lg },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    marginTop: 4,
  },
});
