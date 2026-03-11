import React from 'react';
import LiveMap from '../components/LiveMap';
import { useCyclists } from '../hooks/useCyclists';
import { Navigation, Activity, AlertCircle, WifiOff } from 'lucide-react';

export default function LeaderDashboard() {
  const cyclists = useCyclists('ride_999');

  const getStatusConfig = (status) => {
    switch(status) {
      case 'moving': return { color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', icon: Navigation };
      case 'slow': return { color: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50', icon: Activity };
      case 'stationary': return { color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', icon: AlertCircle };
      case 'disconnected': return { color: 'bg-gray-400', text: 'text-gray-700', bg: 'bg-gray-50', icon: WifiOff };
      default: return { color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', icon: Navigation };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Navigation className="text-blue-600" /> CycloTrack
        </h1>
        <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
          Leader Dashboard
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        {/* Top Section: Map */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 h-[55vh] flex flex-col">
          <div className="flex justify-between items-center px-4 pt-2 pb-4">
            <h2 className="font-semibold text-gray-800">Live Route Map</h2>
            <span className="text-sm text-gray-500">Ride ID: #999</span>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-gray-100">
            <LiveMap cyclists={cyclists} />
          </div>
        </div>

        {/* Bottom Section: Rider Details */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 px-1">Active Cyclists</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.values(cyclists).length === 0 ? (
              <div className="col-span-full py-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-200 border-dashed">
                Waiting for cyclists to connect...
              </div>
            ) : (
              Object.values(cyclists).map((cyclist) => {
                const config = getStatusConfig(cyclist.status);
                const Icon = config.icon;
                
                return (
                  <div key={cyclist.cyclistId} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col gap-3 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Rider ID</p>
                        <p className="font-semibold text-gray-900">{cyclist.cyclistId}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${config.bg}`}>
                        <Icon className={`w-5 h-5 ${config.text}`} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-gray-50">
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-1">Speed</p>
                        <p className="font-medium text-gray-700">{cyclist.speed.toFixed(1)} m/s</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-1">Status</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
                          <span className={`text-sm font-medium capitalize ${config.text}`}>{cyclist.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </main>
    </div>
  );
}