import { useEffect, useState } from 'react';
import { Plane } from 'lucide-react';
import FlightSearch from '@/components/FlightSearch';
import FlightMap from '@/components/FlightMap';
import FlightInfo from '@/components/FlightInfo';
import ApiKeyManager from '@/components/ApiKeyManager';
import { useFlightTracking } from '@/hooks/useFlightTracking';
import { useNotifications } from '@/hooks/useNotifications';

function App() {
  const [flightNumber, setFlightNumber] = useState<string>(() => {
    return localStorage.getItem('last_flight_number') || '';
  });
  const [currentApiKey, setCurrentApiKey] = useState<string>('');
  const { flightData, loading, error } = useFlightTracking(flightNumber, currentApiKey);
  const { initializeNotifications } = useNotifications();

  useEffect(() => {
    initializeNotifications();
  }, []);

  const handleFlightSearch = (number: string) => {
    setFlightNumber(number);
    localStorage.setItem('last_flight_number', number);
  };

  const handleApiKeyChange = (newKey: string) => {
    setCurrentApiKey(newKey);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-3 flex items-center gap-2">
        <span className="text-2xl">✈️</span>
        <h1 className="text-xl font-bold tracking-tight">Flight Tracker</h1>
      </header>
      <main className="flex flex-col items-center justify-center w-full px-2 sm:px-0">
        <div className="w-full max-w-4xl flex flex-col items-center">
          <div className="w-full flex flex-col items-center mt-8 mb-4">
            <div className="w-full mb-6">
              <ApiKeyManager onApiKeyChange={handleApiKeyChange} />
            </div>
            <FlightSearch onSearch={handleFlightSearch} initialValue={flightNumber} loading={loading} />
          </div>
          <div className="w-full flex flex-col lg:flex-row gap-6 items-center justify-center">
            <div className="w-full lg:w-2/3 h-[350px] sm:h-[400px] lg:h-[450px] mb-4 lg:mb-0">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
                  <span className="text-muted-foreground">Loading flight data...</span>
                </div>
              ) : flightData && flightData.live ? (
                <FlightMap flightData={flightData} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
                  <span className="text-muted-foreground">No flight data available. Search for a flight or check API key.</span>
                </div>
              )}
            </div>
            <div className="w-full lg:w-1/3">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
                  <span className="text-muted-foreground">Loading flight info...</span>
                </div>
              ) : flightData ? (
                <FlightInfo flightData={flightData} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
                  <span className="text-muted-foreground">No flight selected.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App