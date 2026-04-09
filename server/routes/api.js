const express = require("express");
const router = express.Router();
const {
  getHealthStatus,
  getAllRides,
  createRide,
  getRideById,
  completeRide,
} = require("../controllers/rideController");

router.get("/health", getHealthStatus);
router.get("/rides", getAllRides);
router.post("/rides", createRide);
router.get("/rides/:id", getRideById);
router.patch("/rides/:id/complete", completeRide);

module.exports = router;
