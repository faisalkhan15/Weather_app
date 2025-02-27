// Select DOM elements
const weatherForm = document.getElementById('weatherForm');
const cityInput = document.getElementById('cityInput');
const weatherResult = document.getElementById('weatherResult');
const forecastContainer = document.getElementById('forecastContainer');
const historyList = document.getElementById('historyList');
const unitToggle = document.getElementById('unitToggle');
const quickCityButtons = document.querySelectorAll('.city-btn');

// OpenWeatherMap API Key
const apiKey = 'fe8f581156fa977daf4d4780149d0b66'; // Replace with your actual API key

// Variables
let searchHistory = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];
let units = localStorage.getItem('weatherUnits') || 'metric';
let currentCity = '';

// Initialize the app
function initApp() {
  // Set unit toggle based on saved preference
  unitToggle.checked = units === 'imperial';
  
  // Display search history
  displaySearchHistory();
  
  // If there's a search history, load the most recent city
  if (searchHistory.length > 0) {
    getWeather(searchHistory[0]);
  }
}

// Function to fetch weather data
async function getWeather(city) {
  // Show loading indicator
  weatherResult.innerHTML = '<div class="loader"></div>';
  forecastContainer.innerHTML = '';
  
  // Set current city
  currentCity = city;
  
  // Determine units
  const unitSymbol = units === 'metric' ? '°C' : '°F';
  const speedUnit = units === 'metric' ? 'm/s' : 'mph';
  
  try {
    // Fetch current weather
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      throw new Error('City not found. Please try again.');
    }
    
    const weatherData = await weatherResponse.json();
    
    // Add to search history if not already present
    addToSearchHistory(city);
    
    // Fetch forecast data
    const { lon, lat } = weatherData.coord;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();
    
    // Display current weather
    displayWeather(weatherData, unitSymbol, speedUnit);
    
    // Display forecast
    displayForecast(forecastData, unitSymbol);
    
  } catch (error) {
    weatherResult.innerHTML = `<p class="error">${error.message}</p>`;
    forecastContainer.innerHTML = '';
  }
}

// Function to display current weather data
function displayWeather(data, unitSymbol, speedUnit) {
  const { name, sys } = data; // City name and country
  const { temp, humidity, feels_like, temp_min, temp_max } = data.main; // Weather details
  const { description, icon } = data.weather[0]; // Weather description and icon
  const { speed } = data.wind; // Wind speed
  
  // Get local time at the searched location
  const timestamp = data.dt;
  const timezone = data.timezone;
  const localTime = new Date((timestamp + timezone) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Format weather details
  const formattedTemp = Math.round(temp);
  const formattedFeelsLike = Math.round(feels_like);
  const formattedMinTemp = Math.round(temp_min);
  const formattedMaxTemp = Math.round(temp_max);
  
  // Create weather card
  const weatherHTML = `
    <div class="weather-card">
      <h2>${name}, ${sys.country}</h2>
      <p class="local-time">Local time: ${localTime}</p>
      <div class="weather-icon">
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
        <p class="description">${description.charAt(0).toUpperCase() + description.slice(1)}</p>
      </div>
      <div class="temp-container">
        <p class="current-temp">${formattedTemp}${unitSymbol}</p>
        <div class="temp-details">
          <p><i class="fas fa-thermometer-half"></i> Feels like: ${formattedFeelsLike}${unitSymbol}</p>
          <p><i class="fas fa-temperature-low"></i> Min: ${formattedMinTemp}${unitSymbol}</p>
          <p><i class="fas fa-temperature-high"></i> Max: ${formattedMaxTemp}${unitSymbol}</p>
        </div>
      </div>
      <div class="other-details">
        <p><i class="fas fa-tint"></i> Humidity: ${humidity}%</p>
        <p><i class="fas fa-wind"></i> Wind: ${speed} ${speedUnit}</p>
      </div>
    </div>
  `;
  
  weatherResult.innerHTML = weatherHTML;
  
  // Apply weather-based background
  applyWeatherBackground(data.weather[0].main);
}

// Function to display 3-day forecast
function displayForecast(data, unitSymbol) {
  // Clear the container
  forecastContainer.innerHTML = '';
  
  // Get forecast data for next 3 days (noon)
  const forecasts = data.list;
  const dailyForecasts = {};
  
  // Group forecasts by day
  forecasts.forEach(forecast => {
    const date = new Date(forecast.dt * 1000).toLocaleDateString();
    
    if (!dailyForecasts[date]) {
      dailyForecasts[date] = forecast;
    }
  });
  
  // Get first 3 days
  const threeDayForecast = Object.values(dailyForecasts).slice(1, 4);
  
  // Display forecasts
  threeDayForecast.forEach(forecast => {
    const date = new Date(forecast.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const temp = Math.round(forecast.main.temp);
    const { description, icon } = forecast.weather[0];
    
    const forecastHTML = `
      <div class="forecast-day">
        <p class="forecast-date">${date}</p>
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}">
        <p class="forecast-temp">${temp}${unitSymbol}</p>
        <p class="forecast-desc">${description}</p>
      </div>
    `;
    
    forecastContainer.innerHTML += forecastHTML;
  });
}

// Function to add a city to search history
function addToSearchHistory(city) {
  // Remove the city if it already exists in history
  searchHistory = searchHistory.filter(item => item.toLowerCase() !== city.toLowerCase());
  
  // Add the city to the beginning of the array
  searchHistory.unshift(city);
  
  // Keep only the last 5 searches
  if (searchHistory.length > 5) {
    searchHistory.pop();
  }
  
  // Save to localStorage
  localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory));
  
  // Update the display
  displaySearchHistory();
}

// Function to display search history
function displaySearchHistory() {
  // Clear the list
  historyList.innerHTML = '';
  
  // Add each city to the list
  searchHistory.forEach(city => {
    const listItem = document.createElement('li');
    listItem.className = 'history-item';
    
    listItem.innerHTML = `
      <span>${city}</span>
      <button class="remove-btn" data-city="${city}"><i class="fas fa-times"></i></button>
    `;
    
    // Add click event to load the city
    listItem.addEventListener('click', (e) => {
      if (!e.target.closest('.remove-btn')) {
        getWeather(city);
      }
    });
    
    historyList.appendChild(listItem);
  });
  
  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const city = e.currentTarget.getAttribute('data-city');
      removeFromHistory(city);
    });
  });
}

// Function to remove a city from search history
function removeFromHistory(city) {
  searchHistory = searchHistory.filter(item => item !== city);
  localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory));
  displaySearchHistory();
}

// Function to apply weather-based background
function applyWeatherBackground(weatherCondition) {
  let gradientColors;
  
  switch (weatherCondition.toLowerCase()) {
    case 'clear':
      gradientColors = '135deg, #FFD700, #FFA500';
      break;
    case 'clouds':
      gradientColors = '135deg, #949494, #CCC';
      break;
    case 'rain':
    case 'drizzle':
      gradientColors = '135deg, #4B79A1, #283E51';
      break;
    case 'thunderstorm':
      gradientColors = '135deg, #373B44, #4286f4';
      break;
    case 'snow':
      gradientColors = '135deg, #E0EAFC, #CFDEF3';
      break;
    case 'mist':
    case 'fog':
      gradientColors = '135deg, #B993D6, #8CA6DB';
      break;
    default:
      gradientColors = '135deg, #6dd5ed, #2193b0';
  }
  
  document.body.style.background = `linear-gradient(${gradientColors})`;
}

// Event listener for form submission
weatherForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  
  if (city) {
    getWeather(city);
    cityInput.value = '';
  } else {
    weatherResult.innerHTML = '<p class="error">Please enter a city name.</p>';
  }
});

// Event listener for unit toggle
unitToggle.addEventListener('change', () => {
  units = unitToggle.checked ? 'imperial' : 'metric';
  localStorage.setItem('weatherUnits', units);
  
  // Refresh current city weather with new units
  if (currentCity) {
    getWeather(currentCity);
  }
});

// Event listeners for quick city buttons
quickCityButtons.forEach(button => {
  button.addEventListener('click', () => {
    const city = button.getAttribute('data-city');
    getWeather(city);
  });
});

// Initialize the app
initApp();
