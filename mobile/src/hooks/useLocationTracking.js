import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

export const useLocationTracking = (isActive, callback) => {
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const stopTracking = () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };

    const startTracking = async () => {
      stopTracking();
      setError(null);

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          if (!cancelled) {
            setError("Location permission denied");
          }
          return;
        }

        if (cancelled) {
          return;
        }

        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 1,
          },
          (location) => {
            callback({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              speed: location.coords.speed || 0,
              timestamp: location.timestamp,
            });
          },
        );
      } catch (trackingError) {
        if (!cancelled) {
          setError(trackingError.message || "Unable to start location tracking");
        }
      }
    };

    if (isActive) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      cancelled = true;
      stopTracking();
    };
  }, [isActive, callback]);

  return { error };
};
