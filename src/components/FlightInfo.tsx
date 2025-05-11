import { Card } from '@/components/ui/card';
import { FlightData } from '@/types/flight';

interface FlightInfoProps {
  flightData: FlightData;
}

export default function FlightInfo({ flightData }: FlightInfoProps) {
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
      });
    } catch {
      return dateStr;
    }
  };

  const formatLocalDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">Flight Details</h2>
        {flightData.live && (
          <p className="text-sm text-muted-foreground">
            Last updated: {formatLocalDateTime(flightData.live.updated)}
          </p>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Flight</h3>
          <p className="text-base sm:text-lg">{flightData.airline.name} {flightData.flight.number}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Aircraft</h3>
          <p className="text-base sm:text-lg">{flightData.aircraft.icao} ({flightData.aircraft.registration})</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Departure</h3>
            <p className="text-base sm:text-lg">{flightData.departure.airport} ({flightData.departure.iata})</p>
            <p className="text-sm text-muted-foreground">
              Scheduled: {formatDateTime(flightData.departure.scheduled)}
            </p>
            {flightData.departure.actual && (
              <p className="text-sm text-muted-foreground">
                Actual: {formatDateTime(flightData.departure.actual)}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Arrival</h3>
            <p className="text-base sm:text-lg">{flightData.arrival.airport} ({flightData.arrival.iata})</p>
            <p className="text-sm text-muted-foreground">
              Scheduled: {formatDateTime(flightData.arrival.scheduled)}
            </p>
            {flightData.arrival.actual && (
              <p className="text-sm text-muted-foreground">
                Actual: {formatDateTime(flightData.arrival.actual)}
              </p>
            )}
          </div>
        </div>

        {flightData.live && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Altitude</h3>
              <p className="text-base sm:text-lg">{flightData.live.altitude}ft</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Speed</h3>
              <p className="text-base sm:text-lg">{flightData.live.speed_horizontal}kts</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Heading</h3>
              <p className="text-base sm:text-lg">{flightData.live.direction}°</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Latitude</h3>
              <p className="text-base sm:text-lg">{flightData.live.latitude}°</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Longitude</h3>
              <p className="text-base sm:text-lg">{flightData.live.longitude}°</p>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
          <p className="text-base sm:text-lg">{flightData.flight_status}</p>
        </div>
      </div>
    </Card>
  );
}