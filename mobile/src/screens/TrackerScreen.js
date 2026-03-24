import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocationTracking } from "../hooks/useLocationTracking";
import { fetchRides } from "../services/rideService";
import socketService from "../services/socketService";

const DEFAULT_REGION = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export default function TrackerScreen() {
  const [role, setRole] = useState("cyclist");
  const [rides, setRides] = useState([]);
  const [rideId, setRideId] = useState("");
  const [userId, setUserId] = useState("rider_01");
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [socketState, setSocketState] = useState("connecting");
  const [ridesLoading, setRidesLoading] = useState(false);
  const [rideError, setRideError] = useState(null);

  useEffect(() => {
    setUserId((prev) => {
      if (role === "leader") {
        return prev.startsWith("leader_") ? prev : "leader_01";
      }

      return prev.startsWith("rider_") ? prev : "rider_01";
    });
  }, [role]);

  const loadRides = useCallback(async () => {
    setRidesLoading(true);
    setRideError(null);

    try {
      const rideList = await fetchRides();
      setRides(rideList);

      setRideId((currentRideId) => currentRideId || rideList[0]?._id || "");
    } catch (error) {
      setRideError(error.message || "Unable to load rides.");
    } finally {
      setRidesLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentSocket = socketService.connect();
    setSocket(currentSocket);

    const handleConnect = () => setSocketState("connected");
    const handleDisconnect = () => setSocketState("disconnected");
    const handleRideError = (error) => {
      setRideError(error?.message || "Unable to join that ride.");
      setIsTracking(false);
    };

    currentSocket.on("connect", handleConnect);
    currentSocket.on("disconnect", handleDisconnect);
    currentSocket.on("rideError", handleRideError);

    if (currentSocket.connected) {
      setSocketState("connected");
    }

    loadRides();

    return () => {
      currentSocket.off("connect", handleConnect);
      currentSocket.off("disconnect", handleDisconnect);
      currentSocket.off("rideError", handleRideError);
      socketService.disconnect();
    };
  }, [loadRides]);

  const handleLocationUpdate = useCallback(
    (coords) => {
      setCurrentLocation(coords);

      if (socket && isTracking) {
        socket.emit("locationUpdate", {
          cyclistId: userId.trim(),
          rideId,
          role,
          ...coords,
        });
      }
    },
    [isTracking, rideId, role, socket, userId],
  );

  const { error: locationError } = useLocationTracking(isTracking, handleLocationUpdate);

  const selectedRide = useMemo(
    () => rides.find((ride) => ride._id === rideId) || null,
    [rideId, rides],
  );

  const toggleTracking = () => {
    if (!socket || !rideId.trim() || !userId.trim()) {
      setRideError("Select a ride and enter your rider ID before starting.");
      return;
    }

    setRideError(null);

    if (!isTracking) {
      socket.emit("joinRide", {
        rideId: rideId.trim(),
        cyclistId: userId.trim(),
        role,
      });
      setIsTracking(true);
      return;
    }

    socket.emit("leaveRide");
    setIsTracking(false);
  };

  const region = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : DEFAULT_REGION;

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        {currentLocation && <Marker coordinate={currentLocation} title="You" />}
      </MapView>

      <View style={styles.panel}>
        <ScrollView contentContainerStyle={styles.panelContent}>
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "cyclist" && styles.roleButtonActive,
                isTracking && styles.buttonDisabled,
              ]}
              disabled={isTracking}
              onPress={() => setRole("cyclist")}
            >
              <Text style={styles.roleButtonText}>Cyclist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "leader" && styles.roleButtonActive,
                isTracking && styles.buttonDisabled,
              ]}
              disabled={isTracking}
              onPress={() => setRole("leader")}
            >
              <Text style={styles.roleButtonText}>Leader</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available rides</Text>
            <TouchableOpacity onPress={loadRides} disabled={ridesLoading}>
              <Text style={styles.refreshText}>{ridesLoading ? "Refreshing..." : "Refresh"}</Text>
            </TouchableOpacity>
          </View>

          {ridesLoading ? (
            <ActivityIndicator color="#2563eb" style={styles.loader} />
          ) : rides.length === 0 ? (
            <Text style={styles.helperText}>
              No rides found yet. Ask an admin to create a ride first.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.rideList}>
                {rides.map((ride) => (
                  <TouchableOpacity
                    key={ride._id}
                    style={[
                      styles.rideCard,
                      ride._id === rideId && styles.rideCardActive,
                      isTracking && styles.buttonDisabled,
                    ]}
                    disabled={isTracking}
                    onPress={() => setRideId(ride._id)}
                  >
                    <Text style={styles.rideName}>{ride.name}</Text>
                    <Text style={styles.rideMeta}>{ride.destination || "No destination"}</Text>
                    <Text style={styles.rideMeta}>Leader: {ride.leaderId || "TBA"}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          <Text style={styles.label}>Ride ID</Text>
          <TextInput
            value={rideId}
            onChangeText={setRideId}
            style={styles.input}
            placeholder="Select a ride above or paste a ride ID"
            editable={!isTracking}
            autoCapitalize="none"
          />

          <Text style={styles.label}>{role === "leader" ? "Leader ID" : "Rider ID"}</Text>
          <TextInput
            value={userId}
            onChangeText={setUserId}
            style={styles.input}
            placeholder={role === "leader" ? "leader_01" : "rider_01"}
            editable={!isTracking}
            autoCapitalize="none"
          />

          {selectedRide && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{selectedRide.name}</Text>
              <Text style={styles.summaryMeta}>
                {selectedRide.destination || "No destination"}
              </Text>
              <Text style={styles.summaryMeta}>Leader: {selectedRide.leaderId || "TBA"}</Text>
            </View>
          )}

          <Text style={styles.statusText}>Socket: {socketState}</Text>
          <Text style={styles.statusText}>
            Status: {isTracking ? "Tracking Active" : "Idle"}
          </Text>
          <Text style={styles.statusText}>
            Speed: {currentLocation?.speed?.toFixed(2) || 0} m/s
          </Text>

          {(rideError || locationError) && (
            <Text style={styles.errorText}>{rideError || locationError}</Text>
          )}

          <Button
            title={isTracking ? "Stop Tracking" : "Start Tracking"}
            onPress={toggleTracking}
            color={isTracking ? "#dc2626" : "#16a34a"}
          />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  panel: {
    maxHeight: "58%",
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
  },
  panelContent: {
    padding: 20,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    marginRight: 8,
  },
  roleButtonActive: {
    backgroundColor: "#38bdf8",
  },
  roleButtonText: {
    fontWeight: "600",
    color: "#111827",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sectionHeader: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontWeight: "700",
    color: "#111827",
  },
  refreshText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  loader: {
    marginVertical: 12,
  },
  rideList: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  rideCard: {
    width: 180,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 10,
  },
  rideCardActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  rideName: {
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  rideMeta: {
    fontSize: 12,
    color: "#4b5563",
    marginBottom: 2,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    color: "#4b5563",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 10,
    marginBottom: 4,
  },
  summaryCard: {
    marginTop: 4,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryTitle: {
    fontWeight: "700",
    color: "#111827",
  },
  summaryMeta: {
    marginTop: 3,
    color: "#4b5563",
    fontSize: 12,
  },
  helperText: {
    color: "#6b7280",
    marginBottom: 8,
  },
  statusText: {
    color: "#374151",
  },
  errorText: {
    color: "#dc2626",
    fontWeight: "600",
    marginVertical: 4,
  },
});
