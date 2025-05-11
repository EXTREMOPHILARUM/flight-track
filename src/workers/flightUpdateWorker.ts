// Update intervals in milliseconds
const ACTIVE_FLIGHT_INTERVAL = 15 * 60 * 1000; // 15 minutes
const SCHEDULED_FLIGHT_INTERVAL = 30 * 60 * 1000; // 30 minutes

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastFlightData: any = null;
let lastApiCallTime: number | null = null;
let currentFlightNumber: string | null = null;
let currentApiKey: string | null = null;

// Helper function to check if flight data has changed
function hasFlightDataChanged(oldData: any, newData: any): boolean {
  if (!oldData) return true;
  
  // Check if flight status has changed
  if (oldData.flight_status !== newData.flight_status) return true;
  
  // Check if live data has changed
  if (oldData.live?.latitude !== newData.live?.latitude ||
      oldData.live?.longitude !== newData.live?.longitude ||
      oldData.live?.altitude !== newData.live?.altitude ||
      oldData.live?.speed_horizontal !== newData.live?.speed_horizontal) {
    return true;
  }
  
  // Check if departure/arrival times have changed
  if (oldData.departure?.scheduled !== newData.departure?.scheduled ||
      oldData.departure?.estimated !== newData.departure?.estimated ||
      oldData.departure?.actual !== newData.departure?.actual ||
      oldData.arrival?.scheduled !== newData.arrival?.scheduled ||
      oldData.arrival?.estimated !== newData.arrival?.estimated ||
      oldData.arrival?.actual !== newData.arrival?.actual) {
    return true;
  }
  
  return false;
}

self.onmessage = (e: MessageEvent) => {
  const { type, flightNumber, apiKey, status } = e.data;

  switch (type) {
    case 'START':
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }

      // Store current flight info
      currentFlightNumber = flightNumber;
      currentApiKey = apiKey;

      // Set new interval based on flight status
      const interval = status === 'active' || status === 'en-route' 
        ? ACTIVE_FLIGHT_INTERVAL 
        : status === 'scheduled' 
          ? SCHEDULED_FLIGHT_INTERVAL 
          : null;

      if (interval) {
        console.log(`Starting flight updates for ${flightNumber} with interval ${interval/1000/60} minutes`);
        lastApiCallTime = Date.now();
        
        // Set up the interval for updates
        intervalId = setInterval(fetchFlightData, interval);
      }
      break;

    case 'STOP':
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      lastFlightData = null;
      lastApiCallTime = null;
      currentFlightNumber = null;
      currentApiKey = null;
      console.log('Stopped flight updates');
      break;
  }
};

async function fetchFlightData() {
  if (!currentFlightNumber || !currentApiKey) {
    console.error('No flight number or API key available');
    return;
  }

  try {
    const now = Date.now();
    const timeSinceLastCall = lastApiCallTime ? now - lastApiCallTime : 0;
    console.log(`Making API call for flight ${currentFlightNumber}. Time since last call: ${timeSinceLastCall/1000/60} minutes`);
    
    const response = await fetch(
      `https://api.aviationstack.com/v1/flights?access_key=${currentApiKey}&flight_iata=${currentFlightNumber}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch flight data');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'API Error');
    }

    if (data.data && data.data.length > 0) {
      const newData = data.data[0];
      
      // Check if the flight data has actually changed
      if (hasFlightDataChanged(lastFlightData, newData)) {
        // Preserve the live data if it exists in the new data
        if (newData.live) {
          console.log('Live data received:', {
            lat: newData.live.latitude,
            lng: newData.live.longitude,
            alt: newData.live.altitude,
            speed: newData.live.speed_horizontal
          });
        }
        
        lastFlightData = newData;
        self.postMessage({
          type: 'UPDATE',
          data: newData
        });
        console.log('Flight data updated');
      } else {
        console.log('No changes in flight data');
      }
    }
    
    lastApiCallTime = now;
  } catch (error) {
    console.error('Error fetching flight data:', error);
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'An error occurred'
    });
  }
} 