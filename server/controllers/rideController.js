const Ride = require('../models/Ride');

// @desc    Get system health
// @route   GET /api/health
// @access  Public
const getHealthStatus = (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Tracking server is running' });
};

// @desc    Get ride details by ID
// @route   GET /api/rides/:id
// @access  Public (Mock)
const getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    res.json(ride);
  } catch (err) {
    console.error("Error fetching ride:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getHealthStatus,
  getRideById
};