import React, { useEffect, useRef, useState } from "react";
import { Crosshair, MapPinned, Navigation, Send, Smartphone } from "lucide-react";
import Navbar from "../components/Navbar";
import { fetchRides } from "../services/api";
import {
  disconnectSocket,
  getSocket,
  initiateSocketConnection,
} from "../services/socketService";

const DEFAULT_COORDS = { latitude: 12.9716, longitude: 77.5946 };

const SOCKET_COLOR = { connected: "text-g-green", disconnected: "text-g-red", connecting: "text-g-yellow" };
const STATUS_COLOR  = { tracking: "text-g-green", sending: "text-g-blue", joined: "text-g-yellow", idle: "text-g-faint" };

export default function BrowserTracker() {
  const [rides, setRides]           = useState([]);
  const [rideId, setRideId]         = useState("");
  const [userId, setUserId]         = useState("browser_rider_01");
  const [status, setStatus]         = useState("idle");
  const [socketState, setSocketState] = useState("connecting");
  const [error, setError]           = useState("");
  const [coords, setCoords]         = useState(DEFAULT_COORDS);
  const watchIdRef = useRef(null);
  const joinedRideKeyRef = useRef("");

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const list = await fetchRides();
        if (!ignore) { setRides(list); setRideId((c) => c || list[0]?._id || ""); }
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to load rides.");
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    initiateSocketConnection();
    const socket = getSocket();
    const onConnect    = () => setSocketState("connected");
    const onDisconnect = () => setSocketState("disconnected");
    const onRideError  = (p) => setError(p?.message || "Unable to join that ride.");
    const onRideNote   = (payload) => {
      if (payload?.rideId !== rideId) {
        return;
      }

      window.alert(`Ride note from ${payload.author}: ${payload.message}`);
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("rideError", onRideError);
    socket.on("rideNote", onRideNote);
    if (socket.connected) setSocketState("connected");
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation)
        navigator.geolocation.clearWatch(watchIdRef.current);
      socket.emit("leaveRide");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("rideError", onRideError);
      socket.off("rideNote", onRideNote);
      disconnectSocket();
    };
  }, [rideId]);

  useEffect(() => {
    if (!rideId.trim() || !userId.trim()) {
      return;
    }

    const nextKey = `${rideId.trim()}:${userId.trim()}`;
    const socket = getSocket();

    if (!socket.connected || joinedRideKeyRef.current === nextKey) {
      return;
    }

    if (joinedRideKeyRef.current) {
      socket.emit("leaveRide");
    }

    socket.emit("joinRide", {
      rideId: rideId.trim(),
      cyclistId: userId.trim(),
      role: "cyclist",
    });
    joinedRideKeyRef.current = nextKey;
  }, [rideId, socketState, userId]);

  const emitLocation = (next) => {
    if (!rideId.trim() || !userId.trim()) { setError("Select a ride and set a rider ID first."); return; }
    getSocket().emit("locationUpdate", {
      rideId: rideId.trim(), cyclistId: userId.trim(), role: "cyclist",
      latitude: Number(next.latitude), longitude: Number(next.longitude),
      speed: 0, timestamp: Date.now(),
    });
    setStatus("sending"); setError("");
  };

  const joinRide = () => {
    if (!rideId.trim() || !userId.trim()) { setError("Select a ride and set a rider ID first."); return; }
    getSocket().emit("joinRide", { rideId: rideId.trim(), cyclistId: userId.trim(), role: "cyclist" });
    joinedRideKeyRef.current = `${rideId.trim()}:${userId.trim()}`;
    setStatus("joined"); setError("");
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    getSocket().emit("leaveRide");
    joinedRideKeyRef.current = "";
    setStatus("idle");
  };

  const startBrowserTracking = () => {
    if (!("geolocation" in navigator)) { setError("This browser does not support geolocation."); return; }
    if (!window.isSecureContext)       { setError("Geolocation requires HTTPS or localhost. Use manual coordinates instead."); return; }
    joinRide();
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCoords(next); emitLocation(next); setStatus("tracking");
      },
      (err) => setError(err.message || "Unable to read location."),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  const nudge = (lat, lng) =>
    setCoords((c) => ({
      latitude:  Number((c.latitude  + lat).toFixed(6)),
      longitude: Number((c.longitude + lng).toFixed(6)),
    }));

  const inputClass =
    "w-full border border-g-border rounded-lg px-4 py-2.5 text-sm text-g-ink bg-transparent placeholder-g-faint focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue transition";

  return (
    <div className="min-h-screen bg-g-bg flex flex-col">
      <Navbar title="Browser Tracker" subtitle="Test without the mobile app" />

      <main className="flex-1 p-5 max-w-3xl mx-auto w-full flex flex-col gap-4">

        {/* Setup */}
        <div className="bg-g-surface rounded-2xl shadow-g-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-g-blue" />
            <p className="text-sm font-medium text-g-ink">Setup</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-g-faint mb-1.5">Ride</label>
              <select value={rideId} onChange={(e) => setRideId(e.target.value)} className={inputClass}>
                <option value="">Select a ride</option>
                {rides.map((r) => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-g-faint mb-1.5">Rider ID</label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="browser_rider_01"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Status pills */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Socket",  value: socketState, colorMap: SOCKET_COLOR },
            { label: "Tracker", value: status,      colorMap: STATUS_COLOR  },
            { label: "Mode",    value: window.isSecureContext ? "GPS ready" : "Manual only", colorMap: {} },
          ].map(({ label, value, colorMap }) => (
            <div key={label} className="bg-g-surface rounded-2xl shadow-g-card px-4 py-3.5">
              <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-sm font-medium capitalize ${colorMap[value] || "text-g-ink-2"}`}>{value}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="text-sm text-g-yellow bg-g-yellow-tint rounded-xl px-4 py-3 border border-g-yellow/20">
            {error}
          </div>
        )}

        {/* Tracking modes */}
        <div className="grid gap-3 md:grid-cols-2">

          {/* Browser GPS */}
          <div className="bg-g-surface rounded-2xl shadow-g-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Crosshair className="w-4 h-4 text-g-blue" />
              <p className="text-sm font-medium text-g-ink">Browser GPS</p>
            </div>
            <p className="text-xs text-g-muted leading-relaxed mb-4">
              Works on localhost or HTTPS. Some phone browsers block GPS on plain HTTP.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startBrowserTracking}
                className="inline-flex items-center gap-1.5 bg-g-blue hover:bg-g-blue-hover text-white font-medium rounded-full px-4 py-2 text-sm transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                Start GPS
              </button>
              <button
                type="button"
                onClick={stopTracking}
                className="px-4 py-2 rounded-full border border-g-border text-sm text-g-muted hover:bg-g-bg hover:border-g-border-strong transition"
              >
                Stop
              </button>
            </div>
          </div>

          {/* Manual coords */}
          <div className="bg-g-surface rounded-2xl shadow-g-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPinned className="w-4 h-4 text-g-blue" />
              <p className="text-sm font-medium text-g-ink">Manual Coordinates</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input type="number" step="0.000001" value={coords.latitude}
                onChange={(e) => setCoords((c) => ({ ...c, latitude: Number(e.target.value) }))}
                className={inputClass} />
              <input type="number" step="0.000001" value={coords.longitude}
                onChange={(e) => setCoords((c) => ({ ...c, longitude: Number(e.target.value) }))}
                className={inputClass} />
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                { label: "N", lat:  0.0003, lng:  0      },
                { label: "S", lat: -0.0003, lng:  0      },
                { label: "W", lat:  0,      lng: -0.0003 },
                { label: "E", lat:  0,      lng:  0.0003 },
              ].map(({ label, lat, lng }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => nudge(lat, lng)}
                  className="py-1.5 rounded-full border border-g-border text-xs text-g-muted hover:bg-g-bg hover:border-g-border-strong hover:text-g-ink-2 transition"
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { joinRide(); emitLocation(coords); }}
              className="inline-flex items-center gap-1.5 bg-g-green hover:bg-[#1a7a35] text-white font-medium rounded-full px-4 py-2 text-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              Send Location
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
