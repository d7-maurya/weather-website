// Weather App JavaScript
class WeatherApp {
  constructor() {
    this.currentLocation = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadCurrentLocation();
    this.updateCurrentDate();
  }

  bindEvents() {
    const searchBtn = document.getElementById('searchBtn');
    const cityInput = document.getElementById('cityInput');
    const locationBtn = document.getElementById('locationBtn');

    if (searchBtn) searchBtn.addEventListener('click', () => this.handleSearch());
    if (cityInput) {
      cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch();
        }
      });
    }
    if (locationBtn) locationBtn.addEventListener('click', () => this.getCurrentLocation());
  }

  updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const el = document.getElementById('currentDate');
    if (el) el.textContent = now.toLocaleDateString('en-US', options);
  }

  showLoading() {
    document.getElementById('loadingSpinner')?.classList.remove('hidden');
    document.getElementById('currentWeather')?.classList.add('hidden');
    document.getElementById('forecast')?.classList.add('hidden');
    document.getElementById('errorMessage')?.classList.add('hidden');
  }

  hideLoading() {
    document.getElementById('loadingSpinner')?.classList.add('hidden');
  }

  showError(message) {
    const el = document.getElementById('errorText');
    if (el) el.textContent = message;
    document.getElementById('errorMessage')?.classList.remove('hidden');
    document.getElementById('currentWeather')?.classList.add('hidden');
    document.getElementById('forecast')?.classList.add('hidden');
    this.hideLoading();
  }

  showWeatherData() {
    document.getElementById('currentWeather')?.classList.remove('hidden');
    document.getElementById('forecast')?.classList.remove('hidden');
    document.getElementById('errorMessage')?.classList.add('hidden');
    this.hideLoading();
  }

  async handleSearch() {
    const cityInput = document.getElementById('cityInput');
    const cityName = cityInput ? cityInput.value.trim() : '';

    if (!cityName) {
      this.showError('Please enter a city name');
      return;
    }

    this.showLoading();

    try {
      const coordinates = await this.geocodeCity(cityName);
      if (coordinates) {
        await this.fetchWeatherData(coordinates.lat, coordinates.lon, coordinates.name);
      } else {
        this.showError('City not found. Please check the spelling and try again.');
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Unable to search for the city. Please try again.');
    }
  }

  async geocodeCity(cityName) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`
      );

      if (!response.ok) {
        console.error('Geocode HTTP error:', response.status);
        return null;
      }

      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const parts = (result.display_name || '').split(',');
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          name: (parts[0] || '').trim() + (parts.length > 1 ? ', ' + parts[parts.length - 1].trim() : '')
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showError('Geolocation is not supported by this browser. Please search for a city instead.');
      return;
    }

    this.showLoading();
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await this.fetchWeatherData(latitude, longitude);
        } catch (error) {
          console.error('Error processing location:', error);
          this.showError('Error getting weather for your location. Please try searching for a city.');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access was denied. Please search for a city instead.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please search for a city instead.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please search for a city instead.';
            break;
          default:
            errorMessage += 'Please search for a city instead.';
            break;
        }
        this.showError(errorMessage);
      },
      options
    );
  }

  loadCurrentLocation() {
    this.showLoading();

    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            await this.fetchWeatherData(latitude, longitude);
          } catch (error) {
            console.error('Error with current location:', error);
            // Fallback to default location
            await this.fetchWeatherData(40.7128, -74.0060, 'New York, NY');
          }
        },
        async (error) => {
          console.log('Geolocation not available or denied, using default location');
          // Fallback to default location without showing error
          await this.fetchWeatherData(40.7128, -74.0060, 'New York, NY');
        },
        options
      );
    } else {
      // Fallback to default location
      this.fetchWeatherData(40.7128, -74.0060, 'New York, NY');
    }
  }

  // Update background based on weather condition
  updateBackgroundByWeather(weatherCode) {
    const app = document.querySelector('.app');
    if (!app) return;

    // Weather code mapping to gradients
    if ([0, 1].includes(weatherCode)) {
      // Clear/Mostly Clear - Bright sunny gradient
      app.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    } else if ([2, 3].includes(weatherCode)) {
      // Partly Cloudy/Overcast - Soft cloudy gradient
      app.style.background = 'linear-gradient(135deg, #667db6 0%, #0082c8 100%)';
    } else if ([45, 48].includes(weatherCode)) {
      // Fog - Misty gray gradient
      app.style.background = 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)';
    } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
      // Rain/Drizzle - Rainy blue gradient
      app.style.background = 'linear-gradient(135deg, #373b44 0%, #4286f4 100%)';
    } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
      // Snow - Cool winter gradient
      app.style.background = 'linear-gradient(135deg, #e6dada 0%, #274046 100%)';
    } else if ([95, 96, 99].includes(weatherCode)) {
      // Thunderstorm - Dark stormy gradient
      app.style.background = 'linear-gradient(135deg, #232526 0%, #414345 100%)';
    } else {
      // Default gradient
      app.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }

  async fetchWeatherData(lat, lon, locationName = null) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=apparent_temperature,relativehumidity_2m,pressure_msl,uv_index&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`;

      const weatherResponse = await fetch(url);
      if (!weatherResponse.ok) {
        throw new Error(`Weather API request failed: ${weatherResponse.status}`);
      }

      const raw = await weatherResponse.json();

      // Normalize current weather
      let current = null;
      if (raw.current_weather) {
        const cw = raw.current_weather;
        current = {
          temperature_2m: cw.temperature,
          weather_code: cw.weathercode,
          wind_speed_10m: cw.windspeed,
          time: cw.time,
          apparent_temperature: cw.temperature,
          relative_humidity_2m: null,
          pressure_msl: null,
          uv_index: null
        };

        if (raw.hourly && Array.isArray(raw.hourly.time)) {
          const idx = raw.hourly.time.indexOf(cw.time);
          if (idx !== -1) {
            const h = raw.hourly;
            if (h.apparent_temperature) current.apparent_temperature = h.apparent_temperature[idx];
            if (h.relativehumidity_2m) current.relative_humidity_2m = h.relativehumidity_2m[idx];
            if (h.pressure_msl) current.pressure_msl = h.pressure_msl[idx];
            if (h.uv_index) current.uv_index = h.uv_index[idx];
          }
        }
      }

      const daily = raw.daily || { time: [], weathercode: [], temperature_2m_max: [], temperature_2m_min: [] };

      if (!locationName) {
        locationName = await this.reverseGeocode(lat, lon);
      }

      this.updateWeatherDisplay({ current, daily }, locationName);
      this.showWeatherData();
    } catch (error) {
      console.error('Weather fetch error:', error);
      this.showError('Unable to fetch weather data. Please check your internet connection and try again.');
    }
  }

  async reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
      );
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }
      const data = await response.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        const city = parts[0] || 'Unknown City';
        const country = parts[parts.length - 1] || 'Unknown Country';
        return `${city.trim()}, ${country.trim()}`;
      }
      return 'Current Location';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Current Location';
    }
  }

  updateWeatherDisplay(data, locationName) {
    const current = data.current || {};
    const daily = data.daily || {};

    // Update location
    const locEl = document.getElementById('locationName');
    if (locEl) locEl.textContent = locationName || 'Current Location';

    // Update temperature
    const tempEl = document.getElementById('currentTemp');
    if (tempEl) tempEl.textContent = current.temperature_2m != null ? Math.round(current.temperature_2m) : '—';

    const feelsEl = document.getElementById('feelsLike');
    if (feelsEl) feelsEl.textContent = current.apparent_temperature != null ? Math.round(current.apparent_temperature) : '—';

    const humEl = document.getElementById('humidity');
    if (humEl) humEl.textContent = current.relative_humidity_2m != null ? `${current.relative_humidity_2m}%` : '—';

    const windEl = document.getElementById('windSpeed');
    if (windEl) windEl.textContent = current.wind_speed_10m != null ? `${Math.round(current.wind_speed_10m)} km/h` : '—';

    const presEl = document.getElementById('pressure');
    if (presEl) presEl.textContent = current.pressure_msl != null ? `${Math.round(current.pressure_msl)} hPa` : '—';

    const uvEl = document.getElementById('uvIndex');
    if (uvEl) uvEl.textContent = current.uv_index != null ? Math.round(current.uv_index) : 'N/A';

    // Update weather description and icon
    const code = current.weather_code ?? current.weathercode ?? null;
    const weatherInfo = this.getWeatherInfo(code);
    const descEl = document.getElementById('weatherDescription');
    if (descEl) descEl.textContent = weatherInfo.description;

    const iconEl = document.getElementById('currentIcon');
    if (iconEl) {
      iconEl.src = weatherInfo.icon;
      iconEl.alt = weatherInfo.description;
    }

    // Update background based on weather
    this.updateBackgroundByWeather(code);

    // Update 7-day forecast
    this.updateForecast(daily);
  }

  updateForecast(daily) {
    const forecastContainer = document.getElementById('forecastContainer');
    if (!forecastContainer) return;

    forecastContainer.innerHTML = '';
    const times = daily.time || [];
    const codes = daily.weathercode || daily.weather_code || [];
    const highs = daily.temperature_2m_max || daily.temp_max || [];
    const lows = daily.temperature_2m_min || daily.temp_min || [];

    const count = Math.min(7, times.length);
    for (let i = 0; i < count; i++) {
      const forecastCard = this.createForecastCard(
        times[i],
        codes[i],
        highs[i],
        lows[i],
        i === 0
      );
      // Add staggered animation delay
      forecastCard.style.animationDelay = `${i * 0.1}s`;
      forecastContainer.appendChild(forecastCard);
    }
  }

  createForecastCard(date, weatherCode, maxTemp, minTemp, isToday) {
    const card = document.createElement('div');
    card.className = 'forecast-card';

    const dayName = isToday ? 'Today' : (date ? new Date(date).toLocaleDateString('en-US', { weekday: 'short' }) : '—');
    const weatherInfo = this.getWeatherInfo(weatherCode);

    card.innerHTML = `
      <div class="forecast-card__day">${dayName}</div>
      <div class="forecast-card__icon">
        <img src="${weatherInfo.icon}" alt="${weatherInfo.description}" width="56" height="56">
      </div>
      <div class="forecast-card__temps">
        <span class="forecast-card__high">${maxTemp != null ? Math.round(maxTemp) : '—'}°</span>
        <span class="forecast-card__low">${minTemp != null ? Math.round(minTemp) : '—'}°</span>
      </div>
      <div class="forecast-card__condition">${weatherInfo.description}</div>
    `;

    return card;
  }

  getWeatherInfo(code) {
    const weatherMap = {
      0: { description: 'Clear sky', icon: 'https://openweathermap.org/img/wn/01d@2x.png' },
      1: { description: 'Mainly clear', icon: 'https://openweathermap.org/img/wn/01d@2x.png' },
      2: { description: 'Partly cloudy', icon: 'https://openweathermap.org/img/wn/02d@2x.png' },
      3: { description: 'Overcast', icon: 'https://openweathermap.org/img/wn/03d@2x.png' },
      45: { description: 'Foggy', icon: 'https://openweathermap.org/img/wn/50d@2x.png' },
      48: { description: 'Depositing rime fog', icon: 'https://openweathermap.org/img/wn/50d@2x.png' },
      51: { description: 'Light drizzle', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
      53: { description: 'Moderate drizzle', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
      55: { description: 'Dense drizzle', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
      56: { description: 'Light freezing drizzle', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
      57: { description: 'Dense freezing drizzle', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
      61: { description: 'Slight rain', icon: 'https://openweathermap.org/img/wn/10d@2x.png' },
      63: { description: 'Moderate rain', icon: 'https://openweathermap.org/img/wn/10d@2x.png' },
      65: { description: 'Heavy rain', icon: 'https://openweathermap.org/img/wn/10d@2x.png' },
      66: { description: 'Light freezing rain', icon: 'https://openweathermap.org/img/wn/13d@2x.png' },
      67: { description: 'Heavy freezing rain', icon: 'https://openweathermap.org/img/wn/13d@2x.png' },
      71: { description: 'Slight snow fall', icon: 'https://openweathermap.org/img/wn/13d@2x.png' },
      73: { description: 'Moderate snow fall', icon: 'https://openweathermap.org/img/wn/13d@2x.png' },
      75: { description: 'Heavy snow fall', icon: 'https://openweathermap.org/img/wn/13d@2x.png' },
      77: { description: 'Snow grains', icon: 'https://openweathermap.org/img/wn/13d@2x.png' },
      80: { description: 'Slight rain showers', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
      81: { description: 'Moderate rain showers', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
      82: { description: 'Violent rain showers', icon: 'https://openweathermap.org/img/wn/09d@2x.png' },
      85: { description: 'Slight snow showers', icon: 'https://openweathermap.org/img/wn/13d@2x.png' },
      86: { description: 'Heavy snow showers', icon: 'https://openweathermap.org/img/wn/13d@2x.png' },
      95: { description: 'Thunderstorm', icon: 'https://openweathermap.org/img/wn/11d@2x.png' },
      96: { description: 'Thunderstorm with slight hail', icon: 'https://openweathermap.org/img/wn/11d@2x.png' },
      99: { description: 'Thunderstorm with heavy hail', icon: 'https://openweathermap.org/img/wn/11d@2x.png' }
    };

    return weatherMap[code] || { description: 'Unknown', icon: 'https://openweathermap.org/img/wn/01d@2x.png' };
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WeatherApp();
});