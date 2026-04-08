import React, { useEffect, useState } from "react";
import { Bike, Copy, MapPin } from "lucide-react";
import Navbar from "../components/Navbar";
import { fetchRides } from "../services/api";

export default function CyclistDashboard() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

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
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar title="Rider Workspace" subtitle="Active rides you can join" />

      <main className="flex-1 p-5 max-w-4xl mx-auto w-full">
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
            <p className="text-zinc-500 text-sm">No rides available.</p>
            <p className="text-zinc-700 text-xs mt-1">Ask your admin to create a ride.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-600 mb-4">
              Copy a Ride ID and enter it in the mobile tracker to join.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {rides.map((ride) => (
                <div
                  key={ride._id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-cyan-500/10">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white truncate">{ride.name}</h3>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        {ride.destination || "No destination"}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                      ride.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}>
                      {ride.status || "active"}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-600 mb-0.5">Ride ID</p>
                        <p className="text-xs font-mono text-zinc-300 truncate">{ride._id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyId(ride._id)}
                        className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition ${
                          copied === ride._id
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                        }`}
                      >
                        <Copy className="w-3 h-3" />
                        {copied === ride._id ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-zinc-600 mb-0.5">Leader</p>
                        <p className="text-xs font-medium text-zinc-400">
                          {ride.leaderId || "Not assigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-600 mb-0.5">Started</p>
                        <p className="text-xs font-medium text-zinc-400">
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
