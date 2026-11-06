import type { ColorScheme, Palette } from '@/constants/theme';

const capitalize = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

export function formatTime(date: Date, options: { seconds?: boolean; hour12?: boolean } = {}): string {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      ...(options.seconds ? { second: '2-digit' } : null),
      hour12: options.hour12 ?? false,
    }).format(date);
  } catch {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return options.seconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
  }
}

export function formatDateLong(date: Date): string {
  try {
    return capitalize(
      new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(date),
    );
  } catch {
    return capitalize(
      `${['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][date.getDay()]} ${date.getDate()} de ${
        ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][date.getMonth()]
      }`,
    );
  }
}

export function formatDateShort(isoDate: string): string {
  const date = new Date(isoDate.length <= 10 ? `${isoDate}T12:00:00` : isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  try {
    return capitalize(new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric' }).format(date));
  } catch {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }
}

export function formatHour(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '--';
  return formatTime(date);
}

export function formatUpdatedAt(timestamp: number | null): string {
  if (!timestamp) return 'Sin actualizar';
  const diff = Math.max(0, Date.now() - timestamp);
  if (diff < 45_000) return 'Actualizado ahora';
  if (diff < 3_600_000) return `Actualizado hace ${Math.round(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Actualizado hace ${Math.round(diff / 3_600_000)} h`;
  return `Actualizado el ${new Date(timestamp).toLocaleDateString('es-MX')}`;
}

export function formatTemperature(celsius: number, units: 'metric' | 'imperial'): string {
  const value = units === 'metric' ? celsius : (celsius * 9) / 5 + 32;
  return `${Math.round(value)}°`;
}

export function temperatureUnit(units: 'metric' | 'imperial'): string {
  return units === 'metric' ? '°C' : '°F';
}

export function formatWind(kmh: number, units: 'metric' | 'imperial'): string {
  return units === 'metric' ? `${Math.round(kmh)} km/h` : `${Math.round(kmh * 0.621371)} mph`;
}

export function formatDistance(meters: number, units: 'metric' | 'imperial'): string {
  if (units === 'metric') {
    if (meters < 950) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
  }
  const feet = meters * 3.28084;
  if (feet < 950) return `${Math.round(feet)} ft`;
  const miles = meters / 1609.344;
  return `${miles.toFixed(miles < 10 ? 1 : 0)} mi`;
}

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export function formatSpeed(metersPerSecond: number | null | undefined, units: 'metric' | 'imperial'): number {
  const mps = Math.max(0, metersPerSecond ?? 0);
  const kmh = mps * 3.6;
  return Math.round(units === 'metric' ? kmh : kmh * 0.621371);
}

export function formatPlaybackTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatCoord(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(4)}° ${latitude >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? 'E' : 'O'}`;
  return `${lat}, ${lon}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Formato corto de temperatura sin unidad, para espacios reducidos. */
export function temperatureValue(celsius: number, units: 'metric' | 'imperial'): number {
  return Math.round(units === 'metric' ? celsius : (celsius * 9) / 5 + 32);
}

export function paletteScheme(isDark: boolean): ColorScheme {
  return isDark ? 'dark' : 'light';
}

export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function colorForScheme(palette: Palette, isDark: boolean): Palette {
  return isDark ? palette : palette;
}
