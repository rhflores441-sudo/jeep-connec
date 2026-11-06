import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  containerStyle?: StyleProp<ViewStyle>;
};

export function PressableScale({
  children,
  style,
  scaleTo = 0.96,
  containerStyle,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, containerStyle]}>
      <Pressable
        {...rest}
        disabled={disabled}
        onPressIn={(event) => {
          scale.value = withSpring(scaleTo, { damping: 18, stiffness: 320 });
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.value = withSpring(1, { damping: 18, stiffness: 320 });
          onPressOut?.(event);
        }}
        style={({ pressed }) => [style, disabled ? { opacity: 0.45 } : null, pressed ? { opacity: 0.92 } : null]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
