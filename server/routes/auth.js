const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  const { name, email, password, company } = req.body;
  // console.log(req.body)
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Role selection based on secret code
    let role = 'Valuer';
    if (req.body.adminSecret === 'PropValAdmin2026') {
      role = 'Admin';
    }

    user = new User({ name, email, password, company, role });

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
router.post('/login', async (req, res) => {
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

// @route   POST api/auth/initialize-payment
// @desc    Initialize Paystack payment (Placeholder)
router.post('/initialize-payment', async (req, res) => {
  const { plan } = req.body;
  try {
    // In a real app, you would call Paystack API here
    // For now, we return a mock authorization URL
    res.json({
      authorization_url: `https://checkout.paystack.com/mock-checkout?plan=${plan}`,
      access_code: 'mock_code_123'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
