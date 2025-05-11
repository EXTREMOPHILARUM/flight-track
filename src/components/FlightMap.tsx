import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FlightData } from '@/types/flight';

interface FlightMapProps {
  flightData: FlightData;
}

export default function FlightMap({ flightData }: FlightMapProps) {
  useEffect(() => {
    // Fix Leaflet icon paths
    const DefaultIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  if (!flightData.live) {
    return (
      <div className="aspect-[4/3] sm:aspect-[16/9] rounded-lg overflow-hidden flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Live tracking data not available</p>
      </div>
    );
  }

  return (
    <div className="aspect-[4/3] sm:aspect-[16/9] rounded-lg overflow-hidden">
      <MapContainer
        center={[flightData.live.latitude, flightData.live.longitude]}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[flightData.live.latitude, flightData.live.longitude]}>
          <Popup>
            {flightData.airline.name} {flightData.flight.number}
            <br />
            Altitude: {flightData.live.altitude}ft
            <br />
            Speed: {flightData.live.speed_horizontal}kts
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}