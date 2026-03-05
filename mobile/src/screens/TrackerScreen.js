import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocationTracking } from '../hooks/useLocationTracking';
import socketService from '../services/socketService';

// Mock Auth/Ride Data
const CYCLIST_ID = "cyc_123";
const RIDE_ID = "ride_999";
const SOCKET_URL = "http://YOUR_LOCAL_IP:5000"; 

export default function TrackerScreen() {
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

  const handleLocationUpdate = useCallback((coords) => {
    setCurrentLocation(coords);
    if (socket && isTracking) {
      socket.emit('locationUpdate', {
        cyclistId: CYCLIST_ID,
        rideId: RIDE_ID,
        ...coords
      });
    }
  }, [socket, isTracking]);

  useLocationTracking(isTracking, handleLocationUpdate);

  const toggleTracking = () => {
    if (!isTracking) {
      socket.emit('joinRide', { rideId: RIDE_ID, cyclistId: CYCLIST_ID });
    } else {
      socket.emit('leaveRide', { rideId: RIDE_ID, cyclistId: CYCLIST_ID });
    }
    setIsTracking(!isTracking);
  };

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map}
        region={currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
      >
        {currentLocation && (
          <Marker coordinate={currentLocation} title="You" />
        )}
      </MapView>
      <View style={styles.panel}>
        <Text>Status: {isTracking ? "Tracking Active" : "Idle"}</Text>
        <Text>Speed: {currentLocation?.speed?.toFixed(2) || 0} m/s</Text>
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
  panel: { padding: 20, backgroundColor: 'white', elevation: 5 }
});