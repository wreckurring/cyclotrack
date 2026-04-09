import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import LiveMap from "../components/LiveMap";
import Navbar from "../components/Navbar";
import { useCyclists } from "../hooks/useCyclists";
import { createRide, fetchRide, fetchRides } from "../services/api";

function StatCard({ label, value }) {
  return (
    <div className="bg-g-surface rounded-2xl shadow-g-card px-5 py-4">
      <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-medium text-g-ink">{value || "—"}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const cyclists = useCyclists(rideId, rideId ? `admin-viewer-${rideId}` : "admin-viewer");

  const [rides, setRides]   = useState([]);
  const [ride, setRide]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [form, setForm]     = useState({ name: "", destination: "", leaderId: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true); setError(null);
    const load = async () => {
      try {
        if (rideId) { const d = await fetchRide(rideId);  if (!ignore) setRide(d); }
        else        { const d = await fetchRides();        if (!ignore) setRides(d); }
      } catch (err) { if (!ignore) setError(err.message || "Unable to fetch rides."); }
      finally       { if (!ignore) setLoading(false); }
    };
    load();
    return () => { ignore = true; };
  }, [rideId]);

  const activeCount = Object.values(cyclists).filter((c) => c.status !== "disconnected").length;

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true); setError(null);
    try {
      const newRide = await createRide({
        name: form.name.trim(),
        destination: form.destination.trim(),
        leaderId: form.leaderId.trim(),
      });
      setRides((p) => [newRide, ...p]);
      setForm({ name: "", destination: "", leaderId: "" });
      navigate(`/admin/${newRide._id}`);
    } catch (err) {
      setError(err.message || "Could not create ride.");
    } finally {
      setCreating(false);
    }
  };

  const inputClass =
    "w-full border border-g-border rounded-lg px-4 py-2.5 text-sm text-g-ink bg-transparent placeholder-g-faint focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue transition";

  /* ── Trip monitor ── */
  if (rideId) {
    return (
      <div className="min-h-screen bg-g-bg flex flex-col">
        <Navbar title={ride?.name || "Trip Monitor"} subtitle={`Ride ID: ${rideId}`} backPath="/admin" badge={`${activeCount} active`} />
        <main className="flex-1 p-5 max-w-7xl mx-auto w-full flex flex-col gap-4">
          {error && <div className="text-sm text-g-red bg-g-red-tint rounded-xl px-4 py-3">{error}</div>}

          <div className="bg-g-surface rounded-2xl shadow-g-card overflow-hidden" style={{ height: "50vh" }}>
            <LiveMap cyclists={cyclists} leaderId={ride?.leaderId} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Trip Name"     value={ride?.name} />
            <StatCard label="Destination"   value={ride?.destination} />
            <StatCard label="Leader"        value={ride?.leaderId} />
            <StatCard label="Started"       value={ride?.startTime ? new Date(ride.startTime).toLocaleTimeString() : null} />
            <StatCard label="Active riders" value={activeCount} />
            <StatCard label="Status"        value={ride?.status} />
          </div>
        </main>
      </div>
    );
  }

  /* ── Rides list ── */
  return (
    <div className="min-h-screen bg-g-bg flex flex-col">
      <Navbar title="Admin Dashboard" subtitle="Create rides and monitor trips" />
      <main className="flex-1 p-5 max-w-7xl mx-auto w-full flex flex-col gap-5">

        {/* Create form */}
        <div className="bg-g-surface rounded-2xl shadow-g-card p-5">
          <p className="text-sm font-medium text-g-ink mb-4">New Ride</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ride name *" className={inputClass} />
            <input value={form.destination}
              onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
              placeholder="Destination" className={inputClass} />
            <input value={form.leaderId}
              onChange={(e) => setForm((p) => ({ ...p, leaderId: e.target.value }))}
              placeholder="Leader ID" className={inputClass} />
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !form.name.trim()}
              className="inline-flex items-center justify-center gap-2 bg-g-blue hover:bg-g-blue-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-full px-5 py-2.5 text-sm transition"
            >
              <Plus className="w-4 h-4" />
              {creating ? "Creating…" : "Create Ride"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-g-red">{error}</p>}
        </div>

        {/* Rides */}
        <div>
          <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-3">All Rides</p>
          {loading ? (
            <p className="text-sm text-g-faint py-8 text-center">Loading rides…</p>
          ) : rides.length === 0 ? (
            <div className="bg-g-surface rounded-2xl shadow-g-card p-10 text-center">
              <p className="text-g-muted text-sm">No rides found. Create one above.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rides.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => navigate(`/admin/${item._id}`)}
                  className="bg-g-surface rounded-2xl shadow-g-card hover:shadow-g-card-hover text-left p-5 transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium text-g-ink truncate group-hover:text-g-blue transition">{item.name}</h3>
                      <p className="text-sm text-g-muted mt-0.5 truncate">{item.destination || "No destination"}</p>
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
                  <p className="mt-3 text-xs text-g-border font-mono truncate">{item._id}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
