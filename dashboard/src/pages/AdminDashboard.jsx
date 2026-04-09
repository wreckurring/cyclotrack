import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Plus } from "lucide-react";
import LiveMap from "../components/LiveMap";
import Navbar from "../components/Navbar";
import NoteHistoryPanel from "../components/NoteHistoryPanel";
import NotificationStack from "../components/NotificationStack";
import { useCyclists } from "../hooks/useCyclists";
import { completeRide, createRide, fetchRide, fetchRides } from "../services/api";
import { appendRideNote } from "../utils/rideNotes";

function StatCard({ label, value }) {
  return (
    <div className="bg-g-surface rounded-2xl shadow-g-card px-5 py-4">
      <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm font-medium text-g-ink">{value || "-"}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const [rides, setRides] = useState([]);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: "", destination: "", leaderId: "" });
  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const pushNotification = (title, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setNotifications((prev) => [{ id, title, message }, ...prev].slice(0, 4));

    setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 5000);
  };

  const liveRideId = ride?.status === "completed" ? null : rideId;
  const cyclists = useCyclists(
    liveRideId,
    rideId ? `admin-viewer-${rideId}` : "admin-viewer",
    {
      onCyclistDisconnected: ({ cyclistId }) => {
        pushNotification(
          "Rider disconnected",
          `${cyclistId} went offline during the ride.`,
        );
      },
      onRideNote: ({ author, message, timestamp }) => {
        setRide((prev) => appendRideNote(prev, { author, message, timestamp }));
        pushNotification("Ride note", `${author}: ${message}`);
      },
    },
  );

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        if (rideId) {
          const data = await fetchRide(rideId);
          if (!ignore) {
            setRide(data);
          }
        } else {
          const data = await fetchRides();
          if (!ignore) {
            setRides(data);
          }
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || "Unable to fetch rides.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [rideId]);

  const cyclistList = useMemo(() => Object.values(cyclists), [cyclists]);
  const totalRiders = cyclistList.length;

  const handleCreate = async () => {
    if (!form.name.trim()) {
      return;
    }

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
    } catch (createError) {
      setError(createError.message || "Could not create ride.");
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteRide = async () => {
    if (!rideId || ride?.status === "completed") {
      return;
    }

    setCompleting(true);
    setError(null);

    try {
      const updatedRide = await completeRide(rideId);
      setRide(updatedRide);
      setRides((prev) =>
        prev.map((item) => (item._id === updatedRide._id ? updatedRide : item)),
      );
      pushNotification(
        "Ride completed",
        `${updatedRide.name} has been marked as completed.`,
      );
    } catch (completionError) {
      setError(completionError.message || "Could not complete ride.");
    } finally {
      setCompleting(false);
    }
  };

  const inputClass =
    "w-full border border-g-border rounded-lg px-4 py-2.5 text-sm text-g-ink bg-transparent placeholder-g-faint focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue transition";

  if (rideId) {
    return (
      <div className="min-h-screen bg-g-bg flex flex-col">
        <NotificationStack
          notifications={notifications}
          onDismiss={(id) =>
            setNotifications((prev) => prev.filter((item) => item.id !== id))
          }
        />

        <Navbar
          title={ride?.name || "Trip Monitor"}
          subtitle={`Ride ID: ${rideId}`}
          backPath="/admin"
          badge={ride?.status === "completed" ? "Completed" : `${totalRiders} riders`}
        />

        <main className="flex-1 p-5 max-w-7xl mx-auto w-full flex flex-col gap-4">
          {error && (
            <div className="text-sm text-g-red bg-g-red-tint rounded-xl px-4 py-3">
              {error}
            </div>
          )}

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

          <div
            className="bg-g-surface rounded-2xl shadow-g-card overflow-hidden"
            style={{ height: "50vh" }}
          >
            <LiveMap cyclists={cyclists} leaderId={ride?.leaderId} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Trip name" value={ride?.name} />
            <StatCard label="Destination" value={ride?.destination} />
            <StatCard label="Leader" value={ride?.leaderId} />
            <StatCard
              label="Started"
              value={ride?.startTime ? new Date(ride.startTime).toLocaleTimeString() : null}
            />
            <StatCard label="Total riders" value={String(totalRiders)} />
            <StatCard label="Status" value={ride?.status} />
            <StatCard
              label="Completed at"
              value={ride?.endTime ? new Date(ride.endTime).toLocaleTimeString() : null}
            />
            <StatCard
              label="Latest note"
              value={ride?.note ? `${ride.noteAuthor || "Leader"} - ${ride.note}` : "No note"}
            />
          </div>

          <NoteHistoryPanel
            notes={ride?.notes}
            latestNote={{
              message: ride?.note,
              author: ride?.noteAuthor,
              timestamp: ride?.noteUpdatedAt,
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-g-bg flex flex-col">
      <Navbar title="Admin Dashboard" subtitle="Create rides and monitor trips" />
      <main className="flex-1 p-5 max-w-7xl mx-auto w-full flex flex-col gap-5">
        <div className="bg-g-surface rounded-2xl shadow-g-card p-5">
          <p className="text-sm font-medium text-g-ink mb-4">New Ride</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ride name *"
              className={inputClass}
            />
            <input
              value={form.destination}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, destination: event.target.value }))
              }
              placeholder="Destination"
              className={inputClass}
            />
            <input
              value={form.leaderId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, leaderId: event.target.value }))
              }
              placeholder="Leader ID"
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !form.name.trim()}
              className="inline-flex items-center justify-center gap-2 bg-g-blue hover:bg-g-blue-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-full px-5 py-2.5 text-sm transition"
            >
              <Plus className="w-4 h-4" />
              {creating ? "Creating..." : "Create ride"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-g-red">{error}</p>}
        </div>

        <div>
          <p className="text-xs font-medium text-g-faint uppercase tracking-wide mb-3">
            All rides
          </p>
          {loading ? (
            <p className="text-sm text-g-faint py-8 text-center">Loading rides...</p>
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
                      <h3 className="font-medium text-g-ink truncate group-hover:text-g-blue transition">
                        {item.name}
                      </h3>
                      <p className="text-sm text-g-muted mt-0.5 truncate">
                        {item.destination || "No destination"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${
                        item.status === "active"
                          ? "bg-g-green-tint text-g-green"
                          : "bg-g-bg text-g-muted"
                      }`}
                    >
                      {item.status || "active"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-g-bg">
                    <div>
                      <p className="text-xs text-g-faint mb-0.5">Leader</p>
                      <p className="text-xs font-medium text-g-ink-2 truncate">
                        {item.leaderId || "Unassigned"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-g-faint mb-0.5">Started</p>
                      <p className="text-xs font-medium text-g-ink-2">
                        {item.startTime
                          ? new Date(item.startTime).toLocaleTimeString()
                          : "Pending"}
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
