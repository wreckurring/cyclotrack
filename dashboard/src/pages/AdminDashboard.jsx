import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LiveMap from '../components/LiveMap';
import { useCyclists } from '../hooks/useCyclists';
import { List, MapPin, Plus, ArrowLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ride, setRide] = useState(null);
  const [form, setForm] = useState({ name: '', destination: '', leaderId: '' });
  const [creating, setCreating] = useState(false);

  const TripMonitor = ({ rideId, leaderId }) => {
    const cyclists = useCyclists(rideId, 'admin');

    return (
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 h-[50vh] flex flex-col">
        <div className="flex justify-between items-center px-4 pt-2 pb-4">
          <h2 className="font-semibold text-gray-800">Live Trip Map</h2>
          <span className="text-sm text-gray-500">Tracking all riders</span>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border border-gray-100">
          <LiveMap cyclists={cyclists} leaderId={leaderId} />
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!rideId) {
      setLoading(true);
      fetch(`${API_BASE}/api/rides`)
        .then(res => res.json())
        .then(setRides)
        .catch((err) => setError('Unable to fetch trips.'))
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      fetch(`${API_BASE}/api/rides/${rideId}`)
        .then(res => {
          if (!res.ok) throw new Error('Ride not found');
          return res.json();
        })
        .then(setRide)
        .catch((err) => setError(err.message || 'Unable to fetch trip'))
        .finally(() => setLoading(false));
    }
  }, [rideId]);

  const handleCreateRide = async () => {
    if (!form.name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const newRide = await res.json();
      setRides((prev) => [newRide, ...(prev || [])]);
      setForm({ name: '', destination: '', leaderId: '' });
      navigate(`/admin/${newRide._id}`);
    } catch (err) {
      setError('Could not create trip.');
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
              onClick={() => navigate('/admin')}
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
        </header>

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          <TripMonitor rideId={rideId} leaderId={ride?.leaderId} />

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Trip Details</h2>
                <p className="text-sm text-gray-500 mt-1">Monitoring ride activity, leader and riders in real-time.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Trip Name</p>
                <p className="text-sm font-semibold text-gray-900">{ride?.name || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Destination</p>
                <p className="text-sm font-semibold text-gray-900">{ride?.destination || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Ride Leader</p>
                <p className="text-sm font-semibold text-gray-900">{ride?.leaderId || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Started</p>
                <p className="text-sm font-semibold text-gray-900">
                  {ride?.startTime ? new Date(ride.startTime).toLocaleString() : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Rider Count</p>
                <p className="text-sm font-semibold text-gray-900">{ride?.participants?.length ?? 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{ride?.status || 'active'}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">
              {error}
            </div>
          )}
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
            <p className="text-sm text-gray-500">Monitor active trips and join the map view.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Trips</h2>
              <p className="text-sm text-gray-500">Select a trip to see real-time tracking and details.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Trip name"
                className="w-full sm:w-auto border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
              />
              <input
                value={form.destination}
                onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
                placeholder="Destination"
                className="w-full sm:w-auto border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
              />
              <input
                value={form.leaderId}
                onChange={(e) => setForm((prev) => ({ ...prev, leaderId: e.target.value }))}
                placeholder="Leader ID"
                className="w-full sm:w-auto border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50"
              />
              <button
                onClick={handleCreateRide}
                disabled={creating || !form.name.trim()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {creating ? 'Creating…' : 'Create Trip'}
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
              <div className="text-sm text-gray-500">Loading trips…</div>
            ) : rides.length === 0 ? (
              <div className="text-sm text-gray-500">No trips found. Create one using the form above.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {rides.map((ride) => (
                  <button
                    key={ride._id}
                    onClick={() => navigate(`/admin/${ride._id}`)}
                    className="text-left bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{ride.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{ride.destination || 'No destination'}</p>
                      </div>
                      <div className="text-xs text-gray-400">ID: {ride._id.slice(0, 6)}</div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>
                        <div className="font-medium text-gray-800">Leader</div>
                        <div>{ride.leaderId || '—'}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">Riders</div>
                        <div>{ride.participants?.length ?? 0}</div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-400">
                      {ride.startTime ? new Date(ride.startTime).toLocaleString() : '-'}
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
