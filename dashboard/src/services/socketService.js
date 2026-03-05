import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket;

export const initiateSocketConnection = () => {
  socket = io(SOCKET_URL, {
    reconnection: true,
  });
  console.log(`Connecting socket...`);
};

export const disconnectSocket = () => {
  console.log('Disconnecting socket...');
  if(socket) socket.disconnect();
}

export const getSocket = () => {
    return socket;
}