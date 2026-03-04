const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  cyclistId: { type: String, required: true, index: true },
  rideId: { type: String, required: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  speed: { type: Number, required: true },
  timestamp: { type: Number, required: true }
});

module.exports = mongoose.model('Location', LocationSchema);