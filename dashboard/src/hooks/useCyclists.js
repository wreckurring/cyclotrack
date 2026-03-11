import { useState, useEffect } from 'react';
import { initiateSocketConnection, disconnectSocket, getSocket } from '../services/socketService';

export const useCyclists = (rideId, role = 'leader_1') => {
  const [cyclists, setCyclists] = useState({});

  useEffect(() => {
    initiateSocketConnection();
    const socket = getSocket();
    
    socket.emit('joinRide', { rideId, cyclistId: role });

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
  }, [rideId, role]);

  return cyclists;
};