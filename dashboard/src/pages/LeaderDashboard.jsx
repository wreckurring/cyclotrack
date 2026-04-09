import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, AlertCircle, Bike, CheckCircle2, Navigation, WifiOff } from "lucide-react";
import LiveMap from "../components/LiveMap";
import Navbar from "../components/Navbar";
import NotificationStack from "../components/NotificationStack";
import { useCyclists } from "../hooks/useCyclists";
import { completeRide, fetchRide, fetchRides } from "../services/api";

const STATUS = {
  moving:       { dot: "bg-g-green",  text: "text-g-green",  chip: "bg-g-green-tint text-g-green",  label: "Moving",       Icon: Navigation  },
  slow:         { dot: "bg-g-yellow", text: "text-g-yellow", chip: "bg-g-yellow-tint text-g-yellow", label: "Slow",         Icon: Activity    },
  stationary:   { dot: "bg-g-red",    text: "text-g-red",    chip: "bg-g-red-tint text-g-red",       label: "Stationary",   Icon: AlertCircle },
  disconnected: { dot: "bg-g-gray",   text: "text-g-gray",   chip: "bg-g-gray-tint text-g-gray",     label: "Disconnected", Icon: WifiOff     },
};
const DEF = { dot: "bg-g-blue", text: "text-g-blue", chip: "bg-g-blue-tint text-g-blue", label: "Active", Icon: Bike };

const gs = (s) => STATUS[s] || DEF;

function StatCard({ label, value }) {
  return (
    <div className="bg-g-surface rounded-2xl shadow-g-card px-5 py-4">
      <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-medium text-g-ink">{value || "—"}</p>
    </div>
  );
}

export default function LeaderDashboard() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [ride, setRide]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [completing, setCompleting] = useState(false);

  const liveRideId = ride?.status === "completed" ? null : rideId;
  const cyclists = useCyclists(
    liveRideId,
    rideId ? `leader-viewer-${rideId}` : "leader-viewer",
    {
      onCyclistDisconnected: ({ cyclistId }) => {
        const id = `${Date.now()}-${cyclistId}`;
        setNotifications((prev) => [
          {
            id,
            title: "Rider disconnected",
            message: `${cyclistId} went offline during the ride.`,
          },
          ...prev,
        ].slice(0, 4));

        setTimeout(() => {
          setNotifications((prev) => prev.filter((item) => item.id !== id));
        }, 5000);
      },
    },
  );

  useEffect(() => {
    let ignore = false;
    setLoading(true); setError(null);
    const load = async () => {
      try {
        if (rideId) { const d = await fetchRide(rideId);  if (!ignore) setRide(d); }
        else        { const d = await fetchRides();        if (!ignore) setRides(d); }
      } catch (err) { if (!ignore) setError(err.message || "Unable to load rides."); }
      finally       { if (!ignore) setLoading(false); }
    };
    load();
    return () => { ignore = true; };
  }, [rideId]);

  const cyclistList = Object.values(cyclists);
  const activeCount = cyclistList.filter((c) => c.status !== "disconnected").length;

  const handleCompleteRide = async () => {
    if (!rideId || ride?.status === "completed") {
      return;
    }

    setCompleting(true);
    setError(null);

    try {
      const updatedRide = await completeRide(rideId);
      setRide(updatedRide);

      const id = `${Date.now()}-ride-complete`;
      setNotifications((prev) => [
        {
          id,
          title: "Ride completed",
          message: `${updatedRide.name} has been marked as completed.`,
        },
        ...prev,
      ].slice(0, 4));

      setTimeout(() => {
        setNotifications((prev) => prev.filter((item) => item.id !== id));
      }, 5000);
    } catch (err) {
      setError(err.message || "Unable to complete the ride.");
    } finally {
      setCompleting(false);
    }
  };

  /* ── Rides list ── */
  if (!rideId) {
    return (
      <div className="min-h-screen bg-g-bg flex flex-col">
        <Navbar title="Leader Dashboard" subtitle="Select a ride to monitor" />
        <main className="flex-1 p-5 max-w-6xl mx-auto w-full">
          {error && <div className="mb-4 text-sm text-g-red bg-g-red-tint rounded-xl px-4 py-3">{error}</div>}

          {loading ? (
            <p className="text-sm text-g-faint py-12 text-center">Loading rides…</p>
          ) : rides.length === 0 ? (
            <div className="bg-g-surface rounded-2xl shadow-g-card p-12 text-center">
              <Bike className="w-10 h-10 text-g-border mx-auto mb-3" />
              <p className="text-g-muted text-sm">No rides yet — ask an admin to create one.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rides.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => navigate(`/leader/${item._id}`)}
                  className="bg-g-surface rounded-2xl shadow-g-card hover:shadow-g-card-hover text-left p-5 transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-medium text-g-ink truncate group-hover:text-g-blue transition">
                        {item.name}
                      </h2>
                      <p className="text-sm text-g-muted mt-0.5 truncate">
                        {item.destination || "No destination"}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${
                      item.status === "active" ? "bg-g-green-tint text-g-green" : "bg-g-bg text-g-muted"
                    }`}>
                      {item.status || "active"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-g-bg">
                    <div>
                      <p className="text-xs text-g-faint mb-0.5">Leader</p>
                      <p className="text-xs font-medium text-g-ink-2 truncate">{item.leaderId || "Unassigned"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-g-faint mb-0.5">Started</p>
                      <p className="text-xs font-medium text-g-ink-2">
                        {item.startTime ? new Date(item.startTime).toLocaleTimeString() : "Pending"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  /* ── Ride monitor ── */
  return (
    <div className="min-h-screen bg-g-bg flex flex-col">
      <NotificationStack
        notifications={notifications}
        onDismiss={(id) =>
          setNotifications((prev) => prev.filter((item) => item.id !== id))
        }
      />
      <Navbar
        title={ride?.name || "Ride Monitor"}
        subtitle={ride?.destination}
        backPath="/leader"
        badge={ride?.status === "completed" ? "Completed" : `${activeCount} active`}
      />
      <main className="flex-1 p-5 max-w-7xl mx-auto w-full flex flex-col gap-4">
        {error && <div className="text-sm text-g-red bg-g-red-tint rounded-xl px-4 py-3">{error}</div>}

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleCompleteRide}
            disabled={completing || ride?.status === "completed"}
            className="inline-flex items-center gap-2 rounded-full bg-g-green px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1a7a35] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {ride?.status === "completed"
              ? "Ride completed"
              : completing
                ? "Completing..."
                : "Mark ride complete"}
          </button>
        </div>

        {/* Map */}
        <div className="bg-g-surface rounded-2xl shadow-g-card overflow-hidden" style={{ height: "52vh" }}>
          <LiveMap cyclists={cyclists} leaderId={ride?.leaderId} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Leader"       value={ride?.leaderId} />
          <StatCard label="Destination"  value={ride?.destination} />
          <StatCard label="Started"      value={ride?.startTime ? new Date(ride.startTime).toLocaleTimeString() : null} />
          <StatCard label="Active riders" value={activeCount} />
          <StatCard label="Status" value={ride?.status} />
          <StatCard label="Completed at" value={ride?.endTime ? new Date(ride.endTime).toLocaleTimeString() : null} />
        </div>

        {/* Cyclists */}
        <div>
          <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-3">
            Riders ({cyclistList.length})
          </p>
          {cyclistList.length === 0 ? (
            <div className="bg-g-surface rounded-2xl shadow-g-card p-8 text-center">
              <p className="text-g-muted text-sm">Waiting for riders to join…</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {cyclistList.map((cyclist) => {
                const s = gs(cyclist.status);
                return (
                  <div key={cyclist.cyclistId} className="bg-g-surface rounded-2xl shadow-g-card p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <p className="text-sm font-medium text-g-ink truncate">{cyclist.cyclistId}</p>
                      <s.Icon className={`w-4 h-4 shrink-0 ${s.text}`} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-g-faint">{cyclist.speed.toFixed(1)} m/s</span>
                      <span className={`flex items-center gap-1.5 font-medium rounded-full px-2 py-0.5 ${s.chip}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
