import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./src/context/AuthContext";
import ProtectedRoute from "./src/components/ProtectedRoute";
import Login from "./src/pages/Login";
import LeaderDashboard from "./src/pages/LeaderDashboard";
import CyclistDashboard from "./src/pages/CyclistDashboard";
import AdminDashboard from "./src/pages/AdminDashboard";
import BrowserTracker from "./src/pages/BrowserTracker";
import "./src/index.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/leader"
            element={
              <ProtectedRoute>
                <LeaderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leader/:rideId"
            element={
              <ProtectedRoute>
                <LeaderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cyclist"
            element={
              <ProtectedRoute>
                <CyclistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/phone"
            element={
              <ProtectedRoute>
                <BrowserTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/:rideId"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
