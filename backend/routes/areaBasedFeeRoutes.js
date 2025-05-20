const express = require('express');
const router = express.Router();
const {
  calculateAreaBasedFeeForHousehold,
  calculateAreaBasedFeesForAllHouseholds,
  createAreaBasedPayments,
  getAreaBasedFeeStatistics,
  getAreaBasedFeePrices,
  previewAreaBasedFeesForNextMonth
} = require('../controllers/areaBasedFeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Routes cho phí theo diện tích
router.get('/calculate/:householdId', protect, calculateAreaBasedFeeForHousehold);
router.get('/calculate-all', protect, calculateAreaBasedFeesForAllHouseholds);
router.post('/create-payments', protect, authorize('admin', 'manager'), createAreaBasedPayments);
router.get('/statistics', protect, getAreaBasedFeeStatistics);
router.get('/prices', protect, getAreaBasedFeePrices);
router.get('/preview', protect, previewAreaBasedFeesForNextMonth);

module.exports = router; 