import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocationTracking = (isActive, callback) => {
  const [error, setError] = useState(null);























































































































  








  useEffect(() => {
    let subscriber;
    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission denied');
          return;
        }

        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // 5 seconds
            distanceInterval: 1, // 1 meter
          },
          (location) => {
            callback({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              speed: location.coords.speed || 0,
              timestamp: location.timestamp,
            });
          }
        );
      } catch (err) {
        setError(err.message);
      }
    };

    if (isActive) {
      startTracking();
    } else if (subscriber) {
      subscriber.remove();
    }

    return () => {
      if (subscriber) subscriber.remove();
    };
  }, [isActive, callback]);

  return { error };
};