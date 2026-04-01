import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Crosshair, MapPinned, Navigation, Send, Smartphone } from "lucide-react";
import { fetchRides } from "../services/api";
import {
  disconnectSocket,
  getSocket,
  initiateSocketConnection,
} from "../services/socketService";

const DEFAULT_COORDS = {
  latitude: 12.9716,
  longitude: 77.5946,
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
        const rideList = await fetchRides();

        if (ignore) {
          return;
        }

        setRides(rideList);
        setRideId((currentRideId) => currentRideId || rideList[0]?._id || "");
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || "Unable to load rides.");
        }
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    initiateSocketConnection();
    const socket = getSocket();

    const handleConnect = () => setSocketState("connected");
    const handleDisconnect = () => setSocketState("disconnected");
    const handleRideError = (payload) =>
      setError(payload?.message || "Unable to join that ride.");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("rideError", handleRideError);

    if (socket.connected) {
      setSocketState("connected");
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      socket.emit("leaveRide");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("rideError", handleRideError);
      disconnectSocket();
    };
  }, []);

  const emitLocation = (nextCoords) => {
    const socket = getSocket();

    if (!rideId.trim() || !userId.trim()) {
      setError("Select a ride and rider ID first.");
      return;
    }

    socket.emit("locationUpdate", {
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
      setError("Select a ride and rider ID first.");
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
      setError(
        "Browser location usually needs HTTPS or localhost. Use manual coordinates below if this page is open over plain HTTP.",
      );
      return;
    }

    joinRide();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setCoords(nextCoords);
        emitLocation(nextCoords);
        setStatus("tracking");
      },
      (geoError) => {
        setError(geoError.message || "Unable to read your location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    );
  };

  const sendManualLocation = () => {
    joinRide();
    emitLocation(coords);
  };

  const nudgeCoords = (latitudeDelta, longitudeDelta) => {
    setCoords((current) => ({
      latitude: Number((current.latitude + latitudeDelta).toFixed(6)),
      longitude: Number((current.longitude + longitudeDelta).toFixed(6)),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                <Smartphone className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-3xl font-bold">Browser Ride Tracker</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Open this page on your phone browser to join a ride without Expo. If
                browser GPS is blocked, you can still send manual coordinates and watch
                the live marker move on the leader/admin dashboard.
              </p>
            </div>
            <Link
              to="/"
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Back
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Ride
              </span>
              <select
                value={rideId}
                onChange={(event) => setRideId(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
              >
                <option value="">Select a ride</option>
                {rides.map((ride) => (
                  <option key={ride._id} value={ride._id}>
                    {ride.name} ({ride._id})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Rider ID
              </span>
              <input
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
                placeholder="browser_rider_01"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Socket</div>
              <div className="mt-2 text-lg font-semibold capitalize">{socketState}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Tracker</div>
              <div className="mt-2 text-lg font-semibold capitalize">{status}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Mode</div>
              <div className="mt-2 text-lg font-semibold">
                {window.isSecureContext ? "Browser GPS enabled" : "Manual recommended"}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
              <div className="flex items-center gap-3">
                <Crosshair className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold">Browser Location</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Use this if the page is opened on `localhost` or over HTTPS. Some phone
                browsers block GPS on plain `http://192.168...` URLs.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={startBrowserTracking}
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
                >
                  <Navigation className="h-4 w-4" />
                  Start GPS
                </button>
                <button
                  type="button"
                  onClick={stopTracking}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white"
                >
                  Stop
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
              <div className="flex items-center gap-3">
                <MapPinned className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold">Manual Coordinates</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                This always works for end-to-end testing. Change the values or nudge
                them with the buttons below, then send the update to the ride.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  step="0.000001"
                  value={coords.latitude}
                  onChange={(event) =>
                    setCoords((current) => ({
                      ...current,
                      latitude: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                />
                <input
                  type="number"
                  step="0.000001"
                  value={coords.longitude}
                  onChange={(event) =>
                    setCoords((current) => ({
                      ...current,
                      longitude: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => nudgeCoords(0.0003, 0)}
                  className="rounded-2xl border border-white/10 px-3 py-2 text-sm"
                >
                  North
                </button>
                <button
                  type="button"
                  onClick={() => nudgeCoords(-0.0003, 0)}
                  className="rounded-2xl border border-white/10 px-3 py-2 text-sm"
                >
                  South
                </button>
                <button
                  type="button"
                  onClick={() => nudgeCoords(0, -0.0003)}
                  className="rounded-2xl border border-white/10 px-3 py-2 text-sm"
                >
                  West
                </button>
                <button
                  type="button"
                  onClick={() => nudgeCoords(0, 0.0003)}
                  className="rounded-2xl border border-white/10 px-3 py-2 text-sm"
                >
                  East
                </button>
              </div>

              <button
                type="button"
                onClick={sendManualLocation}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950"
              >
                <Send className="h-4 w-4" />
                Send Location
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
