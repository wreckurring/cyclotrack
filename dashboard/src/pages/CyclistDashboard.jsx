import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, LogOut, MapPinned } from "lucide-react";
import { fetchRides } from "../services/api";

export default function CyclistDashboard() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadRides = async () => {
      setLoading(true);
      setError(null);

      try {
        const rideList = await fetchRides();
        if (!ignore) {
          setRides(rideList);
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

    loadRides();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6">
      <div className="max-w-4xl w-full space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-blue-600">
                <Bike className="w-7 h-7" />
              </div>
              <h1 className="mt-4 text-3xl font-bold text-gray-900">Rider Workspace</h1>
              <p className="mt-2 text-gray-500">
                Join one of the active rides from the mobile app. Use the ride ID below
                and enter your rider name or ID in the tracker.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors border border-gray-200 hover:bg-gray-50 rounded-lg px-4 py-2.5"
            >
              <LogOut className="w-4 h-4" /> Back
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <MapPinned className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Available Rides</h2>
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="text-sm text-gray-500">Loading rides...</div>
            ) : rides.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                No rides are available yet. Ask your club admin to create a ride.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {rides.map((ride) => (
                  <div
                    key={ride._id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">{ride.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {ride.destination || "No destination"}
                    </p>
                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                      <div>
                        <span className="font-medium">Ride ID:</span> {ride._id}
                      </div>
                      <div>
                        <span className="font-medium">Leader ID:</span>{" "}
                        {ride.leaderId || "Not assigned"}
                      </div>
                      <div>
                        <span className="font-medium">Started:</span>{" "}
                        {ride.startTime ? new Date(ride.startTime).toLocaleString() : "Pending"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
