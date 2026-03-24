import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, List, MapPin, Plus } from "lucide-react";
import LiveMap from "../components/LiveMap";
import { useCyclists } from "../hooks/useCyclists";
import { createRide, fetchRide, fetchRides } from "../services/api";

export default function AdminDashboard() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const cyclists = useCyclists(rideId, rideId ? `admin-viewer-${rideId}` : "admin-viewer");

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ride, setRide] = useState(null);
  const [form, setForm] = useState({ name: "", destination: "", leaderId: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (rideId) {
          const selectedRide = await fetchRide(rideId);
          if (!ignore) {
            setRide(selectedRide);
          }
        } else {
          const rideList = await fetchRides();
          if (!ignore) {
            setRides(rideList);
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

  const activeCyclists = Object.values(cyclists).filter(
    (cyclist) => cyclist.status !== "disconnected",
  );

  const handleCreateRide = async () => {
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

  if (rideId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Trip Monitor</h1>
                <p className="text-sm text-gray-500">Ride ID: {rideId}</p>
              </div>
            </div>
          </div>
          <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 border border-blue-100">
            {activeCyclists.length} active riders
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">
              {error}
            </div>
          )}

          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 h-[50vh] flex flex-col">
            <div className="flex justify-between items-center px-4 pt-2 pb-4">
              <div>
                <h2 className="font-semibold text-gray-800">Live Trip Map</h2>
                <p className="text-sm text-gray-500">
                  {ride?.destination || "Tracking all active riders on this ride."}
                </p>
              </div>
              <span className="text-sm text-gray-500">Monitoring ride activity</span>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden border border-gray-100">
              <LiveMap cyclists={cyclists} leaderId={ride?.leaderId} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Trip Details</h2>
              <p className="text-sm text-gray-500 mt-1">
                Real-time ride overview for operations and support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Trip Name</p>
                <p className="text-sm font-semibold text-gray-900">{ride?.name || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Destination</p>
                <p className="text-sm font-semibold text-gray-900">
                  {ride?.destination || "-"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Ride Leader</p>
                <p className="text-sm font-semibold text-gray-900">{ride?.leaderId || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Started</p>
                <p className="text-sm font-semibold text-gray-900">
                  {ride?.startTime ? new Date(ride.startTime).toLocaleString() : "-"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Active Riders</p>
                <p className="text-sm font-semibold text-gray-900">{activeCyclists.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {ride?.status || "active"}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <List className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Create rides and open any live monitor.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Rides</h2>
              <p className="text-sm text-gray-500">
                Start a new trip or reopen an active ride monitor.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Ride name"
                className="w-full sm:w-auto border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
              />
              <input
                value={form.destination}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, destination: event.target.value }))
                }
                placeholder="Destination"
                className="w-full sm:w-auto border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
              />
              <input
                value={form.leaderId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, leaderId: event.target.value }))
                }
                placeholder="Leader ID"
                className="w-full sm:w-auto border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
              />
              <button
                type="button"
                onClick={handleCreateRide}
                disabled={creating || !form.name.trim()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {creating ? "Creating..." : "Create Trip"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">
              {error}
            </div>
          )}

          <div className="mt-6">
            {loading ? (
              <div className="text-sm text-gray-500">Loading rides...</div>
            ) : rides.length === 0 ? (
              <div className="text-sm text-gray-500">
                No rides found. Create one using the form above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {rides.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => navigate(`/admin/${item._id}`)}
                    className="text-left bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.destination || "No destination"}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">ID: {item._id.slice(0, 6)}</div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>
                        <div className="font-medium text-gray-800">Leader</div>
                        <div>{item.leaderId || "-"}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">Status</div>
                        <div className="capitalize">{item.status || "active"}</div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-400">
                      {item.startTime ? new Date(item.startTime).toLocaleString() : "-"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
