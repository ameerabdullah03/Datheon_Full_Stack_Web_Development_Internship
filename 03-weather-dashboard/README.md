# Skyline Weather

A responsive, zero-build weather dashboard. Search for a city to see current conditions, humidity, wind, pressure, cloud cover, and the next five daily forecasts.

## Run

Open `index.html` in a modern browser or serve the folder with any static file server. The app uses the OpenWeatherMap Current Weather and 5 Day / 3 Hour Forecast APIs. An internet connection and an active API key are required. The API key is configured in `app.js`.

## Notes

- City names are resolved by OpenWeatherMap using the city query.
- Forecast cards summarize the 3-hour forecast into five local calendar days.
- Network, service, and unknown-city errors have distinct user-facing messages.

Because this is a static browser app, its API key is visible to visitors. For a public deployment, restrict the key to the APIs and usage limits in your OpenWeather account, or proxy requests through a server-side function.
