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
    <header className="sticky top-0 z-20 bg-g-surface shadow-g-nav">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">

        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          {backPath && (
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="p-2 rounded-full text-g-muted hover:bg-g-bg transition shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* App icon */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-g-blue shrink-0">
            <Bike className="w-4 h-4 text-white" />
          </div>

          <div className="min-w-0 ml-1">
            <p className="text-base font-medium text-g-ink truncate leading-tight">{title}</p>
            {subtitle && (
              <p className="text-xs text-g-muted truncate leading-tight">{subtitle}</p>
            )}
          </div>

          {badge && (
            <span className="ml-2 shrink-0 rounded-full bg-g-blue-tint px-3 py-0.5 text-xs font-medium text-g-blue border border-g-blue/20">
              {badge}
            </span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:block text-right mr-1">
            <p className="text-sm font-medium text-g-ink-2 leading-tight">{user?.username}</p>
            <p className="text-xs text-g-faint capitalize leading-tight">{user?.role}</p>
          </div>

          {/* Avatar circle */}
          <div className="w-8 h-8 rounded-full bg-g-blue flex items-center justify-center text-white text-sm font-medium shrink-0">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="p-2 rounded-full text-g-muted hover:bg-g-red-tint hover:text-g-red transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
