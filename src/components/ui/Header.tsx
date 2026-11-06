import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';

type HeaderProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
};

export function Header({ title, subtitle, right, onBack, showBack = true }: HeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {showBack ? (
          <IconButton
            icon={ChevronLeft}
            label="Volver"
            variant="surface"
            onPress={() => (onBack ? onBack() : router.back())}
          />
        ) : null}
        <View style={styles.titles}>
          <AppText variant="title" numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color="muted" numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titles: { flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  line: { height: StyleSheet.hairlineWidth, marginTop: 12, opacity: 0.7 },
});
