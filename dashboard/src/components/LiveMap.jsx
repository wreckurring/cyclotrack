import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [18.606968, 73.874362];
const DEFAULT_ZOOM = 16;
const STATUS_ORDER = {
  stationary: 0,
  disconnected: 1,
  slow: 2,
  moving: 3,
};

const MAP_LEGEND = [
  { label: "Moving", color: "#34A853" },
  { label: "Slow", color: "#FBBC04" },
  { label: "Stationary", color: "#EA4335" },
  { label: "Disconnected", color: "#9AA0A6" },
];

function fitMapToCyclists(map, cyclists) {
  if (!cyclists.length) {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    return;
  }

  if (cyclists.length === 1) {
    map.setView([cyclists[0].latitude, cyclists[0].longitude], 17);
    return;
  }

  const bounds = L.latLngBounds(
    cyclists.map((cyclist) => [cyclist.latitude, cyclist.longitude]),
  );

  map.fitBounds(bounds, {
    padding: [48, 48],
    maxZoom: 17,
  });
}

function MapViewportController({
  cyclists,
  fitNonce,
  selectedCyclistId,
  followNonce,
}) {
  const map = useMap();
  const hasAutoFitRef = useRef(false);
  const previousFollowNonceRef = useRef(followNonce);

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

  useEffect(() => {
    if (!selectedCyclistId) {
      previousFollowNonceRef.current = followNonce;
      return;
    }

    const selectedCyclist = cyclists.find(
      (cyclist) => cyclist.cyclistId === selectedCyclistId,
    );

    if (!selectedCyclist) {
      return;
    }

    const shouldCenter =
      previousFollowNonceRef.current !== followNonce ||
      previousFollowNonceRef.current === followNonce;

    if (shouldCenter) {
      map.panTo([selectedCyclist.latitude, selectedCyclist.longitude], {
        animate: true,
      });
    }

    previousFollowNonceRef.current = followNonce;
  }, [cyclists, followNonce, map, selectedCyclistId]);

  return null;
}

export default function LiveMap({
  cyclists,
  leaderId,
  selectedCyclistId,
  followNonce = 0,
}) {
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

  const sortedRenderedCyclists = useMemo(
    () =>
      [...renderedCyclists].sort((a, b) => {
        const statusDiff =
          (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);

        if (statusDiff !== 0) {
          return statusDiff;
        }

        return a.cyclistId.localeCompare(b.cyclistId);
      }),
    [renderedCyclists],
  );

  const getMarkerColor = (cyclist) => {
    if (leaderId && cyclist.cyclistId === leaderId) return "purple";

    switch (cyclist.status) {
      case "moving":
        return "green";
      case "slow":
        return "yellow";
      case "stationary":
        return "red";
      case "disconnected":
        return "gray";
      default:
        return "blue";
    }
  };

  const createIcon = (color, isSelected) =>
    new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: isSelected ? [30, 49] : [25, 41],
      iconAnchor: isSelected ? [15, 49] : [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapViewportController
          cyclists={sortedRenderedCyclists}
          fitNonce={fitNonce}
          selectedCyclistId={selectedCyclistId}
          followNonce={followNonce}
        />

        {sortedRenderedCyclists.map((cyclist) => (
          <Marker
            key={cyclist.cyclistId}
            position={[cyclist.renderedLatitude, cyclist.renderedLongitude]}
            icon={createIcon(
              getMarkerColor(cyclist),
              cyclist.cyclistId === selectedCyclistId,
            )}
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

      <div className="absolute left-3 top-3 z-[1000] rounded-2xl border border-g-border bg-g-surface/95 px-4 py-3 text-xs shadow-g-card backdrop-blur-sm">
        <p className="mb-2 font-medium uppercase tracking-wide text-g-faint">
          Marker legend
        </p>
        <div className="flex flex-col gap-1.5">
          {MAP_LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-g-ink-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </div>
          ))}
        </div>
      </div>

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
