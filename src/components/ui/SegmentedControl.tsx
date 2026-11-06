import { StyleSheet, View } from 'react-native';
import { radius } from '@/constants/theme';
import { useTheme } from '@/store/settings';
import { AppText } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  compact = false,
}: SegmentedControlProps<T>) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(10,26,51,0.05)',
          borderColor: colors.border,
        },
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onChange(option.value)}
            scaleTo={0.97}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.segment,
              compact ? styles.compact : null,
              selected
                ? {
                    backgroundColor: isDark ? colors.surfaceHigh : colors.white,
                    shadowColor: colors.shadow,
                    shadowOpacity: 0.16,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }
                : null,
            ]}
          >
            <AppText
              variant={compact ? 'caption' : 'bodyStrong'}
              color={selected ? 'text' : 'muted'}
              numberOfLines={1}
              style={styles.label}
            >
              {option.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { paddingVertical: 6 },
  label: { textAlign: 'center' },
});
