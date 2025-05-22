const express = require('express');
const router = express.Router();
const {
  calculateHouseholdHygieneFee,
  calculateAllHygieneFees,
  createBulkHygieneFeePayments,
  getHygieneFeeStatistics,
  previewBulkHygieneFeePayments
} = require('../controllers/hygieneFeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/hygiene-fees/calculate/:householdId
router.get('/calculate/:householdId', protect, calculateHouseholdHygieneFee);

// @route   GET /api/hygiene-fees/calculate-all
router.get('/calculate-all', protect, calculateAllHygieneFees);

// @route   GET /api/hygiene-fees/statistics
router.get('/statistics', protect, getHygieneFeeStatistics);

// @route   GET /api/hygiene-fees/preview/:year
router.get('/preview/:year', protect, previewBulkHygieneFeePayments);

// @route   POST /api/hygiene-fees/create-bulk-payments
router.post('/create-bulk-payments', protect, authorize('admin'), createBulkHygieneFeePayments);

module.exports = router; 