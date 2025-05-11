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
  const [flightNumber, setFlightNumber] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const { flightData, loading, error } = useFlightTracking(flightNumber);
  const { initializeNotifications } = useNotifications();

  useEffect(() => {
    initializeNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Plane className="h-6 w-6 sm:h-8 sm:w-8" />
          <h1 className="text-xl sm:text-2xl font-bold">Flight Tracker</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <ApiKeyManager onApiKeyChange={setApiKey} />

        {apiKey && (
          <>
            <FlightSearch
              onSearch={setFlightNumber}
              loading={loading}
            />

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}

            {flightData && (
              <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_400px]">
                <FlightMap flightData={flightData} />
                <FlightInfo flightData={flightData} />
              </div>
            )}
          </>
        )}
      </main>
      
      <Toaster />
    </div>
  );
}

export default App