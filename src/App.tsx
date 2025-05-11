import { useEffect, useState } from 'react';
import { Plane } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
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
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('aviationstack_api_key') || '';
  });
  const { flightData, loading, error } = useFlightTracking(flightNumber);
  const { initializeNotifications } = useNotifications();

  useEffect(() => {
    initializeNotifications();
  }, []);

  const handleFlightSearch = (number: string) => {
    setFlightNumber(number);
    localStorage.setItem('last_flight_number', number);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-4">
          <Plane className="h-6 w-6 sm:h-8 sm:w-8" />
          <h1 className="text-xl sm:text-2xl font-bold">Flight Tracker</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-7xl">
        <ApiKeyManager onApiKeyChange={setApiKey} />

        {apiKey && (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-2xl">
              <FlightSearch
                onSearch={handleFlightSearch}
                loading={loading}
                initialValue={flightNumber}
              />

              {error && (
                <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                  {error}
                </div>
              )}
            </div>

            {flightData && (
              <div className="w-full mt-8 grid gap-6 sm:gap-8 lg:grid-cols-[1fr_400px] max-w-7xl">
                <FlightMap flightData={flightData} />
                <FlightInfo flightData={flightData} />
              </div>
            )}
          </div>
        )}
      </main>
      
      <Toaster />
    </div>
  );
}

export default App