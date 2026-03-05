const express = require('express');
const router = express.Router();
const { getHealthStatus, getRideById } = require('../controllers/rideController');

router.get('/health', getHealthStatus);
router.get('/rides/:id', getRideById);

module.exports = router;