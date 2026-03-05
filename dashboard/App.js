import React from 'react';
import LiveMap from './components/LiveMap';
import './index.css';

function App() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for Ride Info */}
      <div className="w-64 bg-white shadow-md flex flex-col z-10">
        <div className="p-4 bg-blue-600 text-white font-bold text-xl">
          Group Leader Panel
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Active Ride
          </h2>
          <p className="text-gray-800 font-medium">Weekend Century Route</p>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Legend</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Moving</li>
              <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span> Slow (< 0.5 m/s)</li>
              <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Stationary</li>
              <li className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span> Disconnected</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <LiveMap />
      </div>
    </div>
  );
}

export default App;