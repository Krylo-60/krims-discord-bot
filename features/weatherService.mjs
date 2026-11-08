// ═══════════════════════════════════════════════════════════════════════════════
// 🌦️ KRIMS CODE GLOBAL REAL-TIME WEATHER RADAR & METEOROLOGICAL ENGINE
// Dual-Stage Geocoding (Open-Meteo + Photon Fuzzy OSM) + Live Open-Meteo API
// 100% Free, Zero-API-Key, Resilient to Typos & Transliterations
// ═══════════════════════════════════════════════════════════════════════════════

export const WMO_WEATHER_CODES = {
  0: { desc: 'Clear sky', icon: '☀️' },
  1: { desc: 'Mainly clear', icon: '🌤️' },
  2: { desc: 'Partly cloudy', icon: '⛅' },
  3: { desc: 'Overcast', icon: '☁️' },
  45: { desc: 'Fog', icon: '🌫️' },
  48: { desc: 'Depositing rime fog', icon: '🌫️' },
  51: { desc: 'Light drizzle', icon: '🌦️' },
  53: { desc: 'Moderate drizzle', icon: '🌦️' },
  55: { desc: 'Dense drizzle', icon: '🌧️' },
  56: { desc: 'Light freezing drizzle', icon: '🌧️❄️' },
  57: { desc: 'Dense freezing drizzle', icon: '🌧️❄️' },
  61: { desc: 'Slight rain', icon: '🌦️' },
  63: { desc: 'Moderate rain', icon: '🌧️' },
  65: { desc: 'Heavy rain', icon: '🌧️' },
  66: { desc: 'Light freezing rain', icon: '🌧️❄️' },
  67: { desc: 'Heavy freezing rain', icon: '🌧️❄️' },
  71: { desc: 'Slight snowfall', icon: '🌨️' },
  73: { desc: 'Moderate snowfall', icon: '❄️' },
  75: { desc: 'Heavy snowfall', icon: '❄️⛄' },
  77: { desc: 'Snow grains', icon: '❄️' },
  80: { desc: 'Slight rain showers', icon: '🌦️' },
  81: { desc: 'Moderate rain showers', icon: '🌧️' },
  82: { desc: 'Violent rain showers', icon: '⛈️' },
  85: { desc: 'Slight snow showers', icon: '🌨️' },
  86: { desc: 'Heavy snow showers', icon: '❄️' },
  95: { desc: 'Thunderstorm', icon: '⛈️' },
  96: { desc: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { desc: 'Thunderstorm with heavy hail', icon: '⛈️' }
};

/**
 * Extracts a candidate city or geographical query from natural chat messages.
 * Matches phrases like "weather in Mangulure", "temp for Tokyo", "London forecast", etc.
 */
export function extractWeatherQueryCity(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();
  const patterns = [
    /(?:weather|forecast|temperature|temp|climate|conditions)\s+(?:in|for|at|of)?\s*([^?!.,\n]+)/i,
    /(?:how(?:'s|\s+is)\s+(?:the\s+)?weather\s+(?:like\s+)?in)\s+([^?!.,\n]+)/i,
    /(?:is\s+it\s+(?:raining|snowing|sunny|cold|hot|warm)\s+in)\s+([^?!.,\n]+)/i,
    /(?:what(?:'s|\s+is)\s+(?:the\s+)?(?:weather|temp|temperature)\s+(?:like\s+)?in)\s+([^?!.,\n]+)/i,
    /([a-zA-Z\s.-]+?)\s+(?:weather|forecast|temperature|temp)/i
  ];
  for (const pat of patterns) {
    const m = clean.match(pat);
    if (m && m[1]) {
      let loc = m[1].replace(/\b(today|tomorrow|now|right now|currently|outside|please|thanks|bro|bot|krims|krims code|tell me|give me|check|what is|whats|what's|how is|hows|how's|can you tell me|can u tell me)\b/gi, '').trim();
      loc = loc.replace(/^[,\s]+|[,\s]+$/g, '');
      if (loc.length >= 2 && !/^(the|a|an|it|this|that|my|is|in|of|for|at|like|to)$/i.test(loc)) {
        return loc;
      }
    }
  }
  return null;
}

const BOT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KrimsCodeBot/6.0 (Discord; +https://krims-bot-dashboard.vercel.app; support@krimscode.org)';

/**
 * Fallback to wttr.in JSON API.
 * Highly reliable, works for any city/country globally without requiring explicit geocoding coordinates.
 */
async function fetchWttrInWeather(city) {
  try {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': BOT_USER_AGENT,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const curr = data.current_condition?.[0];
    if (!curr) return null;

    const area = data.nearest_area?.[0];
    const placeName = [
      area?.areaName?.[0]?.value,
      area?.region?.[0]?.value,
      area?.country?.[0]?.value
    ].filter(Boolean).join(', ') || city;

    const tempC = parseFloat(curr.temp_C);
    const tempF = parseFloat(curr.temp_F) || Math.round(((tempC * 9/5) + 32) * 10) / 10;
    const feelsC = parseFloat(curr.FeelsLikeC);
    const feelsF = parseFloat(curr.FeelsLikeF) || Math.round(((feelsC * 9/5) + 32) * 10) / 10;
    const humidity = parseInt(curr.humidity, 10);
    const windKm = parseFloat(curr.windspeedKmph);
    const windMph = parseFloat(curr.windspeedMiles) || Math.round(windKm * 0.621371 * 10) / 10;
    const cond = curr.weatherDesc?.[0]?.value || 'Clear';

    let icon = '🌤️';
    const cLower = cond.toLowerCase();
    if (cLower.includes('thunder') || cLower.includes('storm')) icon = '⛈️';
    else if (cLower.includes('snow') || cLower.includes('blizzard') || cLower.includes('ice')) icon = '🌨️';
    else if (cLower.includes('heavy rain') || cLower.includes('torrential')) icon = '🌧️';
    else if (cLower.includes('rain') || cLower.includes('drizzle') || cLower.includes('shower')) icon = '🌦️';
    else if (cLower.includes('fog') || cLower.includes('mist') || cLower.includes('haze')) icon = '🌫️';
    else if (cLower.includes('cloud') || cLower.includes('overcast')) icon = '☁️';
    else if (cLower.includes('sunny') || cLower.includes('clear')) icon = '☀️';

    const todayWeather = data.weather?.[0];
    const highC = todayWeather?.maxtempC ? `${todayWeather.maxtempC}°C` : 'N/A';
    const lowC = todayWeather?.mintempC ? `${todayWeather.mintempC}°C` : 'N/A';

    return {
      placeName,
      condition: cond.trim(),
      icon,
      tempC,
      tempF,
      feelsC,
      feelsF,
      humidity,
      windKm,
      windMph,
      highC,
      lowC,
      time: curr.localObsDateTime || new Date().toISOString()
    };
  } catch (err) {
    return null;
  }
}

/**
 * High-resilience real-time weather query function.
 * Cascades from Open-Meteo exact geocoding to Photon OpenStreetMap fuzzy geocoding,
 * then retrieves live weather conditions from Open-Meteo, with wttr.in as fail-safe fallback.
 */
export async function fetchLiveWeather(city) {
  if (!city || typeof city !== 'string') return null;
  const cleanCity = city.trim();
  if (cleanCity.length < 2) return null;

  let lat = null;
  let lon = null;
  let placeName = cleanCity;

  // 1. Primary: Open-Meteo Geocoding
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanCity)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl, {
      headers: {
        'User-Agent': BOT_USER_AGENT,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        const loc = geoData.results[0];
        lat = loc.latitude;
        lon = loc.longitude;
        placeName = [loc.name, loc.admin1, loc.country].filter(Boolean).join(', ');
      }
    }
  } catch (e) {
    // Continue to fuzzy fallback
  }

  // 2. Fuzzy Geocoding Fallback via Photon (Komoot OSM)
  // Handles typos, alternative spellings (e.g. "Mangulure" -> "Mangaluru", "Banglore" -> "Bengaluru")
  if (lat === null || lon === null) {
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanCity)}&limit=1`;
      const pRes = await fetch(photonUrl, {
        headers: {
          'User-Agent': BOT_USER_AGENT,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        const feat = pData.features?.[0];
        if (feat && feat.geometry?.coordinates) {
          [lon, lat] = feat.geometry.coordinates;
          const props = feat.properties || {};
          placeName = [props.name, props.state, props.country].filter(Boolean).join(', ');
        }
      }
    } catch (e) {
      // Continue to next fallback
    }
  }

  // 3. Fallback to OpenStreetMap Nominatim
  if (lat === null || lon === null) {
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanCity)}&format=json&limit=1`;
      const nRes = await fetch(nomUrl, { 
        headers: { 'User-Agent': BOT_USER_AGENT, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000) 
      });
      if (nRes.ok) {
        const nData = await nRes.json();
        if (nData && nData.length > 0) {
          lat = parseFloat(nData[0].lat);
          lon = parseFloat(nData[0].lon);
          placeName = nData[0].display_name.split(',').slice(0, 3).map(s => s.trim()).join(', ');
        }
      }
    } catch (e) {}
  }

  // If coordinates resolved, try Open-Meteo forecast
  if (lat !== null && lon !== null) {
    try {
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const wRes = await fetch(forecastUrl, {
        headers: {
          'User-Agent': BOT_USER_AGENT,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      if (wRes.ok) {
        const wData = await wRes.json();
        const curr = wData.current;
        if (curr) {
          const wmo = WMO_WEATHER_CODES[curr.weather_code] || { desc: 'Clear/Variable', icon: '🌤️' };
          const tempC = Math.round(curr.temperature_2m * 10) / 10;
          const tempF = Math.round(((tempC * 9/5) + 32) * 10) / 10;
          const feelsC = Math.round(curr.apparent_temperature * 10) / 10;
          const feelsF = Math.round(((feelsC * 9/5) + 32) * 10) / 10;
          const humidity = curr.relative_humidity_2m;
          const windKm = Math.round(curr.wind_speed_10m * 10) / 10;
          const windMph = Math.round(windKm * 0.621371 * 10) / 10;

          const highC = wData.daily?.temperature_2m_max?.[0] !== undefined ? `${wData.daily.temperature_2m_max[0]}°C` : 'N/A';
          const lowC = wData.daily?.temperature_2m_min?.[0] !== undefined ? `${wData.daily.temperature_2m_min[0]}°C` : 'N/A';

          return {
            placeName,
            condition: wmo.desc,
            icon: wmo.icon,
            tempC,
            tempF,
            feelsC,
            feelsF,
            humidity,
            windKm,
            windMph,
            highC,
            lowC,
            time: curr.time
          };
        }
      }
    } catch (err) {
      // Fall through to wttr.in fallback
    }
  }

  // 4. Guaranteed Fail-Safe Fallback: wttr.in
  return await fetchWttrInWeather(cleanCity);
}
