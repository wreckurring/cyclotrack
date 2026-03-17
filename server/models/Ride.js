const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    destination: { type: String, default: "Unknown" },
    leaderId: { type: String, default: "" },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Ride", RideSchema);
