import { Search, X, type LucideIcon } from 'lucide-react-native';
import { forwardRef, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/store/settings';

type TextFieldProps = TextInputProps & {
  icon?: LucideIcon;
  onClear?: () => void;
  right?: React.ReactNode;
};

export const TextField = forwardRef<ComponentRef<typeof TextInput>, TextFieldProps>(function TextField(
  { icon: Icon = Search, onClear, right, style, value, ...rest },
  ref,
) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.white,
          borderColor: colors.border,
        },
      ]}
    >
      <Icon size={18} color={colors.textMuted} strokeWidth={2} />
      <TextInput
        ref={ref}
        {...rest}
        value={value}
        style={[styles.input, { color: colors.text }, style]}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value ? (
        <X
          size={18}
          color={colors.textMuted}
          strokeWidth={2}
          onPress={onClear}
        />
      ) : (
        right
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 46,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
  },
});
