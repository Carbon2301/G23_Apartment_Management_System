const express = require('express');
const router = express.Router();
const {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  recordMaintenance,
  getFacilityStatistics,
  getMaintenanceDue
} = require('../controllers/facilityController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Routes công khai cho staff
router.route('/')
  .get(protect, getFacilities)
  .post(protect, authorize('admin', 'manager'), createFacility);

router.route('/statistics')
  .get(protect, getFacilityStatistics);

router.route('/maintenance-due')
  .get(protect, getMaintenanceDue);

router.route('/:id')
  .get(protect, getFacilityById)
  .put(protect, authorize('admin', 'manager'), updateFacility)
  .delete(protect, authorize('admin'), deleteFacility);

router.route('/:id/maintenance')
  .put(protect, authorize('admin', 'manager'), recordMaintenance);

module.exports = router; 