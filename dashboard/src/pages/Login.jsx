import React from "react";
import { useNavigate } from "react-router-dom";
import { Bike, MapPin, ShieldCheck } from "lucide-react";

const roles = [
  {
    id: "cyclist",
    title: "Rider",
    description: "See active ride IDs and join the ride from the mobile tracker.",
    icon: Bike,
    action: "/cyclist",
  },
  {
    id: "leader",
    title: "Ride Leader",
    description: "Open a ride monitor and follow the group live on the dashboard.",
    icon: MapPin,
    action: "/leader",
  },
  {
    id: "admin",
    title: "Admin",
    description: "Create rides and monitor any trip in progress.",
    icon: ShieldCheck,
    action: "/admin",
  },
];

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
            CycloTrack MVP
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Pick the workspace you want to open.
          </h1>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            This MVP skips sign-in for now and focuses on the live ride workflow:
            admins create rides, riders join from mobile, and leaders monitor the
            group in real time.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {roles.map(({ id, title, description, icon: Icon, action }) => (
            <button
              key={id}
              type="button"
              onClick={() => navigate(action)}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/10"
            >
              <div className="inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                <Icon className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
              <div className="mt-6 text-sm font-semibold text-cyan-300">
                Open workspace
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
