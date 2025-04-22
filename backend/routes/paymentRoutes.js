const express = require('express');
const {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByHousehold,
  getPaymentsByFee,
  searchPayments,
  getHouseholdFeeStatus
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getPayments)
  .post(authorize('admin', 'accountant'), createPayment);

router.route('/search')
  .get(searchPayments);

router.route('/household/:id')
  .get(getPaymentsByHousehold);

router.route('/household/:id/fee-status')
  .get(getHouseholdFeeStatus);

router.route('/fee/:id')
  .get(getPaymentsByFee);

router.route('/:id')
  .get(getPaymentById)
  .put(authorize('admin', 'accountant'), updatePayment)
  .delete(authorize('admin'), deletePayment);

module.exports = router; 