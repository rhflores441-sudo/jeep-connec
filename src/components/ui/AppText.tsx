import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { fonts, typography, type Palette, type TypographyVariant } from '@/constants/theme';
import { useTheme } from '@/store/settings';

type ColorRole =
  | 'text'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'electric'
  | 'green'
  | 'amber'
  | 'danger'
  | 'white'
  | 'inherit';

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: ColorRole;
  align?: TextStyle['textAlign'];
  font?: keyof typeof fonts;
  style?: StyleProp<TextStyle>;
};

export function AppText({
  variant = 'body',
  color = 'text',
  align,
  font,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const colorValue = resolveColor(colors, color);
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        { color: colorValue },
        font ? { fontFamily: fonts[font] } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

function resolveColor(colors: Palette, role: ColorRole): string | undefined {
  switch (role) {
    case 'secondary':
      return colors.textSecondary;
    case 'muted':
      return colors.textMuted;
    case 'accent':
      return colors.accent;
    case 'electric':
      return colors.electric;
    case 'green':
      return colors.green;
    case 'amber':
      return colors.amber;
    case 'danger':
      return colors.danger;
    case 'white':
      return colors.white;
    case 'inherit':
      return undefined;
    default:
      return colors.text;
  }
}
