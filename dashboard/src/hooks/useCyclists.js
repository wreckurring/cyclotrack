import { useEffect, useState } from "react";
import {
  disconnectSocket,
  getSocket,
  initiateSocketConnection,
} from "../services/socketService";

const toCyclistMap = (cyclists = []) =>
  cyclists.reduce((accumulator, cyclist) => {
    accumulator[cyclist.cyclistId] = cyclist;
    return accumulator;
  }, {});

export const useCyclists = (rideId, viewerId = "dashboard-viewer") => {
  const [cyclists, setCyclists] = useState({});

  useEffect(() => {
    if (!rideId) {
      setCyclists({});
      return undefined;
    }

    initiateSocketConnection();
    const socket = getSocket();

    const handleSnapshot = ({ rideId: snapshotRideId, cyclists: snapshotCyclists }) => {
      if (snapshotRideId !== rideId) {
        return;
      }

      setCyclists(toCyclistMap(snapshotCyclists));
    };

    const handleLocationUpdate = (data) => {
      if (data.rideId !== rideId) {
        return;
      }

      setCyclists((prev) => ({
        ...prev,
        [data.cyclistId]: {
          ...data,
          status: data.status || (data.speed < 0.5 ? "slow" : "moving"),
        },
      }));
    };

    const handleCyclistStopped = ({ rideId: eventRideId, cyclistId }) => {
      if (eventRideId !== rideId) {
        return;
      }

      setCyclists((prev) => {
        if (!prev[cyclistId]) {
          return prev;
        }

        return {
          ...prev,
          [cyclistId]: {
            ...prev[cyclistId],
            status: "stationary",
          },
        };
      });
    };

    const handleCyclistDisconnected = ({ rideId: eventRideId, cyclistId }) => {
      if (eventRideId !== rideId) {
        return;
      }

      setCyclists((prev) => {
        if (!prev[cyclistId]) {
          return prev;
        }

        return {
          ...prev,
          [cyclistId]: {
            ...prev[cyclistId],
            status: "disconnected",
          },
        };
      });
    };

    socket.on("rideSnapshot", handleSnapshot);
    socket.on("cyclistLocationUpdate", handleLocationUpdate);
    socket.on("cyclistStopped", handleCyclistStopped);
    socket.on("cyclistDisconnected", handleCyclistDisconnected);

    socket.emit("joinRide", {
      rideId,
      cyclistId: viewerId,
      role: "viewer",
    });

    return () => {
      socket.emit("leaveRide");
      socket.off("rideSnapshot", handleSnapshot);
      socket.off("cyclistLocationUpdate", handleLocationUpdate);
      socket.off("cyclistStopped", handleCyclistStopped);
      socket.off("cyclistDisconnected", handleCyclistDisconnected);
      disconnectSocket();
    };
  }, [rideId, viewerId]);

  return cyclists;
};
