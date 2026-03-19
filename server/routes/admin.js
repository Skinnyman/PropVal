const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Property = require('../models/Property');
const Valuation = require('../models/Valuation');

// @route   GET api/admin/users
// @desc    Get all users for management (Admin only)
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied: Admin role required' });
    }
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/users/:id/status
// @desc    Approve/Reject user account (Admin only)
router.put('/users/:id/status', auth, async (req, res) => {
  const { status } = req.body; // 'Approved', 'Rejected'
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied: Admin role required' });
    }

    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.accountStatus = status;
    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/analytics
// @desc    Get system-wide analytics (Admin only)
router.get('/analytics', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied: Admin role required' });
    }

    const userCount = await User.countDocuments();
    const propertyCount = await Property.countDocuments();
    const valuationCount = await Valuation.countDocuments();
    const pendingCount = await Property.countDocuments({ verificationStatus: 'Pending' });

    res.json({
      users: userCount,
      properties: propertyCount,
      valuations: valuationCount,
      pendingProperties: pendingCount
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/valuations
// @desc    Get all valuations performed on the platform (Admin only)
router.get('/valuations', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied: Admin role required' });
    }

    const valuations = await Valuation.find()
      .populate('valuer', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(valuations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
