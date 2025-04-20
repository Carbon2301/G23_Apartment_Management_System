const express = require('express');
const {
  getFees,
  getFeeById,
  createFee,
  updateFee,
  deleteFee,
  getFeesByType
} = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getFees)
  .post(authorize('admin'), createFee);

router.route('/type/:type')
  .get(getFeesByType);

router.route('/:id')
  .get(getFeeById)
  .put(authorize('admin'), updateFee)
  .delete(authorize('admin'), deleteFee);

module.exports = router; 