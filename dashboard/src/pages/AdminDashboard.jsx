import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import LiveMap from "../components/LiveMap";
import Navbar from "../components/Navbar";
import { useCyclists } from "../hooks/useCyclists";
import { createRide, fetchRide, fetchRides } from "../services/api";

function StatCard({ label, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">{value || "—"}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const cyclists = useCyclists(
    rideId,
    rideId ? `admin-viewer-${rideId}` : "admin-viewer"
  );

  const [rides, setRides] = useState([]);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", destination: "", leaderId: "" });
  const [creating, setCreating] = useState(false);

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
        if (!ignore) setError(err.message || "Unable to fetch rides.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => { ignore = true; };
  }, [rideId]);

  const activeCount = Object.values(cyclists).filter(
    (c) => c.status !== "disconnected"
  ).length;

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const newRide = await createRide({
        name: form.name.trim(),
        destination: form.destination.trim(),
        leaderId: form.leaderId.trim(),
      });
      setRides((prev) => [newRide, ...prev]);
      setForm({ name: "", destination: "", leaderId: "" });
      navigate(`/admin/${newRide._id}`);
    } catch (err) {
      setError(err.message || "Could not create ride.");
    } finally {
      setCreating(false);
    }
  };

  const inputClass =
    "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition";

  if (rideId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar
          title={ride?.name || "Trip Monitor"}
          subtitle={`Ride ID: ${rideId}`}
          backPath="/admin"
          badge={`${activeCount} active`}
        />

        <main className="flex-1 p-5 max-w-7xl mx-auto w-full flex flex-col gap-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Map */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden" style={{ height: "50vh" }}>
            <LiveMap cyclists={cyclists} leaderId={ride?.leaderId} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Trip Name" value={ride?.name} />
            <StatCard label="Destination" value={ride?.destination} />
            <StatCard label="Leader" value={ride?.leaderId} />
            <StatCard
              label="Started"
              value={ride?.startTime ? new Date(ride.startTime).toLocaleTimeString() : null}
            />
            <StatCard label="Active riders" value={activeCount} />
            <StatCard label="Status" value={ride?.status} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar title="Admin Dashboard" subtitle="Create rides and monitor trips" />

      <main className="flex-1 p-5 max-w-7xl mx-auto w-full flex flex-col gap-5">

        {/* Create ride form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">New Ride</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ride name *"
              className={inputClass}
            />
            <input
              value={form.destination}
              onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
              placeholder="Destination"
              className={inputClass}
            />
            <input
              value={form.leaderId}
              onChange={(e) => setForm((p) => ({ ...p, leaderId: e.target.value }))}
              placeholder="Leader ID"
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !form.name.trim()}
              className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-semibold rounded-xl px-4 py-2.5 text-sm transition"
            >
              <Plus className="w-4 h-4" />
              {creating ? "Creating…" : "Create Ride"}
            </button>
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </div>

        {/* Rides list */}
        <div>
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
            All Rides
          </h2>

          {loading ? (
            <div className="text-sm text-zinc-500 py-8 text-center">Loading rides…</div>
          ) : rides.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
              <p className="text-zinc-600 text-sm">No rides found. Create one above.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rides.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => navigate(`/admin/${item._id}`)}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left hover:border-zinc-600 hover:-translate-y-0.5 transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate group-hover:text-cyan-400 transition">
                        {item.name}
                      </h3>
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
                  <p className="mt-3 text-xs text-zinc-700 font-mono">{item._id}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
