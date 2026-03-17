import React from 'react';
import { Smartphone, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CyclistDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 inline-flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Smartphone className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Use the Mobile App</h2>
          <p className="text-gray-500 mb-6">
            Ride leaders and cyclists both track location via the mobile app. Make sure the trip ID and your rider ID match the ride configured in the admin dashboard.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 w-full text-gray-600 hover:text-gray-900 font-medium transition-colors border border-gray-200 hover:bg-gray-50 rounded-lg py-2.5"
          >
            <LogOut className="w-4 h-4" /> Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}