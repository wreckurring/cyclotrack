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

const SOCKET_COLORS = {
  connected: "text-emerald-400",
  disconnected: "text-red-400",
  connecting: "text-amber-400",
};

const STATUS_COLORS = {
  tracking: "text-emerald-400",
  sending: "text-cyan-400",
  joined: "text-amber-400",
  idle: "text-zinc-500",
};

export default function BrowserTracker() {
  const [rides, setRides] = useState([]);
  const [rideId, setRideId] = useState("");
  const [userId, setUserId] = useState("browser_rider_01");
  const [status, setStatus] = useState("idle");
  const [socketState, setSocketState] = useState("connecting");
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const watchIdRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const list = await fetchRides();
        if (!ignore) {
          setRides(list);
          setRideId((cur) => cur || list[0]?._id || "");
        }
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

    const onConnect = () => setSocketState("connected");
    const onDisconnect = () => setSocketState("disconnected");
    const onRideError = (p) => setError(p?.message || "Unable to join that ride.");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("rideError", onRideError);
    if (socket.connected) setSocketState("connected");

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation)
        navigator.geolocation.clearWatch(watchIdRef.current);
      socket.emit("leaveRide");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("rideError", onRideError);
      disconnectSocket();
    };
  }, []);

  const emitLocation = (nextCoords) => {
    if (!rideId.trim() || !userId.trim()) {
      setError("Select a ride and set a rider ID first.");
      return;
    }
    getSocket().emit("locationUpdate", {
      rideId: rideId.trim(),
      cyclistId: userId.trim(),
      role: "cyclist",
      latitude: Number(nextCoords.latitude),
      longitude: Number(nextCoords.longitude),
      speed: 0,
      timestamp: Date.now(),
    });
    setStatus("sending");
    setError("");
  };

  const joinRide = () => {
    if (!rideId.trim() || !userId.trim()) {
      setError("Select a ride and set a rider ID first.");
      return;
    }
    getSocket().emit("joinRide", {
      rideId: rideId.trim(),
      cyclistId: userId.trim(),
      role: "cyclist",
    });
    setStatus("joined");
    setError("");
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    getSocket().emit("leaveRide");
    setStatus("idle");
  };

  const startBrowserTracking = () => {
    if (!("geolocation" in navigator)) {
      setError("This browser does not support geolocation.");
      return;
    }
    if (!window.isSecureContext) {
      setError("Geolocation requires HTTPS or localhost. Use manual coordinates instead.");
      return;
    }
    joinRide();
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCoords(next);
        emitLocation(next);
        setStatus("tracking");
      },
      (err) => setError(err.message || "Unable to read location."),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  const nudge = (lat, lng) => {
    setCoords((c) => ({
      latitude: Number((c.latitude + lat).toFixed(6)),
      longitude: Number((c.longitude + lng).toFixed(6)),
    }));
  };

  const inputClass =
    "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition";

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar title="Browser Tracker" subtitle="Test without the mobile app" />

      <main className="flex-1 p-5 max-w-3xl mx-auto w-full flex flex-col gap-4">

        {/* Setup */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Setup</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Ride</label>
              <select
                value={rideId}
                onChange={(e) => setRideId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a ride</option>
                {rides.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Rider ID</label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="browser_rider_01"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Socket", value: socketState, colorMap: SOCKET_COLORS },
            { label: "Tracker", value: status, colorMap: STATUS_COLORS },
            { label: "Mode", value: window.isSecureContext ? "GPS ready" : "Manual only", colorMap: {} },
          ].map(({ label, value, colorMap }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
              <p className="text-xs text-zinc-600 uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-sm font-semibold capitalize ${colorMap[value] || "text-zinc-300"}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Tracking modes */}
        <div className="grid gap-3 md:grid-cols-2">

          {/* Browser GPS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Browser GPS</h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
              Works on localhost or HTTPS. Some phone browsers block GPS on plain HTTP.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startBrowserTracking}
                className="inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold rounded-xl px-4 py-2 text-sm transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                Start GPS
              </button>
              <button
                type="button"
                onClick={stopTracking}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition"
              >
                Stop
              </button>
            </div>
          </div>

          {/* Manual coords */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPinned className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Manual Coordinates</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input
                type="number"
                step="0.000001"
                value={coords.latitude}
                onChange={(e) =>
                  setCoords((c) => ({ ...c, latitude: Number(e.target.value) }))
                }
                className={inputClass}
              />
              <input
                type="number"
                step="0.000001"
                value={coords.longitude}
                onChange={(e) =>
                  setCoords((c) => ({ ...c, longitude: Number(e.target.value) }))
                }
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                { label: "N", lat: 0.0003, lng: 0 },
                { label: "S", lat: -0.0003, lng: 0 },
                { label: "W", lat: 0, lng: -0.0003 },
                { label: "E", lat: 0, lng: 0.0003 },
              ].map(({ label, lat, lng }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => nudge(lat, lng)}
                  className="py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition"
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { joinRide(); emitLocation(coords); }}
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-xl px-4 py-2 text-sm transition"
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
