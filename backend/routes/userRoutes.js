const express = require('express');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/login', loginUser);

// Protected routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Thêm route kiểm tra token
router.get('/check-token', protect, (req, res) => {
  res.json({
    message: 'Token hợp lệ',
    user: {
      _id: req.user._id,
      username: req.user.username,
      role: req.user.role,
      fullName: req.user.fullName
    }
  });
});

// Admin only routes
router.route('/')
  .post(protect, authorize('admin'), registerUser)
  .get(protect, authorize('admin'), getUsers);

router.route('/:id')
  .get(protect, authorize('admin'), getUserById)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router; 