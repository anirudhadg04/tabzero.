import { ActivityRecommendation, WeatherData } from '../types';

export function interpretWeatherCode(code: number): { condition: string; isRain: boolean; isStorm: boolean; isClear: boolean } {
  // WMO Weather interpretation codes
  if (code === 0) return { condition: 'Clear Sky', isRain: false, isStorm: false, isClear: true };
  if (code === 1) return { condition: 'Mainly Clear', isRain: false, isStorm: false, isClear: true };
  if (code === 2) return { condition: 'Partly Cloudy', isRain: false, isStorm: false, isClear: false };
  if (code === 3) return { condition: 'Overcast', isRain: false, isStorm: false, isClear: false };
  if (code >= 45 && code <= 48) return { condition: 'Foggy / Hazy', isRain: false, isStorm: false, isClear: false };
  if (code >= 51 && code <= 55) return { condition: 'Drizzle', isRain: true, isStorm: false, isClear: false };
  if (code >= 61 && code <= 65) return { condition: 'Rain', isRain: true, isStorm: false, isClear: false };
  if (code >= 71 && code <= 77) return { condition: 'Snow fall', isRain: true, isStorm: false, isClear: false };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', isRain: true, isStorm: false, isClear: false };
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', isRain: true, isStorm: true, isClear: false };
  return { condition: 'Cloudy', isRain: false, isStorm: false, isClear: false };
}

export function generateRecommendations(weather: WeatherData | null): ActivityRecommendation[] {
  if (!weather) {
    return [
      {
        id: 'rec_default_1',
        title: 'Brisk Outdoor Walk',
        description: 'Step away from all devices and take a brief stroll outside.',
        pillar: 'MOVE',
        durationMinutes: 20,
        weatherTag: 'Fresh Air',
        icon: 'Footprints',
      },
      {
        id: 'rec_default_2',
        title: 'Physical Book Reading',
        description: 'Enjoy a chapter of a printed book or notebook.',
        pillar: 'DISCONNECT',
        durationMinutes: 30,
        weatherTag: 'Quiet Space',
        icon: 'BookOpen',
      },
      {
        id: 'rec_default_3',
        title: 'Face-to-Face Conversation',
        description: 'Catch up with a friend, family member, or colleague in person.',
        pillar: 'RECONNECT',
        durationMinutes: 45,
        weatherTag: 'Social Presence',
        icon: 'Users',
      },
    ];
  }

  const { temperature, precipitation, weatherCode } = weather;
  const { isRain, isStorm } = interpretWeatherCode(weatherCode);

  if (isStorm) {
    return [
      {
        id: 'rec_storm_1',
        title: 'Indoor Yoga & Stretching',
        description: 'Gentle mindful stretching accompanied by the sound of rain.',
        pillar: 'MOVE',
        durationMinutes: 25,
        weatherTag: 'Stormy / Indoors',
        icon: 'HeartHandshake',
      },
      {
        id: 'rec_storm_2',
        title: 'Pen & Paper Journaling',
        description: 'Write down 3 things you are grateful for today.',
        pillar: 'DISCONNECT',
        durationMinutes: 20,
        weatherTag: 'Stormy / Cozy',
        icon: 'PenTool',
      },
      {
        id: 'rec_storm_3',
        title: 'Brew Fresh Tea & Meditate',
        description: 'Sit in stillness and enjoy a warm beverage without checking notifications.',
        pillar: 'RECONNECT',
        durationMinutes: 15,
        weatherTag: 'Calm & Cozy',
        icon: 'Coffee',
      },
    ];
  }

  if (isRain || precipitation > 1.0) {
    return [
      {
        id: 'rec_rain_1',
        title: 'Indoor Bodyweight Workout',
        description: 'Energize with a quick 20-minute movement routine indoors.',
        pillar: 'MOVE',
        durationMinutes: 20,
        weatherTag: 'Rainy / Active',
        icon: 'Activity',
      },
      {
        id: 'rec_rain_2',
        title: 'Read a Paperback Novel',
        description: 'Immerse yourself in literature while rain falls outside.',
        pillar: 'DISCONNECT',
        durationMinutes: 45,
        weatherTag: 'Rainy / Peaceful',
        icon: 'BookOpen',
      },
      {
        id: 'rec_rain_3',
        title: 'Cook a Fresh Warm Recipe',
        description: 'Prepare a healthy homemade meal with full mindful focus.',
        pillar: 'RECONNECT',
        durationMinutes: 40,
        weatherTag: 'Indoor Creative',
        icon: 'Sparkles',
      },
    ];
  }

  if (temperature > 32) {
    return [
      {
        id: 'rec_hot_1',
        title: 'Shaded Gentle Walk',
        description: 'A light walk in shaded corridors with cool hydration.',
        pillar: 'MOVE',
        durationMinutes: 15,
        weatherTag: 'Warm / Shaded',
        icon: 'Footprints',
      },
      {
        id: 'rec_hot_2',
        title: 'Visit Local Library or Bookstore',
        description: 'Explore books in a quiet sanctuary away from digital distractions.',
        pillar: 'DISCONNECT',
        durationMinutes: 60,
        weatherTag: 'Cool Sanctuary',
        icon: 'Building2',
      },
      {
        id: 'rec_hot_3',
        title: 'Cold Brew Conversation',
        description: 'Meet someone for an iced drink without phones on the table.',
        pillar: 'RECONNECT',
        durationMinutes: 30,
        weatherTag: 'Social Refresh',
        icon: 'Coffee',
      },
    ];
  }

  if (temperature >= 18 && temperature <= 28) {
    // Pleasant weather!
    return [
      {
        id: 'rec_pleasant_1',
        title: 'Scenic Cycling or Jogging',
        description: 'Crisp, pleasant weather makes it ideal for a park bike ride or jog.',
        pillar: 'MOVE',
        durationMinutes: 40,
        weatherTag: 'Ideal Outdoor Weather',
        icon: 'Bike',
      },
      {
        id: 'rec_pleasant_2',
        title: 'Outdoor Park Reading',
        description: 'Sit under a tree with your favorite printed book in natural light.',
        pillar: 'DISCONNECT',
        durationMinutes: 45,
        weatherTag: 'Pleasant & Mild',
        icon: 'Trees',
      },
      {
        id: 'rec_pleasant_3',
        title: 'Neighborhood Walk & Talk',
        description: 'Invite a friend or neighbor for a stroll around the block.',
        pillar: 'RECONNECT',
        durationMinutes: 35,
        weatherTag: 'Community',
        icon: 'Footprints',
      },
    ];
  }

  // Sunny / general outdoor
  return [
    {
      id: 'rec_sunny_1',
      title: 'Outdoor Photography Walk',
      description: 'Capture nature and architectural details with your own eyes.',
      pillar: 'MOVE',
      durationMinutes: 30,
      weatherTag: 'Sunny & Clear',
      icon: 'Camera',
    },
    {
      id: 'rec_sunny_2',
      title: 'Sketch or Notebook Writing',
      description: 'Take a notebook outside to jot down thoughts and reflections.',
      pillar: 'DISCONNECT',
      durationMinutes: 30,
      weatherTag: 'Bright Day',
      icon: 'PenTool',
    },
    {
      id: 'rec_sunny_3',
      title: 'Tending to Plants & Nature',
      description: 'Watering green plants, gardening, and grounding in the earth.',
      pillar: 'RECONNECT',
      durationMinutes: 25,
      weatherTag: 'Nature Connect',
      icon: 'Flower2',
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
    console.warn('[OFFLINE Weather] ipapi.co failed, trying fallback:', e);
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
    console.warn('[OFFLINE Weather] freeipapi failed:', e);
  }

  // Safe default fallback
  return {
    latitude: 12.9716,
    longitude: 77.5946,
    city: 'Bengaluru, IN',
  };
}

export async function fetchOpenMeteoWeather(
  latitude?: number,
  longitude?: number,
  cityName?: string,
  cachedData: WeatherData | null = null
): Promise<WeatherData> {
  const now = Date.now();
  if (cachedData && (now - cachedData.fetchedAt < CACHE_DURATION_MS) && latitude && longitude) {
    return cachedData;
  }

  let finalLat = latitude;
  let finalLon = longitude;
  let finalCity = cityName;

  // If coordinates are missing or default, auto-detect location via IP without asking user permission!
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

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${finalLat}&longitude=${finalLon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1`;

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

    const { condition } = interpretWeatherCode(current.weather_code || 0);

    const weatherData: WeatherData = {
      temperature: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m),
      precipitation: current.precipitation || 0,
      weatherCode: current.weather_code || 0,
      windSpeed: Math.round(current.wind_speed_10m || 0),
      condition,
      city: finalCity,
      latitude: finalLat,
      longitude: finalLon,
      fetchedAt: now,
    };

    return weatherData;
  } catch (err) {
    clearTimeout(timeoutId);
    if (cachedData) {
      return cachedData;
    }
    throw err;
  }
}
