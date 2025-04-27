const express = require('express');
const {
  getVehicles,
  getVehiclesByHousehold,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleStats
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Vehicle statistics
router.route('/stats').get(protect, getVehicleStats);

// Vehicle routes
router.route('/')
  .get(protect, getVehicles)
  .post(protect, createVehicle);

// Vehicles by household
router.route('/household/:householdId')
  .get(protect, getVehiclesByHousehold);

// Individual vehicle routes
router.route('/:id')
  .get(protect, getVehicleById)
  .put(protect, updateVehicle)
  .delete(protect, deleteVehicle);

module.exports = router; 