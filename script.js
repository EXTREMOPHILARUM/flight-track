document.addEventListener('DOMContentLoaded', () => {
    // Input fields
    const departureAirportInput = document.getElementById('departureAirportInput');
    const arrivalAirportInput = document.getElementById('arrivalAirportInput');
    const beginDateInput = document.getElementById('beginDateInput');
    const endDateInput = document.getElementById('endDateInput');
    const fetchFlightsButton = document.getElementById('fetchFlightsButton');

    // Display areas
    const messageArea = document.getElementById('messageArea');
    const foundFlightsList = document.getElementById('foundFlightsList');
    const flightInfoDiv = document.getElementById('flightInfo');
    const waypointsList = document.getElementById('waypointsList');
    const waypointsAreaDiv = document.getElementById('waypointsArea');

    // Flight details spans
    const infoIcao24 = document.getElementById('infoIcao24');
    const infoCallsign = document.getElementById('infoCallsign');
    const infoStartTime = document.getElementById('infoStartTime');
    const infoEndTime = document.getElementById('infoEndTime');

    // Map related
    const flightTrackMapContainer = document.getElementById('flightTrackMapContainer');
    let map; // Leaflet map instance
    let currentTrackPolyline = null;
    let startMarker = null;
    let endMarker = null;

    // Datalists for airport inputs
    const departureAirportDatalist = document.createElement('datalist');
    departureAirportDatalist.id = 'departureAirportOptions';
    departureAirportInput.setAttribute('list', 'departureAirportOptions');
    document.body.appendChild(departureAirportDatalist);

    const arrivalAirportDatalist = document.createElement('datalist');
    arrivalAirportDatalist.id = 'arrivalAirportOptions';
    arrivalAirportInput.setAttribute('list', 'arrivalAirportOptions');
    document.body.appendChild(arrivalAirportDatalist);

    fetchFlightsButton.addEventListener('click', fetchAndDisplayMatchingFlights);

    // Fetch and populate airport data on load
    fetchAndPopulateAirportData();

    function displayMessage(message, type = 'info') {
        messageArea.textContent = message;
        messageArea.className = 'message-' + type;
        messageArea.style.display = 'block';
    }

    function clearMessages() {
        messageArea.textContent = '';
        messageArea.className = '';
        messageArea.style.display = 'none';
    }

    function clearFlightResults() {
        foundFlightsList.innerHTML = '';
        flightInfoDiv.style.display = 'none';
        waypointsAreaDiv.style.display = 'none';
        flightTrackMapContainer.style.display = 'none'; // Hide map container
        if (map && currentTrackPolyline) {
            map.removeLayer(currentTrackPolyline);
            currentTrackPolyline = null;
        }
        if (map && startMarker) {
            map.removeLayer(startMarker);
            startMarker = null;
        }
        if (map && endMarker) {
            map.removeLayer(endMarker);
            endMarker = null;
        }

        infoIcao24.textContent = '-';
        infoCallsign.textContent = '-';
        infoStartTime.textContent = '-';
        infoEndTime.textContent = '-';
        waypointsList.innerHTML = '';
    }

    async function fetchAndPopulateAirportData() {
        const csvUrl = 'https://raw.githubusercontent.com/ip2location/ip2location-iata-icao/refs/heads/master/iata-icao.csv';
        try {
            const response = await fetch(csvUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch airport data: ${response.status}`);
            }
            const csvText = await response.text();
            const airports = parseAirportCsv(csvText);
            populateDatalists(airports);
        } catch (error) {
            console.error('Error fetching or parsing airport data:', error);
            displayMessage('Could not load airport suggestions.', 'error');
        }
    }

    function parseAirportCsv(csvText) {
        const lines = csvText.split('\n');
        const airports = [];
        // Skip header line by starting i from 1
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // "country_code","region_name","iata","icao","airport","latitude","longitude"
            // Example: "AE","Abu Zaby","AAN","OMAL","Al Ain International Airport","24.2617","55.6092"
            // We need to handle quoted fields that might contain commas.
            const parts = [];
            let currentPart = '';
            let inQuotes = false;
            for (let char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    parts.push(currentPart);
                    currentPart = '';
                } else {
                    currentPart += char;
                }
            }
            parts.push(currentPart); // Add the last part

            if (parts.length >= 5) { // Ensure we have enough parts for country, region, icao, name
                const countryCode = parts[0].trim();
                const regionName = parts[1].trim(); // Region name is the 2nd column (index 1)
                const icao = parts[3].trim();
                const airportName = parts[4].trim();
                if (icao && airportName && icao.toLowerCase() !== 'icao') { // Ensure it's a valid ICAO and not the header (case-insensitive check for header)
                    airports.push({ icao, name: airportName, country: countryCode, region: regionName });
                }
            }
        }
        return airports;
    }

    function populateDatalists(airports) {
        departureAirportDatalist.innerHTML = ''; // Clear existing options
        arrivalAirportDatalist.innerHTML = ''; // Clear existing options

        airports.forEach(airport => {
            const option = document.createElement('option');
            option.value = airport.icao;
            // Display name, ICAO, region, and country. Handle cases where region might be empty.
            const displayText = airport.region ?
                `${airport.name} (${airport.icao}, ${airport.region}, ${airport.country})` :
                `${airport.name} (${airport.icao}, ${airport.country})`;
            option.textContent = displayText;

            departureAirportDatalist.appendChild(option.cloneNode(true));
            arrivalAirportDatalist.appendChild(option);
        });
    }

    function initMap() {
        if (!map) { // Initialize map only once
            map = L.map('flightTrackMapContainer').setView([20, 0], 2); // Default view
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
        }
    }

    async function fetchAndDisplayMatchingFlights() {
        clearMessages();
        clearFlightResults();

        const departureAirport = departureAirportInput.value.trim().toUpperCase();
        const arrivalAirport = arrivalAirportInput.value.trim().toUpperCase();
        const beginDateStr = beginDateInput.value;
        const endDateStr = endDateInput.value;

        if (!departureAirport || !arrivalAirport || !beginDateStr || !endDateStr) {
            displayMessage('Please fill in all fields: Departure Airport, Arrival Airport, Begin Date, and End Date.', 'error');
            return;
        }

        const beginTimestamp = Math.floor(new Date(beginDateStr + "T00:00:00Z").getTime() / 1000);
        const endTimestamp = Math.floor(new Date(endDateStr + "T23:59:59Z").getTime() / 1000);

        if (isNaN(beginTimestamp) || isNaN(endTimestamp)) {
            displayMessage('Invalid date format.', 'error');
            return;
        }

        if (beginTimestamp > endTimestamp) {
            displayMessage('Begin Date must be before or same as End Date.', 'error');
            return;
        }

        const sevenDaysInSeconds = 7 * 24 * 60 * 60;
        if ((endTimestamp - beginTimestamp) > sevenDaysInSeconds) {
            displayMessage('The date range cannot exceed 7 days.', 'error');
            return;
        }

        // Check if dates are in the past or today (API gives previous day's data)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const beginDateObj = new Date(beginDateStr + "T00:00:00Z");

        // API data is for previous days. If user selects today or future for beginDate, it might not yield results.
        // For simplicity, we'll allow today, but API behavior for "today" is effectively "yesterday's data at best".
        // Strict check: if (beginDateObj >= today)

        displayMessage('Fetching flights... Note: Data is for previous days.', 'info');

        try {
            // Fetch departure flights
            const departureApiUrl = `https://opensky-network.org/api/flights/departure?airport=${departureAirport}&begin=${beginTimestamp}&end=${endTimestamp}`;
            const departureResponse = await fetch(departureApiUrl);

            if (departureResponse.status === 404) {
                displayMessage(`No departure flights found for ${departureAirport} in the given period.`, 'info');
                return;
            }
            if (!departureResponse.ok) {
                throw new Error(`Error fetching departure flights: ${departureResponse.status} ${departureResponse.statusText}`);
            }

            const departureFlights = await departureResponse.json();
            if (!departureFlights || departureFlights.length === 0) {
                displayMessage(`No departure flights found for ${departureAirport} in the given period.`, 'info');
                return;
            }

            // Fetch arrival flights
            const arrivalApiUrl = `https://opensky-network.org/api/flights/arrival?airport=${arrivalAirport}&begin=${beginTimestamp}&end=${endTimestamp}`;
            const arrivalResponse = await fetch(arrivalApiUrl);

            if (arrivalResponse.status === 404) {
                displayMessage(`No arrival flights found for ${arrivalAirport} in the given period.`, 'info');
                return;
            }
            if (!arrivalResponse.ok) {
                throw new Error(`Error fetching arrival flights: ${arrivalResponse.status} ${arrivalResponse.statusText}`);
            }

            const arrivalFlights = await arrivalResponse.json();
            if (!arrivalFlights || arrivalFlights.length === 0) {
                displayMessage(`No arrival flights found for ${arrivalAirport} in the given period.`, 'info');
                return;
            }

            const validatedMatchingFlights = [];
            for (const depFlight of departureFlights) {
                // If the departure record has a specific estimated arrival airport,
                // and it's NOT the one the user is searching for, skip this departure record.
                // This prevents linking a flight clearly going to VOBL (for example)
                // with a search for VABB, just because the same plane later landed at VABB.
                if (depFlight.estArrivalAirport && depFlight.estArrivalAirport !== arrivalAirport) {
                    continue;
                }

                // Proceed to find a matching arrival for departures that are either:
                // 1. Estimated to arrive at the target airport.
                // 2. Have no estimated arrival airport in the departure record (null).
                const matchingArrival = arrivalFlights.find(arrFlight =>
                    arrFlight.icao24 === depFlight.icao24 &&
                    arrFlight.estArrivalAirport === arrivalAirport && // Confirm arrival record is for the target
                    arrFlight.lastSeen > depFlight.firstSeen // Ensure arrival is after departure
                );

                if (matchingArrival) {
                    validatedMatchingFlights.push({
                        icao24: depFlight.icao24,
                        callsign: depFlight.callsign,
                        firstSeen: depFlight.firstSeen,
                        estDepartureAirport: depFlight.estDepartureAirport,
                        lastSeen: matchingArrival.lastSeen, // Use arrival time from the matched arrival record
                        estArrivalAirport: matchingArrival.estArrivalAirport, // Use arrival airport from matched (target) arrival record
                    });
                }
            }

            // Update the variable name for consistency downstream
            const matchingFlights = validatedMatchingFlights;

            if (matchingFlights.length === 0) {
                displayMessage(`No flights found departing from ${departureAirport} and arriving at ${arrivalAirport} in the selected period.`, 'info');
                return;
            }

            displayMessage(`Found ${matchingFlights.length} flight(s). Select one to view track.`, 'success');
            foundFlightsList.innerHTML = ''; // Clear previous list

            // Update the heading to show the route
            document.querySelector('#foundFlightsArea h2').textContent = `Flights from ${departureAirport} to ${arrivalAirport}`;

            matchingFlights.forEach(flight => {
                const li = document.createElement('li');
                const depTime = flight.firstSeen ? new Date(flight.firstSeen * 1000).toLocaleString() : 'N/A';
                const arrTime = flight.lastSeen ? new Date(flight.lastSeen * 1000).toLocaleString() : 'N/A';

                li.innerHTML = `
                    <span>
                        <strong>Callsign:</strong> ${flight.callsign || 'N/A'} (ICAO24: ${flight.icao24})<br>
                        <strong>Departed:</strong> ${depTime} from ${flight.estDepartureAirport || 'N/A'}<br>
                        <strong>Arrived:</strong> ${arrTime} at ${flight.estArrivalAirport || 'N/A'}
                    </span>
                `;

                const button = document.createElement('button');
                button.textContent = 'Show Track';
                button.addEventListener('click', () => fetchAndDisplayTrack(flight.icao24, flight.firstSeen, flight.callsign));
                li.appendChild(button);
                foundFlightsList.appendChild(li);
            });

        } catch (error) {
            console.error('Error fetching matching flights:', error);
            displayMessage(`Error: ${error.message}`, 'error');
        }
    }

    async function fetchAndDisplayTrack(icao24, flightTime, callsign) {
        if (!icao24 || flightTime === undefined || flightTime === null) {
            displayMessage('Missing ICAO24 or flight time for track fetching.', 'error');
            return;
        }

        clearMessages();
        // Clear previous track details but not the flight list
        flightInfoDiv.style.display = 'none';
        waypointsAreaDiv.style.display = 'none';
        flightTrackMapContainer.style.display = 'none'; // Hide map initially
        if (map && currentTrackPolyline) {
            map.removeLayer(currentTrackPolyline);
            currentTrackPolyline = null;
        }
        if (map && startMarker) {
            map.removeLayer(startMarker);
            startMarker = null;
        }
        if (map && endMarker) {
            map.removeLayer(endMarker);
            endMarker = null;
        }

        infoIcao24.textContent = '-';
        infoCallsign.textContent = '-';
        infoStartTime.textContent = '-';
        infoEndTime.textContent = '-';
        waypointsList.innerHTML = '';

        displayMessage(`Fetching track for ${callsign || icao24}...`, 'info');

        try {
            // time for tracks/all can be any time within the flight
            const trackApiUrl = `https://opensky-network.org/api/tracks/all?icao24=${icao24}&time=${flightTime}`;
            const trackResponse = await fetch(trackApiUrl);

            if (trackResponse.status === 404) {
                displayMessage(`No track data found for ICAO24 ${icao24} around the specified time. Track data might be too old (older than 30 days) or not available.`, 'error');
                flightInfoDiv.style.display = 'block';
                flightTrackMapContainer.style.display = 'none'; // Keep map hidden
                waypointsAreaDiv.style.display = 'none'; // Ensure waypoints list is hidden
                infoIcao24.textContent = icao24;
                return;
            }
            if (!trackResponse.ok) {
                throw new Error(`Error fetching track: ${trackResponse.status} ${trackResponse.statusText}`);
            }
            const trackData = await trackResponse.json();

            if (!trackData || !trackData.path || trackData.path.length === 0) {
                displayMessage(`No track path data found for ICAO24 ${icao24}.`, 'error');
                flightInfoDiv.style.display = 'block';
                flightTrackMapContainer.style.display = 'none'; // Keep map hidden
                waypointsAreaDiv.style.display = 'none'; // Ensure waypoints list is hidden
                infoIcao24.textContent = trackData.icao24 || icao24;
                return;
            }

            displayMessage('Track data loaded successfully!', 'success');
            flightInfoDiv.style.display = 'block';
            waypointsAreaDiv.style.display = 'none'; // Ensure waypoints list remains hidden
            flightTrackMapContainer.style.display = 'block'; // Show map container

            initMap(); // Initialize map if not already done

            // Clear previous track and markers from map
            if (currentTrackPolyline) {
                map.removeLayer(currentTrackPolyline);
            }
            if (startMarker) {
                map.removeLayer(startMarker);
            }
            if (endMarker) {
                map.removeLayer(endMarker);
            }

            const latLngs = trackData.path
                .filter(wp => wp[1] !== null && wp[2] !== null) // Ensure lat/lon are not null
                .map(wp => [wp[1], wp[2]]); // Extract [lat, lon]

            if (latLngs.length > 1) {
                currentTrackPolyline = L.polyline(latLngs, { color: 'blue' }).addTo(map);
                map.fitBounds(currentTrackPolyline.getBounds());

                // Add start and end markers
                startMarker = L.marker(latLngs[0]).addTo(map)
                    .bindPopup(`<b>Start</b><br>Time: ${new Date(trackData.path[0][0] * 1000).toLocaleString()}<br>Lat: ${latLngs[0][0].toFixed(4)}, Lon: ${latLngs[0][1].toFixed(4)}`);
                endMarker = L.marker(latLngs[latLngs.length - 1]).addTo(map)
                    .bindPopup(`<b>End</b><br>Time: ${new Date(trackData.path[trackData.path.length -1][0] * 1000).toLocaleString()}<br>Lat: ${latLngs[latLngs.length - 1][0].toFixed(4)}, Lon: ${latLngs[latLngs.length - 1][1].toFixed(4)}`);

            } else if (latLngs.length === 1) { // Single point, just show a marker
                startMarker = L.marker(latLngs[0]).addTo(map)
                    .bindPopup(`<b>Waypoint</b><br>Time: ${new Date(trackData.path[0][0] * 1000).toLocaleString()}<br>Lat: ${latLngs[0][0].toFixed(4)}, Lon: ${latLngs[0][1].toFixed(4)}`);
                map.setView(latLngs[0], 10); // Zoom to the single point
            } else {
                displayMessage('Not enough valid waypoints to draw a track.', 'info');
            }

            infoIcao24.textContent = trackData.icao24;
            infoCallsign.textContent = trackData.callsign || callsign || 'N/A';
            infoStartTime.textContent = trackData.startTime ? new Date(trackData.startTime * 1000).toLocaleString() : 'N/A';
            infoEndTime.textContent = trackData.endTime ? new Date(trackData.endTime * 1000).toLocaleString() : 'N/A (or ongoing)';

            waypointsList.innerHTML = ''; // Clear previous waypoints
            trackData.path.forEach(wp => {
                const li = document.createElement('li');
                const time = new Date(wp[0] * 1000).toLocaleTimeString();
                const lat = wp[1] !== null ? wp[1].toFixed(4) : 'N/A';
                const lon = wp[2] !== null ? wp[2].toFixed(4) : 'N/A';
                const alt = wp[3] !== null ? `${wp[3].toFixed(0)}m` : 'N/A';
                const trackVal = wp[4] !== null ? `${wp[4].toFixed(1)}°` : 'N/A';
                const onGround = wp[5] ? 'Yes' : 'No';

                li.textContent = `Time: ${time}, Lat: ${lat}, Lon: ${lon}, Alt: ${alt}, Track: ${trackVal}, On Ground: ${onGround}`;
                waypointsList.appendChild(li);
            });

        } catch (error) {
            console.error('Error fetching flight track:', error);
            displayMessage(`Error fetching track: ${error.message}`, 'error');
        }
    }
});