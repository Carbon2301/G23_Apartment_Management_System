const express = require('express');
const {
  getDashboardStats,
  getPaymentStatus,
  getMonthlyReport,
  getAreaBasedFeeStats
} = require('../controllers/statisticController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/payment-status', getPaymentStatus);
router.get('/monthly-report', getMonthlyReport);
router.get('/area-fees', getAreaBasedFeeStats);

module.exports = router; 