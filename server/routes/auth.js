const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes (100 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// @route   POST api/auth/register
// @desc    Register user
router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password, company } = req.body;
  // console.log(req.body)
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Role selection based on secret code
    let role = 'Valuer';
    let accountStatus = 'Approved';
    if (req.body.adminSecret === process.env.ADMIN_SECRET) {
      role = 'Admin';
    }

    user = new User({ name, email, password, company, role, accountStatus });

    // If Admin, remove company and subscriptionStatus
    if (role === 'Admin') {
      user.company = undefined;
      user.subscriptionStatus = undefined;
    }

    // Hash password directly in route
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = { user: { id: user.id, role: user.role } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            accountStatus: user.accountStatus,
            subscriptionStatus: user.subscriptionStatus
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for:', email);

  try {
    let user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Password mismatch');
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    if (user.accountStatus === 'Pending') {
      return res.status(403).json({ msg: 'Your account is pending Admin approval.' });
    }
    if (user.accountStatus === 'Rejected') {
      return res.status(403).json({ msg: 'Your account registration was rejected.' });
    }

    const payload = { user: { id: user.id, role: user.role } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            accountStatus: user.accountStatus,
            subscriptionStatus: user.subscriptionStatus
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/me
// @desc    Get current user data
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('savedProperties');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/auth/profile
// @desc    Update user profile data
router.put('/profile', auth, async (req, res) => {
  const { name, company } = req.body;
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (name) user.name = name;
    if (company) user.company = company;

    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      subscriptionStatus: user.subscriptionStatus,
      company: user.company
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
