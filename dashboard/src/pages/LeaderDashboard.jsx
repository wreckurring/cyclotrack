import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bike,
  MapPin,
  Navigation,
  WifiOff,
} from "lucide-react";
import LiveMap from "../components/LiveMap";
import { useCyclists } from "../hooks/useCyclists";
import { fetchRide, fetchRides } from "../services/api";

const getStatusConfig = (status) => {
  switch (status) {
    case "moving":
      return {
        color: "bg-green-500",
        text: "text-green-700",
        bg: "bg-green-50",
        icon: Navigation,
      };
    case "slow":
      return {
        color: "bg-yellow-400",
        text: "text-yellow-700",
        bg: "bg-yellow-50",
        icon: Activity,
      };
    case "stationary":
      return {
        color: "bg-red-500",
        text: "text-red-700",
        bg: "bg-red-50",
        icon: AlertCircle,
      };
    case "disconnected":
      return {
        color: "bg-gray-400",
        text: "text-gray-700",
        bg: "bg-gray-50",
        icon: WifiOff,
      };
    default:
      return {
        color: "bg-blue-500",
        text: "text-blue-700",
        bg: "bg-blue-50",
        icon: Bike,
      };
  }
};

export default function LeaderDashboard() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const cyclists = useCyclists(rideId, rideId ? `leader-viewer-${rideId}` : "leader-viewer");

  const [rides, setRides] = useState([]);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
          setError(loadError.message || "Unable to load rides.");
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

  const cyclistList = Object.values(cyclists);
  const activeCyclists = cyclistList.filter(
    (cyclist) => cyclist.status !== "disconnected",
  );

  if (!rideId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Leader Dashboard</h1>
              <p className="text-sm text-gray-500">Choose a ride to monitor live.</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
              Loading rides...
            </div>
          ) : rides.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
              No rides available yet. Ask an admin to create one first.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rides.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => navigate(`/leader/${item._id}`)}
                  className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.destination || "No destination"}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {item.status || "active"}
                    </span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400">Leader</div>
                      <div className="mt-1 font-medium text-gray-800">
                        {item.leaderId || "Unassigned"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400">Started</div>
                      <div className="mt-1 font-medium text-gray-800">
                        {item.startTime
                          ? new Date(item.startTime).toLocaleString()
                          : "Pending"}
                      </div>
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/leader")}
            className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Navigation className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ride Monitor</h1>
              <p className="text-sm text-gray-500">{ride?.name || rideId}</p>
            </div>
          </div>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 border border-blue-100">
          {activeCyclists.length} active riders
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 h-[55vh] flex flex-col">
          <div className="flex justify-between items-center px-4 pt-2 pb-4">
            <div>
              <h2 className="font-semibold text-gray-800">Live Route Map</h2>
              <p className="text-sm text-gray-500">
                {ride?.destination || "Tracking the current ride group."}
              </p>
            </div>
            <span className="text-sm text-gray-500">Ride ID: {rideId}</span>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-gray-100">
            <LiveMap cyclists={cyclists} leaderId={ride?.leaderId} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-400">Leader ID</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">
              {ride?.leaderId || "Not set"}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-400">Destination</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">
              {ride?.destination || "No destination"}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-400">Started</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">
              {ride?.startTime ? new Date(ride.startTime).toLocaleString() : "Pending"}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 px-1">Cyclists</h2>

          {cyclistList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
              Waiting for riders to join from the mobile app...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cyclistList.map((cyclist) => {
                const config = getStatusConfig(cyclist.status);
                const Icon = config.icon;

                return (
                  <div
                    key={cyclist.cyclistId}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                          Rider ID
                        </p>
                        <p className="font-semibold text-gray-900">{cyclist.cyclistId}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${config.bg}`}>
                        <Icon className={`w-5 h-5 ${config.text}`} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-gray-50">
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-1">Speed</p>
                        <p className="font-medium text-gray-700">
                          {cyclist.speed.toFixed(1)} m/s
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-1">Status</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
                          <span className={`text-sm font-medium capitalize ${config.text}`}>
                            {cyclist.status}
                          </span>
                        </div>
                      </div>
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
