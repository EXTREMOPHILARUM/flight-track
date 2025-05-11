import { useState, useEffect } from 'react';
import { FlightData } from '@/types/flight';

// Update intervals in milliseconds
const ACTIVE_FLIGHT_INTERVAL = 15 * 60 * 1000; // 15 minutes
const SCHEDULED_FLIGHT_INTERVAL = 30 * 60 * 1000; // 30 minutes

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

    let intervalId: number;

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
          // For completed/cancelled flights, no interval is set
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

    // Initial fetch
    fetchFlightData();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [flightNumber]);

  return { flightData, loading, error };
}