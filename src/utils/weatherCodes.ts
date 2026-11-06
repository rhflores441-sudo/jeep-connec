export type WeatherIconName =
  | 'sun'
  | 'moon'
  | 'cloud-sun'
  | 'cloud-moon'
  | 'cloud'
  | 'cloud-fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'sleet'
  | 'storm';

export type WeatherDescriptor = {
  label: string;
  shortLabel: string;
  icon: WeatherIconName;
};

const DESCRIPTORS: Record<number, WeatherDescriptor> = {
  0: { label: 'Cielo despejado', shortLabel: 'Despejado', icon: 'sun' },
  1: { label: 'Mayormente despejado', shortLabel: 'Despejado', icon: 'sun' },
  2: { label: 'Parcialmente nublado', shortLabel: 'Parcial', icon: 'cloud-sun' },
  3: { label: 'Nublado', shortLabel: 'Nublado', icon: 'cloud' },
  45: { label: 'Niebla', shortLabel: 'Niebla', icon: 'cloud-fog' },
  48: { label: 'Niebla con escarcha', shortLabel: 'Niebla', icon: 'cloud-fog' },
  51: { label: 'Llovizna ligera', shortLabel: 'Llovizna', icon: 'drizzle' },
  53: { label: 'Llovizna moderada', shortLabel: 'Llovizna', icon: 'drizzle' },
  55: { label: 'Llovizna intensa', shortLabel: 'Llovizna', icon: 'drizzle' },
  56: { label: 'Llovizna helada', shortLabel: 'Llovizna', icon: 'sleet' },
  57: { label: 'Llovizna helada intensa', shortLabel: 'Llovizna', icon: 'sleet' },
  61: { label: 'Lluvia ligera', shortLabel: 'Lluvia', icon: 'rain' },
  63: { label: 'Lluvia moderada', shortLabel: 'Lluvia', icon: 'rain' },
  65: { label: 'Lluvia intensa', shortLabel: 'Lluvia', icon: 'rain' },
  66: { label: 'Lluvia helada', shortLabel: 'Lluvia', icon: 'sleet' },
  67: { label: 'Lluvia helada intensa', shortLabel: 'Lluvia', icon: 'sleet' },
  71: { label: 'Nevada ligera', shortLabel: 'Nieve', icon: 'snow' },
  73: { label: 'Nevada moderada', shortLabel: 'Nieve', icon: 'snow' },
  75: { label: 'Nevada intensa', shortLabel: 'Nieve', icon: 'snow' },
  77: { label: 'Granos de nieve', shortLabel: 'Nieve', icon: 'snow' },
  80: { label: 'Chubascos ligeros', shortLabel: 'Chubascos', icon: 'rain' },
  81: { label: 'Chubascos moderados', shortLabel: 'Chubascos', icon: 'rain' },
  82: { label: 'Chubascos fuertes', shortLabel: 'Chubascos', icon: 'rain' },
  85: { label: 'Chubascos de nieve', shortLabel: 'Nieve', icon: 'snow' },
  86: { label: 'Chubascos de nieve fuertes', shortLabel: 'Nieve', icon: 'snow' },
  95: { label: 'Tormenta eléctrica', shortLabel: 'Tormenta', icon: 'storm' },
  96: { label: 'Tormenta con granizo', shortLabel: 'Tormenta', icon: 'storm' },
  99: { label: 'Tormenta con granizo intenso', shortLabel: 'Tormenta', icon: 'storm' },
};

export function describeWeather(code: number | null | undefined, isDay = true): WeatherDescriptor {
  if (code === null || code === undefined) {
    return { label: 'Sin datos', shortLabel: 'Sin datos', icon: isDay ? 'cloud-sun' : 'cloud-moon' };
  }
  const descriptor = DESCRIPTORS[code] ?? { label: 'Condición desconocida', shortLabel: 'Variable', icon: 'cloud' };
  if (!isDay && descriptor.icon === 'sun') return { ...descriptor, icon: 'moon' };
  if (!isDay && descriptor.icon === 'cloud-sun') return { ...descriptor, icon: 'cloud-moon' };
  return descriptor;
}

export function weatherAccent(icon: WeatherIconName): 'amber' | 'electric' | 'muted' {
  if (icon === 'sun' || icon === 'cloud-sun') return 'amber';
  if (icon === 'storm' || icon === 'rain' || icon === 'drizzle' || icon === 'snow' || icon === 'sleet') return 'electric';
  return 'muted';
}
