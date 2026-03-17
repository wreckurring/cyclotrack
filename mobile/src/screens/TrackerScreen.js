import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocationTracking } from "../hooks/useLocationTracking";
import socketService from "../services/socketService";

export default function TrackerScreen() {
  const [role, setRole] = useState("cyclist");
  const [rideId, setRideId] = useState("ride_999");
  const [userId, setUserId] = useState("cyc_123");
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const currentSocket = socketService.connect();
    setSocket(currentSocket);
    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    // Keep default user IDs in sync with role
    if (role === "leader") {
      setUserId((prev) => (prev.startsWith("leader_") ? prev : "leader_123"));
    } else {
      setUserId((prev) => (prev.startsWith("cyc_") ? prev : "cyc_123"));
    }
  }, [role]);

  const handleLocationUpdate = useCallback(
    (coords) => {
      setCurrentLocation(coords);
      if (socket && isTracking) {
        socket.emit("locationUpdate", {
          cyclistId: userId,
          rideId,
          ...coords,
        });
      }
    },
    [socket, isTracking, rideId, userId],
  );

  useLocationTracking(isTracking, handleLocationUpdate);

  const toggleTracking = () => {
    if (!socket) return;

    if (!isTracking) {
      socket.emit("joinRide", { rideId, cyclistId: userId });
    } else {
      socket.emit("leaveRide", { rideId, cyclistId: userId });
    }
    setIsTracking(!isTracking);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : undefined
        }
      >
        {currentLocation && <Marker coordinate={currentLocation} title="You" />}
      </MapView>
      <View style={styles.panel}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "cyclist" && styles.roleButtonActive,
            ]}
            onPress={() => setRole("cyclist")}
          >
            <Text style={styles.roleButtonText}>Cyclist</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "leader" && styles.roleButtonActive,
            ]}
            onPress={() => setRole("leader")}
          >
            <Text style={styles.roleButtonText}>Leader</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Ride ID</Text>
        <TextInput
          value={rideId}
          onChangeText={setRideId}
          style={styles.input}
          placeholder="ride_999"
        />

        <Text style={styles.label}>User ID</Text>
        <TextInput
          value={userId}
          onChangeText={setUserId}
          style={styles.input}
          placeholder={role === "leader" ? "leader_123" : "cyc_123"}
        />

        <Text style={styles.statusText}>
          Status: {isTracking ? "Tracking Active" : "Idle"}
        </Text>
        <Text style={styles.statusText}>
          Speed: {currentLocation?.speed?.toFixed(2) || 0} m/s
        </Text>

        <Button
          title={isTracking ? "Stop Ride" : "Start Ride"}
          onPress={toggleTracking}
          color={isTracking ? "red" : "green"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  panel: { padding: 20, backgroundColor: "white", elevation: 5 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
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
  label: {
    marginTop: 10,
    marginBottom: 4,
    color: "#4b5563",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  statusText: {
    marginTop: 6,
    marginBottom: 2,
    color: "#374151",
  },
});
