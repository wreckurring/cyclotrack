const Location = require('../models/Location');

const STATIONARY_THRESHOLD_MS = 120000; // 2 minutes
const STATIONARY_SPEED_LIMIT = 0.5; // m/s
const cyclistStateCache = new Map(); // Tracks last moved timestamp and last known coords

module.exports = (io, socket) => {
  socket.on('joinRide', ({ rideId, cyclistId }) => {
    socket.join(rideId);
    socket.cyclistId = cyclistId;
    socket.rideId = rideId;
    console.log(`Cyclist ${cyclistId} joined ride ${rideId}`);
  });

  socket.on('locationUpdate', async (data) => {
    const { cyclistId, rideId, latitude, longitude, speed, timestamp } = data;
    
    // 1. Performance: Only broadcast if position/speed changed significantly
    const lastKnown = cyclistStateCache.get(cyclistId);
    if (lastKnown && lastKnown.lat === latitude && lastKnown.lng === longitude && lastKnown.speed === speed) {
        return; // Skip redundant updates
    }

    // 2. Broadcast to Dashboard
    io.to(rideId).emit('cyclistLocationUpdate', data);

    // 3. Stationary Logic
    let stationaryStartTime = lastKnown?.stationarySince || null;

    if (speed < STATIONARY_SPEED_LIMIT) {
      if (!stationaryStartTime) {
        stationaryStartTime = timestamp; 
      } else if (timestamp - stationaryStartTime > STATIONARY_THRESHOLD_MS) {
        io.to(rideId).emit('cyclistStopped', { cyclistId, timestamp });
      }
    } else {
      stationaryStartTime = null; // Reset if moving
    }

    // Update Cache
    cyclistStateCache.set(cyclistId, { lat: latitude, lng: longitude, speed, stationarySince: stationaryStartTime });

    // 4. Async DB Persistence (fire and forget to prevent blocking)
    Location.create(data).catch(err => console.error("DB Error:", err));
  });

  socket.on('disconnect', () => {
    if (socket.cyclistId && socket.rideId) {
      io.to(socket.rideId).emit('cyclistDisconnected', { 
        cyclistId: socket.cyclistId, 
        timestamp: Date.now() 
      });
      cyclistStateCache.delete(socket.cyclistId);
    }
  });
};