const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
};

export const fetchRides = () => request("/api/rides");

export const fetchRide = (rideId) => request(`/api/rides/${rideId}`);

export const createRide = (payload) =>
  request("/api/rides", {
    method: "POST",
    body: JSON.stringify(payload),
  });
