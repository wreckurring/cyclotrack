const Ride = require("../models/Ride");

// @desc    Get system health
// @route   GET /api/health
// @access  Public
const getHealthStatus = (req, res) => {
  res.status(200).json({ status: "OK", message: "Tracking server is running" });
};

// @desc    Get all rides
// @route   GET /api/rides
// @access  Public
const getAllRides = async (req, res) => {
  try {
    const rides = await Ride.find().sort({ startTime: -1 });
    res.json(rides);
  } catch (err) {
    console.error("Error fetching rides:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new ride
// @route   POST /api/rides
// @access  Public (Mock)
const createRide = async (req, res) => {
  try {
    const { name, destination, leaderId } = req.body;
    const trimmedName = name?.trim();

    if (!trimmedName) {
      return res.status(400).json({ message: "Ride name is required" });
    }

    const ride = await Ride.create({
      name: trimmedName,
      destination: destination?.trim() || "Unknown",
      leaderId: leaderId?.trim() || "",
      participants: [],
    });

    res.status(201).json(ride);
  } catch (err) {
    console.error("Error creating ride:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get ride details by ID
// @route   GET /api/rides/:id
// @access  Public (Mock)
const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }
    res.json(ride);
  } catch (err) {
    console.error("Error fetching ride:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Mark ride as completed
// @route   PATCH /api/rides/:id/complete
// @access  Public (Mock)
const completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.status === "completed") {
      return res.json(ride);
    }

    ride.status = "completed";
    ride.endTime = ride.endTime || new Date();
    ride.participants = [];

    await ride.save();

    res.json(ride);
  } catch (err) {
    console.error("Error completing ride:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getHealthStatus,
  getAllRides,
  createRide,
  getRideById,
  completeRide,
};
