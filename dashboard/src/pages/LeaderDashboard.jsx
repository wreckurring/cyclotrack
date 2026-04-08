import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  Bike,
  Navigation,
  WifiOff,
} from "lucide-react";
import LiveMap from "../components/LiveMap";
import Navbar from "../components/Navbar";
import { useCyclists } from "../hooks/useCyclists";
import { fetchRide, fetchRides } from "../services/api";

const STATUS = {
  moving: { dot: "bg-emerald-400", text: "text-emerald-400", label: "Moving", Icon: Navigation },
  slow: { dot: "bg-amber-400", text: "text-amber-400", label: "Slow", Icon: Activity },
  stationary: { dot: "bg-red-400", text: "text-red-400", label: "Stationary", Icon: AlertCircle },
  disconnected: { dot: "bg-zinc-600", text: "text-zinc-500", label: "Disconnected", Icon: WifiOff },
};
const defaultStatus = { dot: "bg-cyan-400", text: "text-cyan-400", label: "Active", Icon: Bike };

function getStatus(s) {
  return STATUS[s] || defaultStatus;
}

function StatCard({ label, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">{value || "—"}</p>
    </div>
  );
}

export default function LeaderDashboard() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const cyclists = useCyclists(
    rideId,
    rideId ? `leader-viewer-${rideId}` : "leader-viewer"
  );

  const [rides, setRides] = useState([]);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        if (rideId) {
          const data = await fetchRide(rideId);
          if (!ignore) setRide(data);
        } else {
          const data = await fetchRides();
          if (!ignore) setRides(data);
        }
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to load rides.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => { ignore = true; };
  }, [rideId]);

  const cyclistList = Object.values(cyclists);
  const activeCount = cyclistList.filter((c) => c.status !== "disconnected").length;

  if (!rideId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar title="Leader Dashboard" subtitle="Select a ride to monitor" />

        <main className="flex-1 p-5 max-w-6xl mx-auto w-full">
          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-sm text-zinc-500 py-12 text-center">Loading rides…</div>
          ) : rides.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center">
              <Bike className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No rides yet. Ask an admin to create one.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rides.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => navigate(`/leader/${item._id}`)}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left hover:border-zinc-600 hover:-translate-y-0.5 transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-white truncate group-hover:text-cyan-400 transition">
                        {item.name}
                      </h2>
                      <p className="text-sm text-zinc-500 mt-0.5 truncate">
                        {item.destination || "No destination"}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                      item.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}>
                      {item.status || "active"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
                    <div>
                      <p className="text-xs text-zinc-600 mb-0.5">Leader</p>
                      <p className="text-xs font-medium text-zinc-300 truncate">
                        {item.leaderId || "Unassigned"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 mb-0.5">Started</p>
                      <p className="text-xs font-medium text-zinc-300">
                        {item.startTime
                          ? new Date(item.startTime).toLocaleTimeString()
                          : "Pending"}
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

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar
        title={ride?.name || "Ride Monitor"}
        subtitle={ride?.destination}
        backPath="/leader"
        badge={`${activeCount} active`}
      />

      <main className="flex-1 p-5 max-w-7xl mx-auto w-full flex flex-col gap-4">
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Map */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden" style={{ height: "52vh" }}>
          <LiveMap cyclists={cyclists} leaderId={ride?.leaderId} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Leader" value={ride?.leaderId} />
          <StatCard label="Destination" value={ride?.destination} />
          <StatCard
            label="Started"
            value={ride?.startTime ? new Date(ride.startTime).toLocaleTimeString() : null}
          />
          <StatCard label="Active riders" value={activeCount} />
        </div>

        {/* Cyclists */}
        <div>
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
            Riders ({cyclistList.length})
          </h2>

          {cyclistList.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-2xl p-8 text-center">
              <p className="text-zinc-600 text-sm">Waiting for riders to join…</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {cyclistList.map((cyclist) => {
                const s = getStatus(cyclist.status);
                return (
                  <div
                    key={cyclist.cyclistId}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <p className="text-sm font-medium text-white truncate">
                        {cyclist.cyclistId}
                      </p>
                      <s.Icon className={`w-4 h-4 shrink-0 ${s.text}`} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">{cyclist.speed.toFixed(1)} m/s</span>
                      <span className={`flex items-center gap-1 font-medium ${s.text}`}>
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
