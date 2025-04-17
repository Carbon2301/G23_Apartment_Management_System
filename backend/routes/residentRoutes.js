const express = require('express');
const {
  getResidents,
  getResidentById,
  createResident,
  updateResident,
  deleteResident,
  searchResidents
} = require('../controllers/residentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getResidents)
  .post(authorize('admin'), createResident);

router.route('/search')
  .get(searchResidents);

router.route('/:id')
  .get(getResidentById)
  .put(authorize('admin'), updateResident)
  .delete(authorize('admin'), deleteResident);

module.exports = router; 