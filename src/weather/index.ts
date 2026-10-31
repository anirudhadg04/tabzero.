import { ActivityRecommendation, FormattedWeather, WeatherCategory, WeatherData } from '../types';

export interface WmoInterpretation {
  condition: string;
  emoji: string;
  isRain: boolean;
  isStorm: boolean;
  isClear: boolean;
  isFog: boolean;
  isSnow: boolean;
}

/**
 * Maps Open-Meteo WMO weather codes strictly per official specification.
 * Distinguishes between daytime and nighttime visual presentation using isDay.
 */
export function interpretWmoWeatherCode(code: number, isDay: boolean = true): WmoInterpretation {
  switch (code) {
    case 0:
      return {
        condition: 'Clear',
        emoji: isDay ? '☀️' : '🌙',
        isRain: false,
        isStorm: false,
        isClear: true,
        isFog: false,
        isSnow: false,
      };
    case 1:
      return {
        condition: 'Mainly Clear',
        emoji: isDay ? '☀️' : '🌙',
        isRain: false,
        isStorm: false,
        isClear: true,
        isFog: false,
        isSnow: false,
      };
    case 2:
      return {
        condition: 'Partly Cloudy',
        emoji: isDay ? '⛅' : '☁️',
        isRain: false,
        isStorm: false,
        isClear: false,
        isFog: false,
        isSnow: false,
      };
    case 3:
      return {
        condition: 'Overcast',
        emoji: '☁️',
        isRain: false,
        isStorm: false,
        isClear: false,
        isFog: false,
        isSnow: false,
      };
    case 45:
    case 48:
      return {
        condition: 'Fog',
        emoji: '🌫️',
        isRain: false,
        isStorm: false,
        isClear: false,
        isFog: true,
        isSnow: false,
      };
    case 51:
    case 53:
    case 55:
      return {
        condition: 'Drizzle',
        emoji: isDay ? '🌦️' : '🌧️',
        isRain: true,
        isStorm: false,
        isClear: false,
        isFog: false,
        isSnow: false,
      };
    case 56:
    case 57:
      return {
        condition: 'Freezing Drizzle',
        emoji: '🌨️',
        isRain: true,
        isStorm: false,
        isClear: false,
        isFog: false,
        isSnow: true,
      };
    case 61:
    case 63:
    case 65:
      return {
        condition: 'Rain',
        emoji: '🌧️',
        isRain: true,
        isStorm: false,
        isClear: false,
        isFog: false,
        isSnow: false,
      };
    case 66:
    case 67:
      return {
        condition: 'Freezing Rain',
        emoji: '🌧️',
        isRain: true,
        isStorm: false,
        isClear: false,
        isFog: false,
        isSnow: true,
      };
    case 71:
    case 73:
    case 75:
      return {
        condition: 'Snowfall',
        emoji: '🌨️',
        isRain: false,
        isStorm: false,
        isClear: false,
        isFog: false,
        isSnow: true,
      };
    case 77:
      return {
        condition: 'Snow Grains',
        emoji: '🌨️',
        isRain: false,
        isStorm: false,
        isClear: false,
        isFog: false,
        isSnow: true,
      };
    case 80:
    case 81:
    case 82:
      return {
        condition: 'Rain Showers',
        emoji: isDay ? '🌦️' : '🌧️',
        isRain: true,
        isStorm: false,
        isClear: false,
        isFog: false,
        isSnow: false,
      };
    case 85:
    case 86:
      return {
        condition: 'Snow Showers',
        emoji: '🌨️',
        isRain: false,
        isStorm: false,
        isClear: false,
        isFog: false,
        isSnow: true,
      };
    case 95:
      return {
        condition: 'Thunderstorm',
        emoji: '⛈️',
        isRain: true,
        isStorm: true,
        isClear: false,
        isFog: false,
        isSnow: false,
      };
    case 96:
    case 99:
      return {
        condition: 'Thunderstorm with Hail',
        emoji: '⛈️',
        isRain: true,
        isStorm: true,
        isClear: false,
        isFog: false,
        isSnow: false,
      };
    default:
      return {
        condition: 'Cloudy',
        emoji: '☁️',
        isRain: false,
        isStorm: false,
        isClear: false,
        isFog: false,
        isSnow: false,
      };
  }
}

/**
 * Backward-compatible helper for legacy callers
 */
export function interpretWeatherCode(code: number): { condition: string; isRain: boolean; isStorm: boolean; isClear: boolean } {
  const interp = interpretWmoWeatherCode(code, true);
  return {
    condition: interp.condition,
    isRain: interp.isRain,
    isStorm: interp.isStorm,
    isClear: interp.isClear,
  };
}

/**
 * Evaluates weather conditions to determine offline activity category
 */
export function determineWeatherCategory(
  code: number,
  temp: number,
  precipitation: number,
  windSpeed: number
): WeatherCategory {
  if (code === 95 || code === 96 || code === 99) {
    return 'thunderstorm';
  }
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    precipitation > 0.5
  ) {
    return 'rain';
  }
  if (code === 45 || code === 48) {
    return 'fog';
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86 || temp < 5) {
    return 'cold';
  }
  if (temp > 30) {
    return 'very_hot';
  }
  if (temp >= 18 && temp <= 26 && (code === 0 || code === 1)) {
    return 'pleasant';
  }
  if (code === 0 || code === 1) {
    return 'clear';
  }
  return 'cloudy';
}

/**
 * Centralized weather normalization and formatting function.
 * Every UI component displaying weather MUST consume this object to ensure
 * absolute factual synchronization between temperature, condition text,
 * day/night state, and weather emoji.
 */
export function formatWeather(weather: WeatherData | null): FormattedWeather | null {
  if (
    !weather ||
    typeof weather.temperature !== 'number' ||
    isNaN(weather.temperature) ||
    typeof weather.weatherCode !== 'number' ||
    isNaN(weather.weatherCode)
  ) {
    return null;
  }

  const isDay = weather.isDay !== undefined ? weather.isDay : true;
  const interp = interpretWmoWeatherCode(weather.weatherCode, isDay);
  const temp = Math.round(weather.temperature);

  let obsTime = '';
  if (weather.fetchedAt) {
    try {
      const d = new Date(weather.fetchedAt);
      obsTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      obsTime = '';
    }
  }

  const category = determineWeatherCategory(
    weather.weatherCode,
    temp,
    weather.precipitation || 0,
    weather.windSpeed || 0
  );

  const isSafeForOutdoors =
    category !== 'thunderstorm' &&
    category !== 'rain' &&
    category !== 'fog' &&
    temp <= 36;

  return {
    temperatureText: `${temp}°C`,
    temperatureValue: temp,
    description: interp.condition,
    emoji: interp.emoji,
    displayText: `${interp.emoji} ${temp}°C · ${interp.condition}`,
    locationText: weather.city || 'Local Area',
    observationTimeText: obsTime,
    isDay,
    isCached: !!weather.isCached,
    weatherCode: weather.weatherCode,
    humidity: weather.humidity || 0,
    windSpeed: weather.windSpeed || 0,
    precipitation: weather.precipitation || 0,
    isSafeForOutdoors,
    weatherCategory: category,
  };
}

/**
 * Generates context-aware offline activity recommendations using actual live Open-Meteo weather.
 * Adheres strictly to safety protocols: NEVER recommends outdoor activities during thunderstorms or rain.
 */
export function generateRecommendations(weather: WeatherData | null): ActivityRecommendation[] {
  const formatted = formatWeather(weather);

  if (!formatted) {
    return [
      {
        id: 'rec_default_1',
        title: 'Brisk Neighborhood Walk',
        description: 'Step away from all devices and take a brief stroll outside.',
        pillar: 'MOVE',
        durationMinutes: 20,
        weatherTag: 'Fresh Air',
        icon: 'Footprints',
      },
      {
        id: 'rec_default_2',
        title: 'Paperback Book Reading',
        description: 'Enjoy a chapter of a printed book or notebook.',
        pillar: 'DISCONNECT',
        durationMinutes: 30,
        weatherTag: 'Quiet Space',
        icon: 'BookOpen',
      },
      {
        id: 'rec_default_3',
        title: 'In-Person Conversation',
        description: 'Catch up with a friend, family member, or colleague in person.',
        pillar: 'RECONNECT',
        durationMinutes: 45,
        weatherTag: 'Social Presence',
        icon: 'Users',
      },
    ];
  }

  // 1. Thunderstorm: Strict Safe Indoor Activities
  if (formatted.weatherCategory === 'thunderstorm') {
    return [
      {
        id: 'rec_storm_1',
        title: 'Indoor Yoga & Gentle Mobility',
        description: 'Mindful indoor stretching and core movement safely protected from lightning and rain.',
        pillar: 'MOVE',
        durationMinutes: 25,
        weatherTag: 'Safe Indoors',
        icon: 'HeartHandshake',
      },
      {
        id: 'rec_storm_2',
        title: 'Pen & Paper Journaling',
        description: 'Write down 3 things you are grateful for while listening to the distant thunder.',
        pillar: 'DISCONNECT',
        durationMinutes: 20,
        weatherTag: 'Cozy Indoors',
        icon: 'PenTool',
      },
      {
        id: 'rec_storm_3',
        title: 'Brew Fresh Tea & Meaningful Chat',
        description: 'Sit in stillness with a warm drink or enjoy an unhurried conversation indoors.',
        pillar: 'RECONNECT',
        durationMinutes: 30,
        weatherTag: 'Calm Sanctuary',
        icon: 'Coffee',
      },
    ];
  }

  // 2. Rain / Showers: Strict Safe Indoor Activities
  if (formatted.weatherCategory === 'rain') {
    return [
      {
        id: 'rec_rain_1',
        title: 'Indoor Bodyweight Routine',
        description: 'Energize with a quick 20-minute movement and mobility routine in your living space.',
        pillar: 'MOVE',
        durationMinutes: 20,
        weatherTag: 'Rainy Day Movement',
        icon: 'Activity',
      },
      {
        id: 'rec_rain_2',
        title: 'Indoor Reading or Journaling',
        description: 'Immerse yourself in printed literature or write personal reflections by the window.',
        pillar: 'DISCONNECT',
        durationMinutes: 45,
        weatherTag: 'Rainy / Peaceful',
        icon: 'BookOpen',
      },
      {
        id: 'rec_rain_3',
        title: 'Mindful Recipe Cooking',
        description: 'Prepare a warm homemade meal with full focus and share it phone-free.',
        pillar: 'RECONNECT',
        durationMinutes: 40,
        weatherTag: 'Cozy Kitchen',
        icon: 'Sparkles',
      },
    ];
  }

  // 3. Very Hot Weather (> 30°C): Indoor Activities
  if (formatted.weatherCategory === 'very_hot') {
    return [
      {
        id: 'rec_hot_1',
        title: 'Indoor Stretching & Cool Down',
        description: 'Gentle core stretching in a cool, shaded environment with cold hydration.',
        pillar: 'MOVE',
        durationMinutes: 20,
        weatherTag: 'Cool Indoors',
        icon: 'Activity',
      },
      {
        id: 'rec_hot_2',
        title: 'Air-Conditioned Library Visit',
        description: 'Explore quiet bookshelves in an air-conditioned library away from screens.',
        pillar: 'DISCONNECT',
        durationMinutes: 60,
        weatherTag: 'Cool Sanctuary',
        icon: 'Building2',
      },
      {
        id: 'rec_hot_3',
        title: 'Cold Brew Conversation',
        description: 'Meet someone for an iced drink indoors without smartphones on the table.',
        pillar: 'RECONNECT',
        durationMinutes: 35,
        weatherTag: 'Social Refresh',
        icon: 'Coffee',
      },
    ];
  }

  // 4. Pleasant Weather (18°C - 26°C, Clear/Mild): Prime Outdoor Activities
  if (formatted.weatherCategory === 'pleasant') {
    return [
      {
        id: 'rec_pleasant_1',
        title: 'Outdoor Photography Walk',
        description: 'Capture nature and architectural details with your own eyes in pleasant conditions.',
        pillar: 'MOVE',
        durationMinutes: 35,
        weatherTag: 'Pleasant & Mild',
        icon: 'Camera',
      },
      {
        id: 'rec_pleasant_2',
        title: 'Outdoor Park Reading',
        description: 'Sit under a tree with your favorite printed book in comfortable natural daylight.',
        pillar: 'DISCONNECT',
        durationMinutes: 45,
        weatherTag: 'Pleasant & Mild',
        icon: 'Trees',
      },
      {
        id: 'rec_pleasant_3',
        title: 'Neighborhood Stroll & Talk',
        description: 'Invite a friend or neighbor for a stroll in the pleasant breeze.',
        pillar: 'RECONNECT',
        durationMinutes: 30,
        weatherTag: 'Community Walk',
        icon: 'Footprints',
      },
    ];
  }

  // 5. Clear Weather: Morning walk & sunny activities
  if (formatted.weatherCategory === 'clear') {
    return [
      {
        id: 'rec_clear_1',
        title: 'Morning Walk',
        description: 'Take a brisk, energizing walk under clear open skies and absorb natural light.',
        pillar: 'MOVE',
        durationMinutes: 30,
        weatherTag: 'Clear & Bright',
        icon: 'Footprints',
      },
      {
        id: 'rec_clear_2',
        title: 'Outdoor Sketching or Journaling',
        description: 'Take a notebook outside to jot down reflections under clear natural lighting.',
        pillar: 'DISCONNECT',
        durationMinutes: 30,
        weatherTag: 'Clear Skies',
        icon: 'PenTool',
      },
      {
        id: 'rec_clear_3',
        title: 'Distraction-Free Park Meetup',
        description: 'Meet a friend outdoors for a grounded conversation without checking devices.',
        pillar: 'RECONNECT',
        durationMinutes: 35,
        weatherTag: 'Social Presence',
        icon: 'Users',
      },
    ];
  }

  // 6. Cloudy Weather: Nature walk or outdoor reading
  if (formatted.weatherCategory === 'cloudy') {
    return [
      {
        id: 'rec_cloudy_1',
        title: 'Nature Walk',
        description: 'Enjoy a peaceful walk under soft cloud cover without harsh glare or heat.',
        pillar: 'MOVE',
        durationMinutes: 35,
        weatherTag: 'Soft Clouds',
        icon: 'Trees',
      },
      {
        id: 'rec_cloudy_2',
        title: 'Outdoor Reading under Shaded Clouds',
        description: 'Gentle overcast daylight provides ideal glare-free conditions for book reading.',
        pillar: 'DISCONNECT',
        durationMinutes: 40,
        weatherTag: 'Glare-Free Reading',
        icon: 'BookOpen',
      },
      {
        id: 'rec_cloudy_3',
        title: 'Outdoor Walk & Talk',
        description: 'Take an unhurried walk with a companion in the cool, overcast air.',
        pillar: 'RECONNECT',
        durationMinutes: 30,
        weatherTag: 'Comfortable Walk',
        icon: 'Footprints',
      },
    ];
  }

  // 7. Fog / Cold / Other
  return [
    {
      id: 'rec_fog_1',
      title: 'Gentle Indoor Movement',
      description: 'Slow stretches and mindful movement in a cozy, warm environment.',
      pillar: 'MOVE',
      durationMinutes: 20,
      weatherTag: 'Gentle & Warm',
      icon: 'Activity',
    },
    {
      id: 'rec_fog_2',
      title: 'Quiet Offline Reflection',
      description: 'Enjoy a cup of warm tea and write in your journal away from screens.',
      pillar: 'DISCONNECT',
      durationMinutes: 30,
      weatherTag: 'Quiet Space',
      icon: 'BookOpen',
    },
    {
      id: 'rec_fog_3',
      title: 'Call an Old Friend',
      description: 'Have a meaningful voice conversation without browsing or multitasking.',
      pillar: 'RECONNECT',
      durationMinutes: 30,
      weatherTag: 'Social Connection',
      icon: 'Users',
    },
  ];
}

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 mins

/**
 * Automatically detects user location without requesting browser location permissions
 * Uses public IP-based geolocation lookup.
 */
export async function detectLocationWithoutPermission(): Promise<{ latitude: number; longitude: number; city: string }> {
  // Primary: ipapi.co
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const city = data.city ? `${data.city}, ${data.country_code || data.country_name || ''}`.trim() : 'Local';
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city,
        };
      }
    }
  } catch (e) {
    console.warn('[tabzero Weather] ipapi.co lookup failed, trying fallback:', e);
  }

  // Fallback: freeipapi.com
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const city = data.cityName ? `${data.cityName}, ${data.countryCode || ''}`.trim() : 'Local';
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city,
        };
      }
    }
  } catch (e) {
    console.warn('[tabzero Weather] freeipapi lookup failed:', e);
  }

  // Safe fallback default
  return {
    latitude: 12.9716,
    longitude: 77.5946,
    city: 'Bengaluru, IN',
  };
}

/**
 * Fetches current weather strictly from Open-Meteo Forecast API.
 * Retrieves all required fields: temperature_2m, weather_code, is_day,
 * relative_humidity_2m, precipitation, and wind_speed_10m.
 */
export async function fetchOpenMeteoWeather(
  latitude?: number,
  longitude?: number,
  cityName?: string,
  cachedData: WeatherData | null = null
): Promise<WeatherData> {
  const now = Date.now();
  if (
    cachedData &&
    now - cachedData.fetchedAt < CACHE_DURATION_MS &&
    latitude &&
    longitude
  ) {
    return {
      ...cachedData,
      isCached: true,
    };
  }

  let finalLat = latitude;
  let finalLon = longitude;
  let finalCity = cityName;

  // Auto-detect location via IP if coordinates are missing or default
  if (!finalLat || !finalLon || finalCity === 'Bangalore, IN' || finalCity === 'Bengaluru, IN') {
    try {
      const detected = await detectLocationWithoutPermission();
      finalLat = detected.latitude;
      finalLon = detected.longitude;
      finalCity = detected.city;
    } catch {
      finalLat = finalLat || 12.9716;
      finalLon = finalLon || 77.5946;
      finalCity = finalCity || 'Bengaluru, IN';
    }
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${finalLat}&longitude=${finalLon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day&forecast_days=1`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP error: ${res.status}`);
    }

    const json = await res.json();
    const current = json.current;
    if (!current) {
      throw new Error('Invalid Open-Meteo response structure');
    }

    const isDay = current.is_day === 1;
    const interp = interpretWmoWeatherCode(current.weather_code ?? 0, isDay);

    const weatherData: WeatherData = {
      temperature: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      precipitation: current.precipitation ?? 0,
      weatherCode: current.weather_code ?? 0,
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      condition: interp.condition,
      city: finalCity,
      latitude: finalLat,
      longitude: finalLon,
      fetchedAt: now,
      isDay,
      time: current.time,
      isCached: false,
    };

    return weatherData;
  } catch (err) {
    clearTimeout(timeoutId);
    if (cachedData) {
      return {
        ...cachedData,
        isCached: true,
      };
    }
    throw err;
  }
}
