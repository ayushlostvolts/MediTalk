const express = require('express');
const { protect, userProtect } = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (User only)
router.get('/profile', protect, userProtect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
