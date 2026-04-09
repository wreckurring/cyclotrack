import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { id: "cyclist", label: "Rider" },
  { id: "leader", label: "Leader" },
  { id: "admin",   label: "Admin"  },
];

const PATHS = { cyclist: "/cyclist", leader: "/leader", admin: "/admin" };

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim())   { setError("Enter your username."); return; }
    if (password.length < 4){ setError("Password must be at least 4 characters."); return; }
    if (!role)               { setError("Choose a role to continue."); return; }
    login(username.trim(), role);
    navigate(PATHS[role]);
  };

  return (
    <div className="min-h-screen bg-g-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">

        {/* Card — matches Google accounts.google.com style */}
        <div className="bg-g-surface rounded-3xl shadow-g-card px-10 py-10">

          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-g-blue-tint mb-5">
              <Bike className="w-6 h-6 text-g-blue" />
            </div>
            <h1 className="text-2xl font-normal text-g-ink tracking-tight">Sign in</h1>
            <p className="text-sm text-g-muted mt-1">to continue to CycloTrack</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=" "
                autoComplete="username"
                className="peer w-full border border-g-border rounded-lg px-4 pt-5 pb-2.5 text-sm text-g-ink bg-transparent focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue transition"
              />
              <label
                htmlFor="username"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-g-faint pointer-events-none transition-all
                  peer-focus:top-3.5 peer-focus:text-xs peer-focus:text-g-blue
                  peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-g-muted"
              >
                Username
              </label>
            </div>

            {/* Password */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                autoComplete="current-password"
                className="peer w-full border border-g-border rounded-lg px-4 pt-5 pb-2.5 pr-10 text-sm text-g-ink bg-transparent focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue transition"
              />
              <label
                htmlFor="password"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-g-faint pointer-events-none transition-all
                  peer-focus:top-3.5 peer-focus:text-xs peer-focus:text-g-blue
                  peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-g-muted"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-g-faint hover:text-g-muted transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Role chips */}
            <div>
              <p className="text-xs text-g-muted mb-2.5">Role</p>
              <div className="flex gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex-1 py-2 rounded-full text-sm font-medium border transition ${
                      role === r.id
                        ? "bg-g-blue-tint border-g-blue text-g-blue"
                        : "bg-transparent border-g-border text-g-muted hover:bg-g-bg-subtle hover:border-g-border-strong"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-g-red">{error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <a href="#" className="text-sm font-medium text-g-blue hover:underline">
                Forgot password?
              </a>
              <button
                type="submit"
                className="bg-g-blue hover:bg-g-blue-hover text-white font-medium text-sm px-6 py-2.5 rounded-full transition shadow-sm"
              >
                Next
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-6 mt-6">
          <span className="text-xs text-g-muted">CycloTrack</span>
          <a href="#" className="text-xs text-g-muted hover:underline">Privacy</a>
          <a href="#" className="text-xs text-g-muted hover:underline">Terms</a>
        </div>
      </div>
    </div>
  );
}
