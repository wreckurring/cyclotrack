import { API_BASE_URL } from "../config";

export const fetchRides = async () => {
  const response = await fetch(`${API_BASE_URL}/api/rides`);
  const data = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(data?.message || "Unable to load rides");
  }

  return data;
};
