import { House, LayoutGrid, Map, Music, Radio, type LucideIcon } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius } from '@/constants/theme';
import { useTheme } from '@/store/settings';

function TabIcon({
  icon: Icon,
  focused,
  color,
}: {
  icon: LucideIcon;
  focused: boolean;
  color: ColorValue;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.iconWrap, focused ? { backgroundColor: colors.accentSoft } : null]}>
      <Icon size={21} color={color as string} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 4,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 10.5,
          letterSpacing: 0.2,
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={House} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Map} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="radio"
        options={{
          title: 'Radio',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Radio} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          title: 'Música',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Music} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Más',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={LayoutGrid} focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
