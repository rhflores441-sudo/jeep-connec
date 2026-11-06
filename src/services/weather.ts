import { API } from '@/constants/config';
import { ApiError, requestJson } from '@/utils/http';
import type { Coordinate } from '@/utils/geo';
import { describeWeather, type WeatherIconName } from '@/utils/weatherCodes';

export type CurrentWeather = {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  isDay: boolean;
  precipitation: number;
  weatherCode: number;
  condition: string;
  icon: WeatherIconName;
  windSpeed: number;
};

export type HourlyForecast = {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
  condition: string;
  icon: WeatherIconName;
};

export type DailyForecast = {
  date: string;
  weatherCode: number;
  max: number;
  min: number;
  precipitationProbability: number;
  sunrise: string;
  sunset: string;
  condition: string;
  icon: WeatherIconName;
};

export type WeatherData = {
  latitude: number;
  longitude: number;
  timezone: string;
  timezoneAbbreviation: string;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  fetchedAt: number;
};

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
  };
};

export async function fetchWeather(
  location: Coordinate,
  options: { signal?: AbortSignal } = {},
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: location.latitude.toFixed(4),
    longitude: location.longitude.toFixed(4),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    timezone: 'auto',
    forecast_days: '7',
    wind_speed_unit: 'kmh',
  });

  const data = await requestJson<OpenMeteoResponse>(`${API.weather}?${params.toString()}`, {
    signal: options.signal,
    timeoutMs: 12_000,
  });

  if (!data.current || !data.hourly || !data.daily) {
    throw new ApiError('El servicio del clima devolvió una respuesta incompleta.');
  }

  const currentDescriptor = describeWeather(data.current.weather_code, data.current.is_day === 1);

  const currentHourIndex = Math.max(
    0,
    data.hourly.time.findIndex((time) => time.slice(0, 13) >= data.current!.time.slice(0, 13)),
  );

  const hourly: HourlyForecast[] = data.hourly.time
    .slice(currentHourIndex, currentHourIndex + 24)
    .map((time, index) => {
      const sourceIndex = currentHourIndex + index;
      const code = data.hourly!.weather_code[sourceIndex] ?? 0;
      const isDay = Number(time.slice(11, 13)) >= 6 && Number(time.slice(11, 13)) < 19;
      const descriptor = describeWeather(code, isDay);
      return {
        time,
        temperature: data.hourly!.temperature_2m[sourceIndex] ?? 0,
        weatherCode: code,
        precipitationProbability: data.hourly!.precipitation_probability[sourceIndex] ?? 0,
        condition: descriptor.label,
        icon: descriptor.icon,
      };
    });

  const daily: DailyForecast[] = data.daily.time.map((date, index) => {
    const code = data.daily!.weather_code[index] ?? 0;
    const descriptor = describeWeather(code, true);
    return {
      date,
      weatherCode: code,
      max: data.daily!.temperature_2m_max[index] ?? 0,
      min: data.daily!.temperature_2m_min[index] ?? 0,
      precipitationProbability: data.daily!.precipitation_probability_max[index] ?? 0,
      sunrise: data.daily!.sunrise[index] ?? '',
      sunset: data.daily!.sunset[index] ?? '',
      condition: descriptor.label,
      icon: descriptor.icon,
    };
  });

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    timezoneAbbreviation: data.timezone_abbreviation,
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      isDay: data.current.is_day === 1,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      condition: currentDescriptor.label,
      icon: currentDescriptor.icon,
      windSpeed: data.current.wind_speed_10m,
    },
    hourly,
    daily,
    fetchedAt: Date.now(),
  };
}
