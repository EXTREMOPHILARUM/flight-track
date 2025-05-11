import { useState, useEffect, useRef } from 'react';
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
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!flightNumber) return;

    const apiKey = localStorage.getItem('aviationstack_api_key');
    if (!apiKey) {
      setError('Please enter your AviationStack API key');
      return;
    }

    // Initialize worker
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/flightUpdateWorker.ts', import.meta.url), {
        type: 'module'
      });
    }

    const worker = workerRef.current;

    // Handle worker messages
    worker.onmessage = (e: MessageEvent) => {
      const { type, data, error } = e.data;

      switch (type) {
        case 'UPDATE':
          // Preserve the existing flight data but update with new live data
          setFlightData(prevData => {
            if (!prevData) return data;
            return {
              ...prevData,
              live: data.live,
              departure: {
                ...prevData.departure,
                ...data.departure
              },
              arrival: {
                ...prevData.arrival,
                ...data.arrival
              },
              flight_status: data.flight_status
            };
          });

          // Cache the updated flight data
          const cacheData: CachedFlightData = {
            data: {
              ...flightData!,
              live: data.live,
              departure: {
                ...flightData!.departure,
                ...data.departure
              },
              arrival: {
                ...flightData!.arrival,
                ...data.arrival
              },
              flight_status: data.flight_status
            },
            timestamp: Date.now()
          };
          localStorage.setItem(`flight_${flightNumber}`, JSON.stringify(cacheData));
          break;

        case 'ERROR':
          setError(error);
          break;
      }
    };

    async function fetchInitialData() {
      try {
        setLoading(true);
        setError(null);

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
          if ((isActive && timeSinceLastUpdate < 15 * 60 * 1000) ||
              (isScheduled && timeSinceLastUpdate < 30 * 60 * 1000)) {
            setFlightData(data);
            
            // Start background updates
            worker.postMessage({
              type: 'START',
              flightNumber,
              apiKey,
              status: data.flight_status,
              lastUpdated: data.live?.updated
            });
            return;
          }
        }

        // If no cache or cache is stale, fetch new data
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

          // Start background updates
          worker.postMessage({
            type: 'START',
            flightNumber,
            apiKey,
            status: newFlightData.flight_status,
            lastUpdated: newFlightData.live?.updated
          });
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

    fetchInitialData();

    return () => {
      // Stop background updates
      worker.postMessage({ type: 'STOP' });
    };
  }, [flightNumber]);

  return { flightData, loading, error };
}