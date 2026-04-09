import React, { useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck, Smartphone, Target, Wifi, WifiOff } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { fetchRides } from "../services/api";
import {
  disconnectSocket,
  getSocket,
  initiateSocketConnection,
} from "../services/socketService";

const TRACKER_STATE = {
  idle: { label: "Idle", color: "text-g-faint" },
  requesting: { label: "Requesting GPS", color: "text-g-yellow" },
  tracking: { label: "Live tracking", color: "text-g-green" },
};

const formatTime = (timestamp) => {
  if (!timestamp) {
    return "-";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatCoordinate = (value) =>
  Number.isFinite(value) ? value.toFixed(6) : "-";

export default function BrowserTracker() {
  const [searchParams] = useSearchParams();
  const [rides, setRides] = useState([]);
  const [rideId, setRideId] = useState(searchParams.get("rideId") || "");
  const [userId, setUserId] = useState(searchParams.get("riderId") || "rider_01");
  const [trackerState, setTrackerState] = useState("idle");
  const [socketState, setSocketState] = useState("connecting");
  const [error, setError] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [lastSentAt, setLastSentAt] = useState(null);

  const watchIdRef = useRef(null);
  const isTrackingRef = useRef(false);
  const wakeLockRef = useRef(null);

  const isSecureTracker = window.isSecureContext;

  const selectedRide = useMemo(
    () => rides.find((ride) => ride._id === rideId) || null,
    [rideId, rides],
  );

  const requestWakeLock = async () => {
    if (!("wakeLock" in navigator)) {
      return;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch (wakeLockError) {
      console.warn("Wake lock unavailable:", wakeLockError.message);
    }
  };

  const releaseWakeLock = async () => {
    try {
      await wakeLockRef.current?.release?.();
    } catch (wakeLockError) {
      console.warn("Wake lock release failed:", wakeLockError.message);
    } finally {
      wakeLockRef.current = null;
    }
  };

  const joinRide = () => {
    if (!rideId.trim() || !userId.trim()) {
      return;
    }

    getSocket().emit("joinRide", {
      rideId: rideId.trim(),
      cyclistId: userId.trim(),
      role: "cyclist",
    });
  };

  const stopTracking = async (shouldLeaveRide = true) => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (shouldLeaveRide) {
      getSocket().emit("leaveRide");
    }

    isTrackingRef.current = false;
    setTrackerState("idle");
    await releaseWakeLock();
  };

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const rideList = await fetchRides();

        if (!ignore) {
          setRides(rideList);
          setRideId((currentRideId) => currentRideId || rideList[0]?._id || "");
        }
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

    const handleConnect = () => {
      setSocketState("connected");

      if (isTrackingRef.current) {
        joinRide();
      }
    };

    const handleDisconnect = () => {
      setSocketState("disconnected");
    };

    const handleRideError = async (payload) => {
      setError(payload?.message || "Unable to join that ride.");
      await stopTracking(false);
    };

    const handleRideNote = (payload) => {
      if (payload?.rideId !== rideId) {
        return;
      }

      window.alert(`Ride note from ${payload.author}: ${payload.message}`);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && isTrackingRef.current) {
        requestWakeLock();
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("rideError", handleRideError);
    socket.on("rideNote", handleRideNote);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (socket.connected) {
      setSocketState("connected");
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("rideError", handleRideError);
      socket.off("rideNote", handleRideNote);
      stopTracking();
      disconnectSocket();
    };
  }, [rideId, userId]);

  const startTracking = async () => {
    if (!rideId.trim() || !userId.trim()) {
      setError("Select a ride and enter a rider ID before starting.");
      return;
    }

    if (!("geolocation" in navigator)) {
      setError("This browser does not support live geolocation.");
      return;
    }

    if (!isSecureTracker) {
      setError(
        "Live GPS on a phone needs HTTPS. Open this tracker from your deployed https:// site instead of a local http:// address.",
      );
      return;
    }

    setError("");
    setTrackerState("requesting");
    isTrackingRef.current = true;
    joinRide();
    await requestWakeLock();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed ?? 0,
          accuracy: position.coords.accuracy ?? null,
          timestamp: position.timestamp,
        };

        setCurrentLocation(nextLocation);
        setLastSentAt(Date.now());
        setTrackerState("tracking");
        setError("");

        getSocket().emit("locationUpdate", {
          rideId: rideId.trim(),
          cyclistId: userId.trim(),
          role: "cyclist",
          latitude: nextLocation.latitude,
          longitude: nextLocation.longitude,
          speed: nextLocation.speed,
          timestamp: nextLocation.timestamp,
        });
      },
      async (watchError) => {
        setError(watchError.message || "Unable to read your location.");
        await stopTracking();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 15000,
      },
    );
  };

  const trackerMeta = TRACKER_STATE[trackerState] || TRACKER_STATE.idle;

  const inputClass =
    "w-full border border-g-border rounded-lg px-4 py-2.5 text-sm text-g-ink bg-transparent placeholder-g-faint focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue transition";

  return (
    <div className="min-h-screen bg-g-bg flex flex-col">
      <Navbar
        title="AIT Live Tracker"
        subtitle="Use this page on a phone to stream real GPS updates"
      />

      <main className="flex-1 p-4 sm:p-5 max-w-3xl mx-auto w-full flex flex-col gap-4">
        <div className="bg-g-surface rounded-3xl shadow-g-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-2">
                Phone tracker
              </p>
              <h1 className="text-2xl font-semibold text-g-ink tracking-tight">
                Start live GPS tracking
              </h1>
              <p className="text-sm text-g-muted mt-2 max-w-xl leading-6">
                Keep this page open, allow location permission, and your live
                position will update on the ride monitor automatically.
              </p>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-g-blue-tint text-g-blue items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-g-surface rounded-2xl shadow-g-card px-4 py-3.5">
            <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-1">
              Socket
            </p>
            <p
              className={`text-sm font-medium capitalize ${
                socketState === "connected"
                  ? "text-g-green"
                  : socketState === "connecting"
                    ? "text-g-yellow"
                    : "text-g-red"
              }`}
            >
              {socketState}
            </p>
          </div>
          <div className="bg-g-surface rounded-2xl shadow-g-card px-4 py-3.5">
            <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-1">
              Tracker
            </p>
            <p className={`text-sm font-medium ${trackerMeta.color}`}>
              {trackerMeta.label}
            </p>
          </div>
          <div className="bg-g-surface rounded-2xl shadow-g-card px-4 py-3.5">
            <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-1">
              Security
            </p>
            <p
              className={`text-sm font-medium ${
                isSecureTracker ? "text-g-green" : "text-g-yellow"
              }`}
            >
              {isSecureTracker ? "HTTPS ready" : "Needs HTTPS"}
            </p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-g-yellow bg-g-yellow-tint rounded-2xl px-4 py-3 border border-g-yellow/20">
            {error}
          </div>
        )}

        {!isSecureTracker && (
          <div className="bg-g-surface rounded-2xl shadow-g-card p-4 border border-g-blue/10">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-g-blue shrink-0 mt-0.5" />
              <div className="text-sm text-g-muted leading-6">
                Live phone GPS works only on secure pages. Deploy the dashboard,
                open the tracker on an <span className="font-medium text-g-ink">https://</span> URL,
                and then tap Start Tracking.
              </div>
            </div>
          </div>
        )}

        <div className="bg-g-surface rounded-2xl shadow-g-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-g-faint mb-1.5">
                Ride
              </label>
              <select
                value={rideId}
                onChange={(event) => setRideId(event.target.value)}
                className={inputClass}
                disabled={trackerState === "tracking" || trackerState === "requesting"}
              >
                <option value="">Select a ride</option>
                {rides.map((ride) => (
                  <option key={ride._id} value={ride._id}>
                    {ride.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-g-faint mb-1.5">
                Rider ID
              </label>
              <input
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                placeholder="rider_01"
                className={inputClass}
                disabled={trackerState === "tracking" || trackerState === "requesting"}
              />
            </div>
          </div>

          {selectedRide && (
            <div className="mt-4 rounded-2xl bg-g-bg px-4 py-3">
              <p className="text-sm font-medium text-g-ink">{selectedRide.name}</p>
              <p className="text-xs text-g-muted mt-1">
                {selectedRide.destination || "No destination"} · Leader{" "}
                {selectedRide.leaderId || "TBA"}
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={startTracking}
              disabled={trackerState === "tracking" || trackerState === "requesting"}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-g-green px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a7a35] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Target className="w-4 h-4" />
              {trackerState === "requesting" ? "Starting..." : "Start tracking"}
            </button>
            <button
              type="button"
              onClick={() => stopTracking()}
              disabled={trackerState === "idle"}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-g-border px-5 py-3 text-sm font-medium text-g-muted transition hover:bg-g-bg hover:border-g-border-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {socketState === "connected" ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              Stop tracking
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-g-surface rounded-2xl shadow-g-card px-4 py-4">
            <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-1">
              Latitude
            </p>
            <p className="text-sm font-medium text-g-ink">
              {formatCoordinate(currentLocation?.latitude)}
            </p>
          </div>
          <div className="bg-g-surface rounded-2xl shadow-g-card px-4 py-4">
            <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-1">
              Longitude
            </p>
            <p className="text-sm font-medium text-g-ink">
              {formatCoordinate(currentLocation?.longitude)}
            </p>
          </div>
          <div className="bg-g-surface rounded-2xl shadow-g-card px-4 py-4">
            <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-1">
              Speed
            </p>
            <p className="text-sm font-medium text-g-ink">
              {Number.isFinite(currentLocation?.speed)
                ? `${currentLocation.speed.toFixed(2)} m/s`
                : "-"}
            </p>
          </div>
          <div className="bg-g-surface rounded-2xl shadow-g-card px-4 py-4">
            <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-1">
              Last update
            </p>
            <p className="text-sm font-medium text-g-ink">
              {formatTime(lastSentAt)}
            </p>
          </div>
        </div>

        <div className="bg-g-surface rounded-2xl shadow-g-card p-4">
          <p className="text-sm font-medium text-g-ink mb-2">Tracking tips</p>
          <ul className="text-sm text-g-muted leading-6 space-y-1">
            <li>Allow precise location access when your phone asks.</li>
            <li>Keep this page open while riding for the most reliable updates.</li>
            <li>Use the deployed HTTPS site on your phone, not a local HTTP address.</li>
            <li>Share the same ride ID with all riders so everyone appears on one map.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
