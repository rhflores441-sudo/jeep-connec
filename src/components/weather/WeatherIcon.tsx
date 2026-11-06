import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Cloudy,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';
import type { WeatherIconName } from '@/utils/weatherCodes';

const ICONS: Record<WeatherIconName, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  'cloud-sun': CloudSun,
  'cloud-moon': CloudMoon,
  cloud: Cloud,
  'cloud-fog': CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  sleet: Cloudy,
  storm: CloudLightning,
};

export function WeatherIcon({
  name,
  size = 24,
  color,
}: {
  name: WeatherIconName;
  size?: number;
  color: string;
}) {
  const Icon = ICONS[name] ?? Cloud;
  return <Icon size={size} color={color} strokeWidth={1.9} />;
}
