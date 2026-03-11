import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function LiveMap({ cyclists }) {
  const getMarkerColor = (status) => {
    switch(status) {
      case 'moving': return 'green';
      case 'slow': return 'yellow';
      case 'stationary': return 'red';
      case 'disconnected': return 'gray';
      default: return 'blue';
    }
  };

  const createIcon = (color) => {
    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
  };

  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {Object.values(cyclists).map((cyclist) => (
        <Marker 
          key={cyclist.cyclistId} 
          position={[cyclist.latitude, cyclist.longitude]}
          icon={createIcon(getMarkerColor(cyclist.status))}
        >
          <Popup>
            <strong>ID:</strong> {cyclist.cyclistId} <br/>
            <strong>Speed:</strong> {cyclist.speed.toFixed(2)} m/s <br/>
            <strong>Status:</strong> {cyclist.status} <br/>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}