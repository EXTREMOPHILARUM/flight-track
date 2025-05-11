import { useState, useEffect } from 'react';
import { FlightData } from '@/types/flight';

const UPDATE_INTERVAL = 30000; // 30 seconds

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
          setFlightData(data.data[0]);
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

    fetchFlightData();
    intervalId = setInterval(fetchFlightData, UPDATE_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [flightNumber]);

  return { flightData, loading, error };
}