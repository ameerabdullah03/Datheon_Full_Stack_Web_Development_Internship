const $ = selector => document.querySelector(selector);
const form = $('#search-form');
const input = $('#city-input');
const API_KEY = window.WEATHER_API_KEY || '';
let requestController;

function weatherInfo(condition, iconCode) {
  const main = condition.toLowerCase();
  if (main.includes('thunder')) return {label:condition, icon:'⛈', kind:'rain'};
  if (main.includes('drizzle')) return {label:condition, icon:'🌦', kind:'rain'};
  if (main.includes('rain')) return {label:condition, icon:'🌧', kind:'rain'};
  if (main.includes('snow')) return {label:condition, icon:'❄', kind:'cloud'};
  if (main.includes('mist') || main.includes('fog') || main.includes('haze') || main.includes('smoke')) return {label:condition, icon:'〰', kind:'cloud'};
  if (main.includes('cloud')) return {label:condition, icon:'☁', kind:'cloud'};
  if (iconCode?.endsWith('n')) return {label:condition, icon:'☾', kind:'night'};
  return {label:condition || 'Clear', icon:'☀', kind:'clear'};
}
function setLoading(loading) {
  $('#status').hidden = !loading; $('#weather').hidden = loading; $('#welcome').hidden = loading || Boolean($('#weather').dataset.hasData); $('#error').hidden = true;
  form.querySelector('button').disabled = loading;
}
function showError(title, message) {
  $('#status').hidden = true; $('#weather').hidden = true; $('#welcome').hidden = true; $('#error').hidden = false;
  $('#error-title').textContent = title; $('#error-message').textContent = message; form.querySelector('button').disabled = false;
}
function direction(degrees) { return ['N','NE','E','SE','S','SW','W','NW'][Math.round(degrees / 45) % 8]; }
function dayName(date, index) { return index === 0 ? 'Today' : new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{weekday:'short'}); }

async function searchCity(city) {
  const query = city.trim(); if (!query) return;
  if (!API_KEY) { showError('Weather key not configured','Add your OpenWeatherMap key in config.js, then reload the page.'); return; }
  requestController?.abort(); requestController = new AbortController(); const {signal} = requestController;
  $('#status-text').textContent = `Finding the forecast for ${query}…`; setLoading(true);
  try {
    const params = new URLSearchParams({q:query,appid:API_KEY,units:'metric'});
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?${params}`, {signal}),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?${params}`, {signal})
    ]);
    const currentData = await currentResponse.json();
    if (currentResponse.status === 404) throw new Error(`We couldn't find “${query}”. Check the spelling or try a nearby city.`);
    if (currentResponse.status === 401) throw new Error('OpenWeather rejected this API key. Check that it is active and enabled for Current Weather and 5 Day Forecast.');
    if (!currentResponse.ok) throw new Error(currentData.message || 'The weather service is unavailable. Please try again shortly.');
    const forecastData = await forecastResponse.json();
    if (!forecastResponse.ok) throw new Error(forecastData.message || 'Could not load the five-day forecast. Please try again.');
    if (!currentData.main || !forecastData.list?.length) throw new Error('We could not load a forecast for this location. Try another city.');
    displayWeather(currentData, forecastData);
  } catch (error) {
    if (error.name === 'AbortError') return;
    showError(error.message === 'Failed to fetch' ? 'Connection problem' : 'Couldn’t load weather', error.message === 'Failed to fetch' ? 'Check your internet connection and try again.' : error.message);
  }
}
function displayWeather(current, forecast) {
  const info = weatherInfo(current.weather?.[0]?.main || '', current.weather?.[0]?.icon);
  document.body.classList.remove('weather-clear','weather-rain','weather-cloud','weather-night');
  document.body.classList.add(info.kind === 'night' ? 'weather-night' : `weather-${info.kind}`);
  const location = [current.name, current.sys?.country].filter(Boolean).join(', ');
  $('#location-name').textContent = location; $('#local-time').textContent = new Date((current.dt + current.timezone) * 1000).toLocaleString(undefined,{timeZone:'UTC',weekday:'long',hour:'numeric',minute:'2-digit'});
  $('#current-icon').textContent = info.icon; $('#current-icon').setAttribute('aria-label',info.label);
  $('#temperature').textContent = Math.round(current.main.temp); $('#condition').textContent = info.label;
  $('#feels-like').textContent = Math.round(current.main.feels_like); $('#humidity').textContent = current.main.humidity;
  $('#humidity-bar').style.width = `${Math.max(0,Math.min(100,current.main.humidity))}%`;
  $('#wind').textContent = Math.round((current.wind?.speed || 0) * 3.6); $('#wind-direction').textContent = `${direction(current.wind?.deg || 0)} wind`;
  $('#pressure').textContent = Math.round(current.main.pressure);
  $('#cloud-cover').textContent = current.clouds?.all ?? '—';
  const days = new Map();
  forecast.list.forEach(item => { const date = new Date((item.dt + forecast.city.timezone) * 1000).toISOString().slice(0,10); if (!days.has(date)) days.set(date,[]); days.get(date).push(item); });
  const daily = [...days.entries()].slice(0,5);
  const today = daily[0]?.[1] || [];
  $('#today-high').textContent = Math.round(Math.max(...today.map(x => x.main.temp_max))); $('#today-low').textContent = Math.round(Math.min(...today.map(x => x.main.temp_min))); $('#today-description').textContent = info.label;
  $('#forecast-grid').innerHTML = daily.map(([date,items],index) => {
    const high = Math.max(...items.map(x => x.main.temp_max)), low = Math.min(...items.map(x => x.main.temp_min));
    const noon = items.find(x => new Date((x.dt + forecast.city.timezone) * 1000).getUTCHours() === 12) || items[Math.floor(items.length/2)];
    const outlook = weatherInfo(noon.weather?.[0]?.main || '',noon.weather?.[0]?.icon);
    return `<article class="forecast-card"><div class="day">${index === 0 ? 'Today' : new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined,{timeZone:'UTC',weekday:'short'})}</div><div class="icon" aria-label="${outlook.label}">${outlook.icon}</div><div class="desc">${outlook.label}</div><div class="forecast-temps"><span>${Math.round(high)}°</span><span>${Math.round(low)}°</span></div></article>`;
  }).join('');
  $('#updated-at').textContent = `UPDATED ${new Date().toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})} · ${current.name}`;
  $('#weather').dataset.hasData = 'true'; $('#weather').hidden = false; $('#status').hidden = true; $('#error').hidden = true; $('#welcome').hidden = true; form.querySelector('button').disabled = false;
}

form.addEventListener('submit', event => { event.preventDefault(); searchCity(input.value); });
document.querySelectorAll('[data-city]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.city; searchCity(button.dataset.city); }));
