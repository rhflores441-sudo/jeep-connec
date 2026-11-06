import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/store/settings';
import { PressableScale } from '@/components/ui/PressableScale';

type IconButtonProps = {
  icon: LucideIcon;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  label: string;
  variant?: 'plain' | 'surface' | 'accent' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon: Icon,
  onPress,
  size = 42,
  iconSize = 20,
  label,
  variant = 'surface',
  disabled,
  loading,
  style,
}: IconButtonProps) {
  const { colors, isDark } = useTheme();
  const backgroundColor =
    variant === 'accent'
      ? colors.accent
      : variant === 'danger'
        ? colors.dangerSoft
        : variant === 'plain'
          ? 'transparent'
          : variant === 'outline'
            ? 'transparent'
            : isDark
              ? 'rgba(255, 255, 255, 0.06)'
              : 'rgba(10, 26, 51, 0.05)';
  const iconColor =
    variant === 'accent'
      ? colors.white
      : variant === 'danger'
        ? colors.danger
        : variant === 'plain'
          ? colors.textSecondary
          : colors.text;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      scaleTo={0.9}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderColor: variant === 'outline' ? colors.borderStrong : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <View pointerEvents="none">
          <Icon size={iconSize} color={iconColor} strokeWidth={2.1} />
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
});
