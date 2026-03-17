import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './src/pages/Login';
import LeaderDashboard from './src/pages/LeaderDashboard';
import CyclistDashboard from './src/pages/CyclistDashboard';
import AdminDashboard from './src/pages/AdminDashboard';
import './src/index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/leader" element={<LeaderDashboard />} />
        <Route path="/cyclist" element={<CyclistDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/:rideId" element={<AdminDashboard />} />
        {/* Fallback to login if route doesn't exist */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;