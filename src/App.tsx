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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Plane className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Flight Tracker</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <ApiKeyManager onApiKeyChange={setApiKey} />

        {apiKey && (
          <>
            <FlightSearch
              onSearch={setFlightNumber}
              loading={loading}
            />

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}

            {flightData && (
              <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
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