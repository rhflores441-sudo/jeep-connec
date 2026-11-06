import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '@/constants/theme';
import { useTheme } from '@/store/settings';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  bottomInset?: number;
  tabInset?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: { top?: boolean; bottom?: boolean };
};

export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  bottomInset,
  tabInset = false,
  refreshing = false,
  onRefresh,
  edges = { top: true, bottom: false },
}: ScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const resolvedBottom = bottomInset ?? (tabInset ? 108 : insets.bottom + 28);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }, style]}>
      <LinearGradient
        colors={
          isDark
            ? [colors.background, colors.backgroundAlt, colors.background]
            : [colors.background, colors.surfaceHigh, colors.background]
        }
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            backgroundColor: isDark ? 'rgba(47, 128, 255, 0.16)' : 'rgba(22, 99, 224, 0.10)',
          },
        ]}
      />
      <View
        style={[
          styles.content,
          {
            paddingTop: edges.top === false ? 0 : insets.top + 8,
            paddingBottom: resolvedBottom,
            paddingLeft: insets.left + layout.screenPadding,
            paddingRight: insets.right + layout.screenPadding,
          },
        ]}
      >
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.scrollContent, contentStyle]}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.accent}
                  colors={[colors.accent]}
                  progressBackgroundColor={colors.surface}
                />
              ) : undefined
            }
          >
            <View style={styles.inner}>{children}</View>
          </ScrollView>
        ) : (
          <View style={[styles.inner, styles.flex, contentStyle]}>{children}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  scrollContent: { flexGrow: 1 },
  inner: { width: '100%' },
  flex: { flex: 1 },
  glow: {
    position: 'absolute',
    top: -140,
    right: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.55,
  },
});
