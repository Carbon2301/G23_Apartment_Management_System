const express = require('express');
const {
  calculateVehicleFeeForHousehold,
  calculateVehicleFeesForAllHouseholds,
  createVehiclePayments,
  getVehicleFeeStatistics,
  getVehiclePrices,
  previewVehicleFeesForNextMonth
} = require('../controllers/vehicleFeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// GET routes - accessible by all authenticated users
router.get('/prices', getVehiclePrices);
router.get('/statistics', getVehicleFeeStatistics);
router.get('/preview', previewVehicleFeesForNextMonth);
router.get('/calculate-all', calculateVehicleFeesForAllHouseholds);
router.get('/calculate/:householdId', calculateVehicleFeeForHousehold);

// POST routes - admin only
router.post('/create-payments', authorize('admin'), createVehiclePayments);

module.exports = router; 