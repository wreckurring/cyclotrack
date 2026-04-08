import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bike, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ title, subtitle, backPath, badge }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {backPath && (
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Bike className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{title}</p>
            {subtitle && (
              <p className="text-xs text-zinc-500 truncate">{subtitle}</p>
            )}
          </div>
          {badge && (
            <span className="ml-2 shrink-0 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-medium text-cyan-400">
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-zinc-300">{user?.username}</p>
            <p className="text-xs text-zinc-600 capitalize">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
