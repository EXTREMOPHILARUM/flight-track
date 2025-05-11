import { useState, useEffect } from 'react';
import { FlightData } from '@/types/flight';

// Update intervals in milliseconds
const ACTIVE_FLIGHT_INTERVAL = 15 * 60 * 1000; // 15 minutes
const SCHEDULED_FLIGHT_INTERVAL = 30 * 60 * 1000; // 30 minutes

interface CachedFlightData {
  data: FlightData;
  timestamp: number;
}

export function useFlightTracking(flightNumber: string) {
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flightNumber) return;

    const apiKey = localStorage.getItem('aviationstack_api_key');
    if (!apiKey) {
      setError('Please enter your AviationStack API key');
      return;
    }

    let intervalId: ReturnType<typeof setInterval>;

    async function fetchFlightData() {
      try {
        setLoading(true);
        setError(null);

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
          const newFlightData = data.data[0];
          setFlightData(newFlightData);

          // Cache the flight data
          const cacheData: CachedFlightData = {
            data: newFlightData,
            timestamp: Date.now()
          };
          localStorage.setItem(`flight_${flightNumber}`, JSON.stringify(cacheData));

          // Determine update interval based on flight status
          const status = newFlightData.flight_status.toLowerCase();
          const isActive = status === 'active' || status === 'en-route';
          const isScheduled = status === 'scheduled';
          
          // Clear existing interval
          if (intervalId) {
            clearInterval(intervalId);
          }

          // Set new interval based on status
          if (isActive) {
            intervalId = setInterval(fetchFlightData, ACTIVE_FLIGHT_INTERVAL);
          } else if (isScheduled) {
            intervalId = setInterval(fetchFlightData, SCHEDULED_FLIGHT_INTERVAL);
          }
        } else {
          throw new Error('Flight not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setFlightData(null);
      } finally {
        setLoading(false);
      }
    }

    // Check cache first
    const cachedData = localStorage.getItem(`flight_${flightNumber}`);
    if (cachedData) {
      const { data, timestamp }: CachedFlightData = JSON.parse(cachedData);
      const status = data.flight_status.toLowerCase();
      const isActive = status === 'active' || status === 'en-route';
      const isScheduled = status === 'scheduled';
      
      // Calculate time since last update
      const timeSinceLastUpdate = Date.now() - timestamp;
      
      // Use cache if it's within the appropriate interval
      if ((isActive && timeSinceLastUpdate < ACTIVE_FLIGHT_INTERVAL) ||
          (isScheduled && timeSinceLastUpdate < SCHEDULED_FLIGHT_INTERVAL)) {
        setFlightData(data);
        
        // Set up interval for next update
        if (isActive) {
          intervalId = setInterval(fetchFlightData, ACTIVE_FLIGHT_INTERVAL);
        } else if (isScheduled) {
          intervalId = setInterval(fetchFlightData, SCHEDULED_FLIGHT_INTERVAL);
        }
        return;
      }
    }

    // If no cache or cache is stale, fetch new data
    fetchFlightData();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [flightNumber]);

  return { flightData, loading, error };
}