// Live Geolocation and Real-Time Weather Engine for SANJIVNI
// Uses Browser Geolocation API + Open-Meteo (zero API key, open-access, CORS-enabled) + Reverse Geocoding

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  weatherCode: number;
  iconType: 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'foggy' | 'stormy';
  humidity?: number;
  windSpeed?: number;
  isDay: boolean;
  lastUpdated: string;
}

export interface LocationData {
  coordinates: Coordinates;
  displayName: string;
  city: string;
  state: string;
  permission: 'prompt' | 'granted' | 'denied' | 'unsupported';
  isLiveGps: boolean;
}

// Default Fallback: Beltola, Guwahati, Assam (North-Eastern Region Core)
export const DEFAULT_NER_LOCATION: LocationData = {
  coordinates: {
    lat: 26.1445,
    lng: 91.7898,
  },
  displayName: 'Beltola, Guwahati, Assam',
  city: 'Guwahati',
  state: 'Assam',
  permission: 'prompt',
  isLiveGps: false,
};

export const DEFAULT_WEATHER: WeatherData = {
  temperature: 26,
  condition: 'Sunny & Pleasant',
  weatherCode: 0,
  iconType: 'sunny',
  humidity: 62,
  windSpeed: 8,
  isDay: true,
  lastUpdated: 'Just now',
};

// Map WMO Weather Interpretation Codes (WW) to friendly description & icon
export const mapWmoCodeToWeather = (
  code: number,
  isDay: boolean = true
): { condition: string; iconType: WeatherData['iconType'] } => {
  switch (code) {
    case 0:
      return { condition: isDay ? 'Sunny & Clear' : 'Clear Night', iconType: 'sunny' };
    case 1:
    case 2:
      return { condition: isDay ? 'Partly Cloudy' : 'Scattered Clouds', iconType: 'partly-cloudy' };
    case 3:
      return { condition: 'Overcast & Gentle', iconType: 'cloudy' };
    case 45:
    case 48:
      return { condition: 'Misty & Foggy', iconType: 'foggy' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Light Drizzle', iconType: 'rainy' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Passing Showers', iconType: 'rainy' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain Showers', iconType: 'rainy' };
    case 95:
    case 96:
    case 99:
      return { condition: 'Thunderstorm', iconType: 'stormy' };
    default:
      return { condition: 'Pleasant Weather', iconType: 'sunny' };
  }
};

/**
 * Reverse geocode latitude/longitude into human-readable city and neighborhood
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{ displayName: string; city: string; state: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.town;
      const city = addr.city || addr.town || addr.county || addr.state_district || 'Local Area';
      const state = addr.state || '';

      const parts = [suburb, city, state].filter(Boolean);
      const displayName = parts.length > 0 ? parts.join(', ') : `${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`;

      return {
        displayName,
        city,
        state,
      };
    }
  } catch (err) {
    console.warn('Reverse geocoding fallback triggered:', err);
  }

  // Fallback if network or rate limited
  return {
    displayName: `${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`,
    city: 'Current Location',
    state: '',
  };
}

/**
 * Fetch real-time weather from Open-Meteo for given coordinates
 */
export async function fetchLiveWeather(lat: number, lng: number): Promise<WeatherData> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,is_day,wind_speed_10m`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const current = data.current;
      if (current) {
        const isDay = current.is_day === 1;
        const mapped = mapWmoCodeToWeather(current.weather_code, isDay);
        const weather: WeatherData = {
          temperature: Math.round(current.temperature_2m),
          condition: mapped.condition,
          weatherCode: current.weather_code,
          iconType: mapped.iconType,
          humidity: Math.round(current.relative_humidity_2m),
          windSpeed: Math.round(current.wind_speed_10m),
          isDay,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        // Cache for offline/instant reload
        if (typeof window !== 'undefined') {
          localStorage.setItem('sanjivni_cached_weather', JSON.stringify(weather));
        }

        return weather;
      }
    }
  } catch (err) {
    console.warn('Live weather fetch error:', err);
  }

  // Use cached weather if available
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('sanjivni_cached_weather');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
  }

  return DEFAULT_WEATHER;
}

/**
 * Request device geolocation permission and obtain exact coordinates
 */
export function getDevicePosition(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}
