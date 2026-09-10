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

// Predefined major landmarks for instant offline reverse lookup (All 8 NER States + Major Indian Centers)
export interface KnownLandmark {
  displayName: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export const NER_STATE_CAPITALS: Record<string, KnownLandmark> = {
  arunachal: { displayName: 'Itanagar, Arunachal Pradesh', city: 'Itanagar', state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053 },
  assam: { displayName: 'Dispur, Guwahati, Assam', city: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7898 },
  manipur: { displayName: 'Imphal, Manipur', city: 'Imphal', state: 'Manipur', lat: 24.8170, lng: 93.9368 },
  meghalaya: { displayName: 'Shillong, Meghalaya', city: 'Shillong', state: 'Meghalaya', lat: 25.5788, lng: 91.8933 },
  mizoram: { displayName: 'Aizawl, Mizoram', city: 'Aizawl', state: 'Mizoram', lat: 23.7271, lng: 92.7176 },
  nagaland: { displayName: 'Kohima, Nagaland', city: 'Kohima', state: 'Nagaland', lat: 25.6751, lng: 94.1086 },
  sikkim: { displayName: 'Gangtok, Sikkim', city: 'Gangtok', state: 'Sikkim', lat: 27.3389, lng: 88.6065 },
  tripura: { displayName: 'Agartala, Tripura', city: 'Agartala', state: 'Tripura', lat: 23.8315, lng: 91.2868 },
};

export const KNOWN_LOCATIONS: KnownLandmark[] = [
  // North-Eastern Region Hubs
  { displayName: 'Beltola, Guwahati, Assam', city: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7898 },
  { displayName: 'Dispur, Guwahati, Assam', city: 'Guwahati', state: 'Assam', lat: 26.1520, lng: 91.7940 },
  { displayName: 'Dibrugarh, Assam', city: 'Dibrugarh', state: 'Assam', lat: 27.4728, lng: 94.9120 },
  { displayName: 'Silchar, Assam', city: 'Silchar', state: 'Assam', lat: 24.8333, lng: 92.7789 },
  { displayName: 'Jorhat, Assam', city: 'Jorhat', state: 'Assam', lat: 26.7509, lng: 94.2037 },
  { displayName: 'Tezpur, Assam', city: 'Tezpur', state: 'Assam', lat: 26.6528, lng: 92.7926 },
  { displayName: 'Itanagar, Arunachal Pradesh', city: 'Itanagar', state: 'Arunachal Pradesh', lat: 27.0844, lng: 93.6053 },
  { displayName: 'Tawang, Arunachal Pradesh', city: 'Tawang', state: 'Arunachal Pradesh', lat: 27.5861, lng: 91.8594 },
  { displayName: 'Pasighat, Arunachal Pradesh', city: 'Pasighat', state: 'Arunachal Pradesh', lat: 28.0667, lng: 95.3333 },
  { displayName: 'Imphal, Manipur', city: 'Imphal', state: 'Manipur', lat: 24.8170, lng: 93.9368 },
  { displayName: 'Churachandpur, Manipur', city: 'Churachandpur', state: 'Manipur', lat: 24.3333, lng: 93.6667 },
  { displayName: 'Shillong, Meghalaya', city: 'Shillong', state: 'Meghalaya', lat: 25.5788, lng: 91.8933 },
  { displayName: 'Tura, Meghalaya', city: 'Tura', state: 'Meghalaya', lat: 25.5138, lng: 90.2202 },
  { displayName: 'Aizawl, Mizoram', city: 'Aizawl', state: 'Mizoram', lat: 23.7271, lng: 92.7176 },
  { displayName: 'Lunglei, Mizoram', city: 'Lunglei', state: 'Mizoram', lat: 22.8833, lng: 92.7333 },
  { displayName: 'Kohima, Nagaland', city: 'Kohima', state: 'Nagaland', lat: 25.6751, lng: 94.1086 },
  { displayName: 'Dimapur, Nagaland', city: 'Dimapur', state: 'Nagaland', lat: 25.9094, lng: 93.7266 },
  { displayName: 'Gangtok, Sikkim', city: 'Gangtok', state: 'Sikkim', lat: 27.3389, lng: 88.6065 },
  { displayName: 'Namchi, Sikkim', city: 'Namchi', state: 'Sikkim', lat: 27.1667, lng: 88.3500 },
  { displayName: 'Agartala, Tripura', city: 'Agartala', state: 'Tripura', lat: 23.8315, lng: 91.2868 },
  { displayName: 'Udaipur, Tripura', city: 'Udaipur', state: 'Tripura', lat: 23.5333, lng: 91.4833 },
  // Major Indian Cities
  { displayName: 'New Delhi, Delhi', city: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { displayName: 'Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { displayName: 'Mumbai, Maharashtra', city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { displayName: 'Bengaluru, Karnataka', city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { displayName: 'Chennai, Tamil Nadu', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { displayName: 'Hyderabad, Telangana', city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { displayName: 'Pune, Maharashtra', city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { displayName: 'Patna, Bihar', city: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { displayName: 'Lucknow, Uttar Pradesh', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { displayName: 'Jaipur, Rajasthan', city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { displayName: 'Ahmedabad, Gujarat', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { displayName: 'Bhubaneswar, Odisha', city: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { displayName: 'Chandigarh', city: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { displayName: 'Dehradun, Uttarakhand', city: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
];

/**
 * Check if a string looks like raw numerical coordinates or a generic placeholder
 */
export function isCoordinateString(text: string | null | undefined): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (
    trimmed === '' ||
    trimmed.toLowerCase() === 'current location' ||
    trimmed.toLowerCase() === 'unknown location' ||
    trimmed.toLowerCase() === 'local area'
  ) {
    return true;
  }
  // Matches "26.144°N, 91.789°E", "26.1445, 91.7898", "-33.8688, 151.2093", "26.144° N, 91.789° E"
  if (/^\s*-?\d+(\.\d+)?\s*°?\s*[NSEW]?\s*,\s*-?\d+(\.\d+)?\s*°?\s*[NSEW]?\s*$/i.test(trimmed)) {
    return true;
  }
  // Matches any string containing degrees with N/S/E/W
  if (/\d+\.\d+°\s*[NSEW]/i.test(trimmed)) {
    return true;
  }
  // Matches standalone coordinate pairs
  if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Instant deterministic nearest known city calculation (0ms, 100% offline resilient)
 */
export function findNearestKnownCity(lat: number, lng: number): { displayName: string; city: string; state: string } {
  let closest = KNOWN_LOCATIONS[0];
  let minDistanceSq = Infinity;

  for (const loc of KNOWN_LOCATIONS) {
    const dLat = loc.lat - lat;
    const dLng = loc.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closest = loc;
    }
  }

  const distDeg = Math.sqrt(minDistanceSq);
  // If reasonably close (< 60km), use direct name; otherwise indicate vicinity
  const prefix = distDeg > 0.6 ? 'Near ' : '';

  return {
    displayName: `${prefix}${closest.displayName}`,
    city: closest.city,
    state: closest.state,
  };
}

/**
 * Ensure a location object is always presented as a clean, human-readable name,
 * never numerical coordinates or raw GPS degrees.
 */
export function formatFriendlyLocation(
  location?: LocationData | null,
  fallbackRegionName?: string
): string {
  if (!location) {
    return fallbackRegionName || DEFAULT_NER_LOCATION.displayName;
  }

  // 1. If displayName is already a valid human-readable name
  if (location.displayName && !isCoordinateString(location.displayName)) {
    return location.displayName;
  }

  // 2. If city and state are valid human-readable strings
  if (location.city && !isCoordinateString(location.city)) {
    if (location.state && !isCoordinateString(location.state) && location.state !== location.city) {
      return `${location.city}, ${location.state}`;
    }
    return location.city;
  }

  // 3. Fall back to nearest known Indian/NER city from coordinates
  if (
    location.coordinates &&
    typeof location.coordinates.lat === 'number' &&
    typeof location.coordinates.lng === 'number'
  ) {
    const nearest = findNearestKnownCity(location.coordinates.lat, location.coordinates.lng);
    if (nearest?.displayName) {
      return nearest.displayName;
    }
  }

  return fallbackRegionName || DEFAULT_NER_LOCATION.displayName;
}

/**
 * High-performance reverse geocoder:
 * 1. BigDataCloud Client Reverse Geocode (free, CORS-enabled, ~500ms, accurate locality & city)
 * 2. OpenStreetMap Nominatim (secondary fallback)
 * 3. Nearest known city calculation (instant offline fallback, NEVER returns raw coordinates)
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ displayName: string; city: string; state: string }> {
  // Method 1: BigDataCloud Client API (Designed specifically for client-side web apps)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || '';
      const city = data.city || '';
      const state = data.principalSubdivision || '';

      // Collect unique parts in order: locality, city, state
      const rawParts = [locality, city, state].filter(Boolean);
      const uniqueParts = rawParts.filter((item, idx) => rawParts.indexOf(item) === idx);

      if (uniqueParts.length > 0) {
        const resolvedCity = city || locality || uniqueParts[0];
        return {
          displayName: uniqueParts.join(', '),
          city: resolvedCity,
          state,
        };
      }
    }
  } catch (bdcErr) {
    console.warn('BigDataCloud reverse geocode warning:', bdcErr);
  }

  // Method 2: OpenStreetMap Nominatim (Secondary fallback)
  try {
    const nomController = new AbortController();
    const nomTimeoutId = setTimeout(() => nomController.abort(), 3000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      {
        signal: nomController.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    clearTimeout(nomTimeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.quarter;
      const city = addr.city || addr.town || addr.municipality || addr.county || addr.state_district;
      const state = addr.state || '';

      const rawParts = [suburb, city, state].filter(Boolean);
      const uniqueParts = rawParts.filter((item, idx) => rawParts.indexOf(item) === idx);

      if (uniqueParts.length > 0) {
        const resolvedCity = city || suburb || uniqueParts[0];
        return {
          displayName: uniqueParts.join(', '),
          city: resolvedCity,
          state,
        };
      }
    }
  } catch (nomErr) {
    console.warn('Nominatim reverse geocode fallback warning:', nomErr);
  }

  // Method 3: Deterministic offline nearest city (NEVER returns coordinates)
  return findNearestKnownCity(lat, lng);
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
