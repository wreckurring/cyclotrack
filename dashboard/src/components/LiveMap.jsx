import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [51.505, -0.09];
const DEFAULT_ZOOM = 13;

function fitMapToCyclists(map, cyclists) {
  if (!cyclists.length) {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    return;
  }

  if (cyclists.length === 1) {
    map.setView([cyclists[0].latitude, cyclists[0].longitude], 15);
    return;
  }

  const bounds = L.latLngBounds(
    cyclists.map((cyclist) => [cyclist.latitude, cyclist.longitude]),
  );

  map.fitBounds(bounds, {
    padding: [48, 48],
    maxZoom: 16,
  });
}

function MapViewportController({ cyclists, fitNonce }) {
  const map = useMap();
  const hasAutoFitRef = useRef(false);

  useEffect(() => {
    if (!cyclists.length) {
      hasAutoFitRef.current = false;
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    if (!hasAutoFitRef.current || fitNonce > 0) {
      fitMapToCyclists(map, cyclists);
      hasAutoFitRef.current = true;
    }
  }, [cyclists, fitNonce, map]);

  return null;
}

export default function LiveMap({ cyclists, leaderId }) {
  const [fitNonce, setFitNonce] = useState(0);

  const renderedCyclists = useMemo(() => {
    const cyclistList = Object.values(cyclists);
    const groupedByPosition = cyclistList.reduce((groups, cyclist) => {
      const key = `${Number(cyclist.latitude).toFixed(6)}:${Number(cyclist.longitude).toFixed(6)}`;
      groups[key] = groups[key] || [];
      groups[key].push(cyclist);
      return groups;
    }, {});

    return Object.values(groupedByPosition).flatMap((group) => {
      if (group.length === 1) {
        return group.map((cyclist) => ({
          ...cyclist,
          renderedLatitude: cyclist.latitude,
          renderedLongitude: cyclist.longitude,
        }));
      }

      return group.map((cyclist, index) => {
        const angle = (2 * Math.PI * index) / group.length;
        const radius = 0.00018;

        return {
          ...cyclist,
          renderedLatitude: cyclist.latitude + Math.sin(angle) * radius,
          renderedLongitude: cyclist.longitude + Math.cos(angle) * radius,
          isOffset: true,
        };
      });
    });
  }, [cyclists]);

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

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapViewportController cyclists={renderedCyclists} fitNonce={fitNonce} />

        {renderedCyclists.map((cyclist) => (
          <Marker
            key={cyclist.cyclistId}
            position={[cyclist.renderedLatitude, cyclist.renderedLongitude]}
            icon={createIcon(getMarkerColor(cyclist))}
          >
            <Popup>
              <strong>ID:</strong> {cyclist.cyclistId} <br />
              <strong>Speed:</strong> {cyclist.speed.toFixed(2)} m/s <br />
              <strong>Status:</strong> {cyclist.status} <br />
              {cyclist.isOffset && (
                <>
                  <strong>Note:</strong> Marker offset for visibility <br />
                </>
              )}
              {leaderId && cyclist.cyclistId === leaderId && (
                <span>
                  <strong>Role:</strong> Ride Leader
                </span>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <button
        type="button"
        onClick={() => setFitNonce((current) => current + 1)}
        className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-2 rounded-full border border-g-border bg-g-surface/95 px-4 py-2 text-sm font-medium text-g-ink shadow-g-card backdrop-blur-sm transition hover:border-g-border-strong hover:bg-white"
      >
        <LocateFixed className="h-4 w-4 text-g-blue" />
        Auto-fit riders
      </button>
    </div>
  );
}
