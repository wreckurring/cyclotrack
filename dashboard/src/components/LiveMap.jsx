import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function MapCenter({ center }) {
  const map = useMap();

  React.useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
}

export default function LiveMap({ cyclists, leaderId }) {
  const getMarkerColor = (cyclist) => {
    if (leaderId && cyclist.cyclistId === leaderId) return 'purple';

    switch (cyclist.status) {
      case 'moving':
        return 'green';
      case 'slow':
        return 'yellow';
      case 'stationary':
        return 'red';
      case 'disconnected':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const createIcon = (color) => {
    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
  };

  const firstCyclist = useMemo(() => {
    const list = Object.values(cyclists);
    return list.length ? list[0] : null;
  }, [cyclists]);

  const center = firstCyclist ? [firstCyclist.latitude, firstCyclist.longitude] : [51.505, -0.09];

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapCenter center={center} />

      {Object.values(cyclists).map((cyclist) => (
        <Marker
          key={cyclist.cyclistId}
          position={[cyclist.latitude, cyclist.longitude]}
          icon={createIcon(getMarkerColor(cyclist))}
        >
          <Popup>
            <strong>ID:</strong> {cyclist.cyclistId} <br />
            <strong>Speed:</strong> {cyclist.speed.toFixed(2)} m/s <br />
            <strong>Status:</strong> {cyclist.status} <br />
            {leaderId && cyclist.cyclistId === leaderId && (
              <span>
                <strong>Role:</strong> Ride Leader
              </span>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
