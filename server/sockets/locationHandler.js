const Location = require("../models/Location");
const Ride = require("../models/Ride");

const STATIONARY_THRESHOLD_MS = 120000;
const STATIONARY_SPEED_LIMIT = 0.5;

const rideStateCache = new Map();
const cyclistStateCache = new Map();
const participantSocketCache = new Map();

const getCacheKey = (rideId, cyclistId) => `${rideId}:${cyclistId}`;

const getRideState = (rideId) => {
  if (!rideStateCache.has(rideId)) {
    rideStateCache.set(rideId, new Map());
  }

  return rideStateCache.get(rideId);
};

const buildSnapshot = (rideId) => {
  const rideState = rideStateCache.get(rideId);

  if (!rideState) {
    return [];
  }

  return Array.from(rideState.values());
};

const normalizeJoinPayload = (payload = {}) => ({
  rideId: payload.rideId?.trim?.() || payload.rideId,
  cyclistId:
    payload.cyclistId?.trim?.() ||
    payload.userId?.trim?.() ||
    payload.participantId?.trim?.() ||
    "",
  role: payload.role || "cyclist",
});

const normalizeLocationPayload = (payload = {}, socket) => {
  const rideId = socket.rideId || payload.rideId;
  const cyclistId = socket.cyclistId || payload.cyclistId || payload.userId;
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  const speed = Number.isFinite(Number(payload.speed)) ? Number(payload.speed) : 0;
  const timestamp = Number.isFinite(Number(payload.timestamp))
    ? Number(payload.timestamp)
    : Date.now();

  if (!rideId || !cyclistId) {
    return null;
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    cyclistId,
    rideId,
    latitude,
    longitude,
    speed,
    timestamp,
    role: socket.role || payload.role || "cyclist",
  };
};

const updateRideParticipants = async (rideId, cyclistId, operation) => {
  if (!rideId || !cyclistId) {
    return;
  }

  const update =
    operation === "remove"
      ? { $pull: { participants: cyclistId } }
      : { $addToSet: { participants: cyclistId } };

  try {
    await Ride.findByIdAndUpdate(rideId, update);
  } catch (error) {
    console.error("Ride participant update failed:", error.message);
  }
};

const clearParticipantState = async (io, socket) => {
  const { rideId, cyclistId, role } = socket;

  if (!rideId || !cyclistId || role === "viewer") {
    return;
  }

  const cacheKey = getCacheKey(rideId, cyclistId);
  const activeSocketId = participantSocketCache.get(cacheKey);

  if (activeSocketId && activeSocketId !== socket.id) {
    return;
  }

  participantSocketCache.delete(cacheKey);
  cyclistStateCache.delete(cacheKey);

  const rideState = rideStateCache.get(rideId);
  if (rideState) {
    rideState.delete(cyclistId);
    if (rideState.size === 0) {
      rideStateCache.delete(rideId);
    }
  }

  await updateRideParticipants(rideId, cyclistId, "remove");

  io.to(rideId).emit("cyclistDisconnected", {
    rideId,
    cyclistId,
    timestamp: Date.now(),
  });
};

module.exports = (io, socket) => {
  socket.on("joinRide", async (payload = {}) => {
    const { rideId, cyclistId, role } = normalizeJoinPayload(payload);

    if (!rideId) {
      socket.emit("rideError", { message: "Select a ride before tracking." });
      return;
    }

    try {
      const ride = await Ride.findById(rideId).select("status");

      if (!ride) {
        socket.emit("rideError", { message: "That ride could not be found." });
        return;
      }

      if (ride.status === "completed") {
        socket.emit("rideError", { message: "This ride has already been completed." });
        return;
      }
    } catch (error) {
      socket.emit("rideError", { message: "That ride could not be found." });
      return;
    }

    socket.join(rideId);
    socket.rideId = rideId;
    socket.cyclistId = cyclistId;
    socket.role = role;

    if (cyclistId && role !== "viewer") {
      participantSocketCache.set(getCacheKey(rideId, cyclistId), socket.id);
      await updateRideParticipants(rideId, cyclistId, "add");
    }

    socket.emit("rideSnapshot", {
      rideId,
      cyclists: buildSnapshot(rideId),
    });
  });

  socket.on("leaveRide", async () => {
    await clearParticipantState(io, socket);

    if (socket.rideId) {
      socket.leave(socket.rideId);
    }

    socket.rideId = null;
    socket.cyclistId = null;
    socket.role = null;
  });

  socket.on("locationUpdate", async (payload = {}) => {
    const location = normalizeLocationPayload(payload, socket);

    if (!location) {
      return;
    }

    const cacheKey = getCacheKey(location.rideId, location.cyclistId);
    const lastKnown = cyclistStateCache.get(cacheKey);

    if (
      lastKnown &&
      lastKnown.lat === location.latitude &&
      lastKnown.lng === location.longitude &&
      lastKnown.speed === location.speed
    ) {
      return;
    }

    let stationarySince = lastKnown?.stationarySince || null;
    let status = location.speed < STATIONARY_SPEED_LIMIT ? "slow" : "moving";

    if (location.speed < STATIONARY_SPEED_LIMIT) {
      if (!stationarySince) {
        stationarySince = location.timestamp;
      } else if (location.timestamp - stationarySince >= STATIONARY_THRESHOLD_MS) {
        status = "stationary";

        if (lastKnown?.status !== "stationary") {
          io.to(location.rideId).emit("cyclistStopped", {
            rideId: location.rideId,
            cyclistId: location.cyclistId,
            timestamp: location.timestamp,
          });
        }
      }
    } else {
      stationarySince = null;
    }

    cyclistStateCache.set(cacheKey, {
      lat: location.latitude,
      lng: location.longitude,
      speed: location.speed,
      stationarySince,
      status,
    });

    participantSocketCache.set(cacheKey, socket.id);

    const rideState = getRideState(location.rideId);
    const liveCyclist = {
      ...location,
      status,
    };

    rideState.set(location.cyclistId, liveCyclist);
    io.to(location.rideId).emit("cyclistLocationUpdate", liveCyclist);

    Location.create(location).catch((error) =>
      console.error("DB Error:", error.message),
    );
  });

  socket.on("disconnect", async () => {
    await clearParticipantState(io, socket);
  });
};
