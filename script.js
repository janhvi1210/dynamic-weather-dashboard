// Weather Dashboard JavaScript
class WeatherDashboard {
    constructor() {
        
        this.API_KEY = '6b71d9091ca30137a023984f0490d4ca'; 
        this.BASE_URL = 'https://api.openweathermap.org/data/2.5';
        
        // State management
        this.currentUnit = 'celsius';
        this.currentWeatherData = null;
        this.forecastData = null;
        this.chart = null;
        
        // Initialize the application
        this.init();
    }

    init() {
        // Initialize DOM elements first
        this.initializeElements();
        
        // Check for API key
        if (this.API_KEY === 'YOUR_API_KEY_HERE') {
            this.showError('Please add your OpenWeatherMap API key to script.js');
            return;
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize theme
        this.initializeTheme();
        
        // Create particle background
        this.createParticles();
        
        // Load recent searches
        this.loadRecentSearches();
        
        // Try to get weather for user's location
        this.getCurrentLocation();
    }

    initializeElements() {
        // Search elements
        this.citySearchInput = document.getElementById('citySearch');
        this.searchBtn = document.getElementById('searchBtn');
        this.locationBtn = document.getElementById('locationBtn');
        this.suggestionsContainer = document.getElementById('suggestions');
        
        // Display elements
        this.loadingElement = document.getElementById('loading');
        this.errorElement = document.getElementById('error');
        this.errorMessage = document.getElementById('errorMessage');
        this.weatherContent = document.getElementById('weatherContent');
        
        // Weather display elements
        this.currentCity = document.getElementById('currentCity');
        this.currentDate = document.getElementById('currentDate');
        this.currentTemp = document.getElementById('currentTemp');
        this.mainWeatherIcon = document.getElementById('mainWeatherIcon');
        this.description = document.getElementById('description');
        
        // Detail elements
        this.feelsLike = document.getElementById('feelsLike');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        this.pressure = document.getElementById('pressure');
        this.sunrise = document.getElementById('sunrise');
        this.sunset = document.getElementById('sunset');
        
        // Controls
        this.celsiusBtn = document.getElementById('celsius');
        this.fahrenheitBtn = document.getElementById('fahrenheit');
        this.themeToggle = document.getElementById('themeToggle');
        
        // Forecast and chart
        this.forecastGrid = document.getElementById('forecastGrid');
        this.temperatureChart = document.getElementById('temperatureChart');
        
        // Recent searches
        this.recentSearches = document.getElementById('recentSearches');
        this.recentList = document.getElementById('recentList');
    }

    setupEventListeners() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.citySearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        this.citySearchInput.addEventListener('input', (e) => this.handleSearchInput(e));
        this.locationBtn.addEventListener('click', () => this.getCurrentLocation());
        
        // Temperature unit toggle
        this.celsiusBtn.addEventListener('click', () => this.switchUnit('celsius'));
        this.fahrenheitBtn.addEventListener('click', () => this.switchUnit('fahrenheit'));
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-box')) {
                this.hideSuggestions();
            }
        });
    }

    // API Methods
    async searchWeather(city) {
        try {
            this.showLoading();
            
            // Get current weather
            const currentResponse = await fetch(
                `${this.BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${this.API_KEY}&units=metric`
            );
            
            if (!currentResponse.ok) {
                throw new Error('City not found');
            }
            
            const currentData = await currentResponse.json();
            
            // Get 5-day forecast
            const forecastResponse = await fetch(
                `${this.BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${this.API_KEY}&units=metric`
            );
            
            const forecastData = await forecastResponse.json();
            
            // Store data
            this.currentWeatherData = currentData;
            this.forecastData = forecastData;
            
            // Update display
            this.displayWeather();
            this.updateBackground(currentData.weather[0].main.toLowerCase());
            
            // Save to recent searches
            this.saveRecentSearch(city);
            
            this.hideLoading();
            this.hideError();
            
        } catch (error) {
            console.error('Error fetching weather:', error);
            this.hideLoading();
            this.showError(error.message || 'Failed to fetch weather data');
        }
    }

    async searchWeatherByCoords(lat, lon) {
        try {
            this.showLoading();
            
            // Get current weather by coordinates
            const currentResponse = await fetch(
                `${this.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`
            );
            
            const currentData = await currentResponse.json();
            
            // Get 5-day forecast
            const forecastResponse = await fetch(
                `${this.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`
            );
            
            const forecastData = await forecastResponse.json();
            
            // Store data
            this.currentWeatherData = currentData;
            this.forecastData = forecastData;
            
            // Update display
            this.displayWeather();
            this.updateBackground(currentData.weather[0].main.toLowerCase());
            
            this.hideLoading();
            this.hideError();
            
        } catch (error) {
            console.error('Error fetching weather by coordinates:', error);
            this.hideLoading();
            this.showError('Failed to fetch weather data for your location');
        }
    }

    // Display Methods
    displayWeather() {
        if (!this.currentWeatherData) return;
        
        const { name, sys, main, weather, wind, dt } = this.currentWeatherData;
        
        // Update basic info
        this.currentCity.textContent = `${name}, ${sys.country}`;
        this.currentDate.textContent = this.formatDate(dt);
        this.description.textContent = weather[0].description;
        
        // Update temperature
        this.updateTemperatureDisplay();
        
        // Update weather icon
        this.updateWeatherIcon(weather[0].main, weather[0].icon);
        
        // Update details
        this.humidity.textContent = `${main.humidity}%`;
        this.pressure.textContent = `${main.pressure} hPa`;
        this.windSpeed.textContent = `${Math.round(wind.speed * 3.6)} km/h`;
        this.sunrise.textContent = this.formatTime(sys.sunrise);
        this.sunset.textContent = this.formatTime(sys.sunset);
        
        // Update feels like temperature
        this.updateFeelsLikeDisplay();
        
        // Display forecast
        this.displayForecast();
        
        // Create temperature chart
        this.createTemperatureChart();
        
        // Show weather content
        this.weatherContent.classList.remove('hidden');
    }

    displayForecast() {
        if (!this.forecastData) return;
        
        // Get daily forecasts (one per day at noon)
        const dailyForecasts = this.forecastData.list.filter((item, index) => {
            return index % 8 === 0; // Every 8th item (24 hours / 3 hour intervals)
        }).slice(0, 5);
        
        this.forecastGrid.innerHTML = dailyForecasts.map((forecast, index) => {
            const date = new Date(forecast.dt * 1000);
            const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
            const icon = this.getWeatherIcon(forecast.weather[0].main);
            
            const maxTemp = this.currentUnit === 'celsius' 
                ? Math.round(forecast.main.temp_max)
                : Math.round(forecast.main.temp_max * 9/5 + 32);
            
            const minTemp = this.currentUnit === 'celsius' 
                ? Math.round(forecast.main.temp_min)
                : Math.round(forecast.main.temp_min * 9/5 + 32);
            
            const unit = this.currentUnit === 'celsius' ? '°C' : '°F';
            
            return `
                <div class="forecast-item" style="animation-delay: ${index * 0.1}s">
                    <div class="forecast-date">${dayName}</div>
                    <div class="forecast-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="forecast-temps">
                        <span class="forecast-high">${maxTemp}${unit}</span>
                        <span class="forecast-low">${minTemp}${unit}</span>
                    </div>
                    <div class="forecast-desc">${forecast.weather[0].description}</div>
                </div>
            `;
        }).join('');
    }

    createTemperatureChart() {
        if (!this.forecastData || !this.temperatureChart) return;
        
        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }
        
        // Get daily temperature data
        const dailyData = this.forecastData.list.filter((item, index) => {
            return index % 8 === 0; // Every 8th item (24 hours)
        }).slice(0, 5);
        
        const labels = dailyData.map((item, index) => {
            const date = new Date(item.dt * 1000);
            return index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
        });
        
        const temperatures = dailyData.map(item => {
            return this.currentUnit === 'celsius' 
                ? Math.round(item.main.temp)
                : Math.round(item.main.temp * 9/5 + 32);
        });
        
        const ctx = this.temperatureChart.getContext('2d');
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
        gradient.addColorStop(1, 'rgba(118, 75, 162, 0.2)');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Temperature (${this.currentUnit === 'celsius' ? '°C' : '°F'})`,
                    data: temperatures,
                    borderColor: '#667eea',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#667eea',
                    pointBorderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#667eea',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: {
                                weight: '500'
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: {
                                weight: '500'
                            },
                            callback: function(value) {
                                return value + (this.currentUnit === 'celsius' ? '°C' : '°F');
                            }.bind(this)
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Utility Methods
    updateTemperatureDisplay() {
        if (!this.currentWeatherData) return;
        
        const temp = this.currentUnit === 'celsius' 
            ? Math.round(this.currentWeatherData.main.temp)
            : Math.round(this.currentWeatherData.main.temp * 9/5 + 32);
        
        const unit = this.currentUnit === 'celsius' ? '°C' : '°F';
        this.currentTemp.textContent = `${temp}${unit}`;
    }

    updateFeelsLikeDisplay() {
        if (!this.currentWeatherData) return;
        
        const feelsLike = this.currentUnit === 'celsius' 
            ? Math.round(this.currentWeatherData.main.feels_like)
            : Math.round(this.currentWeatherData.main.feels_like * 9/5 + 32);
        
        const unit = this.currentUnit === 'celsius' ? '°C' : '°F';
        this.feelsLike.textContent = `${feelsLike}${unit}`;
    }

    updateWeatherIcon(weatherMain, iconCode) {
        const iconClass = this.getWeatherIcon(weatherMain);
        this.mainWeatherIcon.className = iconClass;
        
        // Add weather-specific animations
        this.mainWeatherIcon.style.animation = 'none';
        setTimeout(() => {
            this.mainWeatherIcon.style.animation = this.getWeatherAnimation(weatherMain);
        }, 100);
    }

    getWeatherIcon(weatherMain) {
        const iconMap = {
            'Clear': 'fas fa-sun',
            'Clouds': 'fas fa-cloud',
            'Rain': 'fas fa-cloud-rain',
            'Drizzle': 'fas fa-cloud-drizzle',
            'Thunderstorm': 'fas fa-bolt',
            'Snow': 'fas fa-snowflake',
            'Mist': 'fas fa-smog',
            'Fog': 'fas fa-smog',
            'Haze': 'fas fa-smog'
        };
        
        return iconMap[weatherMain] || 'fas fa-sun';
    }

    getWeatherAnimation(weatherMain) {
        const animationMap = {
            'Clear': 'pulse 3s ease-in-out infinite',
            'Clouds': 'float 4s ease-in-out infinite',
            'Rain': 'bounce 1s ease-in-out infinite',
            'Thunderstorm': 'shake 0.5s ease-in-out infinite',
            'Snow': 'spin 4s linear infinite'
        };
        
        return animationMap[weatherMain] || 'pulse 3s ease-in-out infinite';
    }

    updateBackground(weatherType) {
        const body = document.body;
        
        // Remove existing weather classes
        body.classList.remove('weather-clear', 'weather-clouds', 'weather-rain', 
                           'weather-snow', 'weather-thunderstorm', 'weather-mist', 'weather-fog');
        
        // Add appropriate weather class
        const weatherClassMap = {
            'clear': 'weather-clear',
            'clouds': 'weather-clouds',
            'rain': 'weather-rain',
            'drizzle': 'weather-rain',
            'snow': 'weather-snow',
            'thunderstorm': 'weather-thunderstorm',
            'mist': 'weather-mist',
            'fog': 'weather-fog',
            'haze': 'weather-mist'
        };
        
        const weatherClass = weatherClassMap[weatherType];
        if (weatherClass) {
            body.classList.add(weatherClass);
        }
    }

    // Search and Input Methods
    handleSearch() {
        const city = this.citySearchInput.value.trim();
        if (city) {
            this.searchWeather(city);
            this.hideSuggestions();
        }
    }

    async handleSearchInput(e) {
        const query = e.target.value.trim();
        
        if (query.length < 3) {
            this.hideSuggestions();
            return;
        }
        
        // Simple city suggestions (you can enhance this with a cities API)
        const suggestions = this.getCitySuggestions(query);
        this.showSuggestions(suggestions);
    }

    getCitySuggestions(query) {
        // This is a simplified suggestion system
        // In a real app, you'd use a cities API or database
        const popularCities = [
            'New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Berlin',
            'Moscow', 'Dubai', 'Singapore', 'Mumbai', 'Cairo', 'Rome',
            'Barcelona', 'Amsterdam', 'Istanbul', 'Bangkok', 'Seoul'
        ];
        
        return popularCities.filter(city => 
            city.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
    }

    showSuggestions(suggestions) {
        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        this.suggestionsContainer.innerHTML = suggestions.map(city => `
            <div class="suggestion-item" onclick="weatherApp.selectSuggestion('${city}')">
                ${city}
            </div>
        `).join('');
        
        this.suggestionsContainer.style.display = 'block';
    }

    hideSuggestions() {
        this.suggestionsContainer.style.display = 'none';
    }

    selectSuggestion(city) {
        this.citySearchInput.value = city;
        this.hideSuggestions();
        this.searchWeather(city);
    }

    // Geolocation Methods
    getCurrentLocation() {
        if (navigator.geolocation) {
            this.locationBtn.classList.add('loading');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    this.searchWeatherByCoords(latitude, longitude);
                    this.locationBtn.classList.remove('loading');
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    this.locationBtn.classList.remove('loading');
                    this.showError('Unable to get your location. Please search for a city instead.');
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        } else {
            this.showError('Geolocation is not supported by your browser.');
        }
    }

    // Unit Conversion Methods
    switchUnit(unit) {
        if (this.currentUnit === unit) return;
        
        this.currentUnit = unit;
        
        // Update button states
        this.celsiusBtn.classList.toggle('active', unit === 'celsius');
        this.fahrenheitBtn.classList.toggle('active', unit === 'fahrenheit');
        
        // Update displays
        if (this.currentWeatherData) {
            this.updateTemperatureDisplay();
            this.updateFeelsLikeDisplay();
            this.displayForecast();
            this.createTemperatureChart();
        }
    }

    // Theme Methods
    initializeTheme() {
        const savedTheme = localStorage.getItem('weather-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('weather-theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = this.themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Recent Searches Methods
    saveRecentSearch(city) {
        let recent = JSON.parse(localStorage.getItem('weather-recent') || '[]');
        
        // Remove if already exists
        recent = recent.filter(item => item.toLowerCase() !== city.toLowerCase());
        
        // Add to beginning
        recent.unshift(city);
        
        // Keep only last 5
        recent = recent.slice(0, 5);
        
        localStorage.setItem('weather-recent', JSON.stringify(recent));
        this.displayRecentSearches();
    }

    loadRecentSearches() {
        this.displayRecentSearches();
    }

    displayRecentSearches() {
        const recent = JSON.parse(localStorage.getItem('weather-recent') || '[]');
        
        if (recent.length === 0) {
            this.recentSearches.style.display = 'none';
            return;
        }
        
        this.recentSearches.style.display = 'block';
        this.recentList.innerHTML = recent.map(city => `
            <button class="recent-item ripple" onclick="weatherApp.searchWeather('${city}')">
                ${city}
            </button>
        `).join('');
    }

    // Particle Background
    createParticles() {
        const particlesContainer = document.getElementById('particles');
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random properties
            const size = Math.random() * 4 + 2;
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            const delay = Math.random() * 6;
            const duration = Math.random() * 3 + 3;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;
            
            particlesContainer.appendChild(particle);
        }
    }

    // Utility Methods
    formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    // UI State Methods
    showLoading() {
        this.loadingElement.classList.remove('hidden');
        this.errorElement.classList.add('hidden');
        this.weatherContent.classList.add('hidden');
    }

    hideLoading() {
        this.loadingElement.classList.add('hidden');
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorElement.classList.remove('hidden');
        this.weatherContent.classList.add('hidden');
    }

    hideError() {
        this.errorElement.classList.add('hidden');
    }
}

// Initialize the weather dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.weatherApp = new WeatherDashboard();
});

// Add ripple effect to buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('ripple')) {
        const ripple = e.target;
        const rect = ripple.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        const rippleEffect = document.createElement('span');
        rippleEffect.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
        `;
        
        ripple.appendChild(rippleEffect);
        
        setTimeout(() => {
            rippleEffect.remove();
        }, 600);
    }
});

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;

document.head.appendChild(style);
