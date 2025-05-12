# Flight Tracker

A web application to search for and visualize historical flights between airports using the OpenSky Network API. The app features:

- Search for flights by departure and arrival airport (ICAO code, name, region, or country)
- Date range selection (up to 7 days, previous days only)
- Autocomplete for airport fields using a global airport database
- Interactive map (OpenStreetMap + Leaflet.js) showing the flight track

## Live Demo

Visit the live demo at [flight-track.saurabhn.com](https://flight-track.saurabhn.com)

## Features

- **Airport Autocomplete:**
  - Enter ICAO code, airport name, region, or country to search for airports.
  - Powered by [ip2location/iata-icao](https://github.com/ip2location/ip2location-iata-icao) CSV.
- **Flight Search:**
  - Enter departure and arrival airports and a date range (max 7 days).
  - Results are fetched from the [OpenSky Network API](https://opensky-network.org/apidoc/rest.html).
- **Flight Track Visualization:**
  - Select a flight to view its track on an interactive map (Leaflet + OSM).

## Setup & Usage

1. **Clone the repository:**
   ```sh
   git clone https://github.com/EXTREMOPHILARUM/flight-track.git
   cd flight-track
   ```

2. **Open the app:**
   - Simply open `index.html` in your web browser. No build step or server required.

3. **How to use:**
   - Enter departure and arrival airport ICAO codes, names, regions, or countries.
   - Select a date range (max 7 days, previous days only).
   - Click "Fetch Flights" to see matching flights.
   - Click "Show Track" on a flight to view its path on the map.

## Dependencies

- [Leaflet.js](https://leafletjs.com/) (for map display)
- [OpenStreetMap](https://www.openstreetmap.org/) (map tiles)
- [ip2location/iata-icao CSV](https://github.com/ip2location/ip2location-iata-icao) (airport data)
- [OpenSky Network API](https://opensky-network.org/apidoc/rest.html) (flight data)

## Notes

- The app only shows flights for previous days (not future or current day in real-time).
- The map is responsive and works on desktop and mobile.
- No backend or server is required; all logic runs in the browser.

## License

This project is for educational/demo purposes. See individual data sources for their respective licenses. 