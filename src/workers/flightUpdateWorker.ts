// Update intervals in milliseconds
const ACTIVE_FLIGHT_INTERVAL = 15 * 60 * 1000; // 15 minutes
const SCHEDULED_FLIGHT_INTERVAL = 30 * 60 * 1000; // 30 minutes

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastUpdateTime: number | null = null;

self.onmessage = (e: MessageEvent) => {
  const { type, flightNumber, apiKey, status, lastUpdated } = e.data;

  switch (type) {
    case 'START':
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }

      // Set initial last update time
      lastUpdateTime = lastUpdated ? new Date(lastUpdated).getTime() : null;

      // Set new interval based on flight status
      const interval = status === 'active' || status === 'en-route' 
        ? ACTIVE_FLIGHT_INTERVAL 
        : status === 'scheduled' 
          ? SCHEDULED_FLIGHT_INTERVAL 
          : null;

      if (interval) {
        intervalId = setInterval(async () => {
          try {
            const response = await fetch(
              `https://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightNumber}`
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
              const newUpdateTime = newData.live?.updated 
                ? new Date(newData.live.updated).getTime()
                : null;

              // Only send update if the data is newer
              if (!lastUpdateTime || (newUpdateTime && newUpdateTime > lastUpdateTime)) {
                lastUpdateTime = newUpdateTime;
                self.postMessage({
                  type: 'UPDATE',
                  data: newData
                });
              }
            }
          } catch (error) {
            self.postMessage({
              type: 'ERROR',
              error: error instanceof Error ? error.message : 'An error occurred'
            });
          }
        }, interval);
      }
      break;

    case 'STOP':
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      lastUpdateTime = null;
      break;
  }
}; 