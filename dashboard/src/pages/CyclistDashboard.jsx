import React, { useEffect, useState } from "react";
import { Bike, Copy, MapPin } from "lucide-react";
import Navbar from "../components/Navbar";
import { fetchRides } from "../services/api";

export default function CyclistDashboard() {
  const [rides, setRides]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [copied, setCopied]   = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    const load = async () => {
      try {
        const data = await fetchRides();
        if (!ignore) setRides(data);
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to fetch rides.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  const copyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-g-bg flex flex-col">
      <Navbar title="Rider Workspace" subtitle="Active rides you can join" />

      <main className="flex-1 p-5 max-w-4xl mx-auto w-full">
        {error && (
          <div className="mb-4 text-sm text-g-red bg-g-red-tint rounded-xl px-4 py-3">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-g-faint py-12 text-center">Loading rides…</p>
        ) : rides.length === 0 ? (
          <div className="bg-g-surface rounded-2xl shadow-g-card p-12 text-center">
            <Bike className="w-10 h-10 text-g-border mx-auto mb-3" />
            <p className="text-g-muted text-sm">No rides available.</p>
            <p className="text-g-faint text-xs mt-1">Ask your admin to create a ride.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-g-faint mb-4">
              Copy a Ride ID and enter it in the mobile tracker to join.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {rides.map((ride) => (
                <div key={ride._id} className="bg-g-surface rounded-2xl shadow-g-card p-5">

                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-xl bg-g-blue-tint shrink-0">
                      <MapPin className="w-4 h-4 text-g-blue" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-g-ink truncate">{ride.name}</h3>
                      <p className="text-sm text-g-muted mt-0.5">
                        {ride.destination || "No destination"}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${
                      ride.status === "active"
                        ? "bg-g-green-tint text-g-green"
                        : "bg-g-bg text-g-muted"
                    }`}>
                      {ride.status || "active"}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="mt-4 pt-4 border-t border-g-bg space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-g-faint mb-0.5">Ride ID</p>
                        <p className="text-xs font-mono text-g-muted truncate">{ride._id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyId(ride._id)}
                        className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                          copied === ride._id
                            ? "bg-g-green-tint border-g-green/30 text-g-green"
                            : "bg-g-bg border-g-border text-g-muted hover:border-g-border-strong hover:text-g-ink-2"
                        }`}
                      >
                        <Copy className="w-3 h-3" />
                        {copied === ride._id ? "Copied!" : "Copy"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-g-faint mb-0.5">Leader</p>
                        <p className="text-xs font-medium text-g-ink-2">
                          {ride.leaderId || "Not assigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-g-faint mb-0.5">Started</p>
                        <p className="text-xs font-medium text-g-ink-2">
                          {ride.startTime
                            ? new Date(ride.startTime).toLocaleTimeString()
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
