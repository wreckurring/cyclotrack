import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import io from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { initiateSocketConnection, disconnectSocket, getSocket } from '../services/socketService';

const SOCKET_URL = "http://localhost:5000";
const RIDE_ID = "ride_999";

export default function LiveMap() {
  const [cyclists, setCyclists] = useState({});
  
  useEffect(() => {
    initiateSocketConnection();
    const socket = getSocket();
    
    socket.emit('joinRide', { rideId: RIDE_ID, cyclistId: 'leader_1' });

    socket.on('cyclistLocationUpdate', (data) => {
      setCyclists(prev => ({
        ...prev,
        [data.cyclistId]: { 
          ...data, 
          status: data.speed < 0.5 ? 'slow' : 'moving' 
        }
      }));
    });

    socket.on('cyclistStopped', ({ cyclistId }) => {
      setCyclists(prev => {
        if(!prev[cyclistId]) return prev;
        return { ...prev, [cyclistId]: { ...prev[cyclistId], status: 'stationary' } };
      });
    });

    socket.on('cyclistDisconnected', ({ cyclistId }) => {
      setCyclists(prev => {
        if(!prev[cyclistId]) return prev;
        return { ...prev, [cyclistId]: { ...prev[cyclistId], status: 'disconnected' } };
      });
    });

    return () => disconnectSocket();
  }, []);

  const getMarkerColor = (status) => {
    switch(status) {
      case 'moving': return 'green';
      case 'slow': return 'yellow';
      case 'stationary': return 'red';
      case 'disconnected': return 'gray';
      default: return 'blue';
    }
  };

  const createIcon = (color) => {
    return new L.Icon({
      // In production, map these to actual custom colored marker SVGs
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
  };

  return (
    <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: "100vh", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {Object.values(cyclists).map((cyclist) => (
        <Marker 
          key={cyclist.cyclistId} 
          position={[cyclist.latitude, cyclist.longitude]}
          icon={createIcon(getMarkerColor(cyclist.status))}
        >
          <Popup>
            <strong>ID:</strong> {cyclist.cyclistId} <br/>
            <strong>Speed:</strong> {cyclist.speed.toFixed(2)} m/s <br/>
            <strong>Status:</strong> {cyclist.status} <br/>
            <strong>Updated:</strong> {new Date(cyclist.timestamp).toLocaleTimeString()}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}