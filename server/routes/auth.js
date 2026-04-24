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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 2 * 60 * 1000; // 2 minutes

    await user.save();

    const sendEmail = require('../utils/sendEmail');
    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome! Verify Your Email',
        message: `Hello ${user.name},\n\nYour verification code is ${otp}. It will expire in 2 minutes.\n\nThank you!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0;">PropVal GH</h2>
            </div>
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h3 style="color: #334155; margin-top: 0;">Verify Your Account</h3>
              <p style="color: #475569; font-size: 16px;">Hello ${user.name},</p>
              <p style="color: #475569; font-size: 16px;">Thanks for registering! Your secure verification code is:</p>
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; text-align: center; margin: 25px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">${otp}</span>
              </div>
              <p style="color: #ef4444; font-size: 14px; font-weight: bold; text-align: center;">This code will expire in exactly 2 minutes.</p>
              <p style="color: #475569; font-size: 14px; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
            </div>
          </div>
        `
      });
    } catch (err) {
      console.log('Email failed to send. For dev: OTP is ', otp);
    }

    res.json({ requireOtp: true, email: user.email, msg: 'OTP sent to email.' });

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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 2 * 60 * 1000; // 2 minutes
    await user.save();

    const sendEmail = require('../utils/sendEmail');
    try {
      await sendEmail({
        email: user.email,
        subject: 'PropVal Security Code',
        message: `Hello ${user.name},\n\nYour login verification code is ${otp}. It will expire in 2 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0;">PropVal GH</h2>
            </div>
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h3 style="color: #334155; margin-top: 0;">Login Verification</h3>
              <p style="color: #475569; font-size: 16px;">Hello ${user.name},</p>
              <p style="color: #475569; font-size: 16px;">To complete your login securely, please use the following code:</p>
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; text-align: center; margin: 25px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10b981;">${otp}</span>
              </div>
              <p style="color: #ef4444; font-size: 14px; font-weight: bold; text-align: center;">This code will expire in exactly 2 minutes.</p>
              <p style="color: #475569; font-size: 14px; margin-top: 30px;">If you did not attempt to log in, please secure your account immediately.</p>
            </div>
          </div>
        `
      });
    } catch (err) {
      console.log('Email failed to send. For dev: OTP is ', otp);
    }

    res.json({ requireOtp: true, email: user.email, msg: 'OTP sent to email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP for Login or Registration and return token
router.post('/verify-otp', authLimiter, async (req, res) => {
  const { email, otp } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // Clear OTP and record login
    user.otp = null;
    user.otpExpires = null;
    user.lastLogin = new Date();
    user.lastActive = new Date();
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
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/forgot-password
// @desc    Send OTP to email for password reset
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'If this email is registered, an OTP will be sent.' }); // Obscure existence

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 2 * 60 * 1000; // 2 minutes
    await user.save();

    const sendEmail = require('../utils/sendEmail');
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message: `You requested a password reset. Your OTP is ${otp}. It expires in 2 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0;">PropVal GH</h2>
            </div>
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h3 style="color: #334155; margin-top: 0;">Password Reset Request</h3>
              <p style="color: #475569; font-size: 16px;">We received a request to reset your password. Here is your authorization code:</p>
              <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; text-align: center; margin: 25px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ef4444;">${otp}</span>
              </div>
              <p style="color: #ef4444; font-size: 14px; font-weight: bold; text-align: center;">This code will expire in exactly 2 minutes.</p>
              <p style="color: #475569; font-size: 14px; margin-top: 30px;">If you did not request this, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
          </div>
        `
      });
    } catch(err) {
      console.log('Email failed. OTP: ', otp);
    }
    
    res.json({ msg: 'If this email is registered, an OTP will be sent.' });
  } catch(err) {
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/reset-password
// @desc    Verify OTP and reset password
router.post('/reset-password', authLimiter, async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ msg: 'Password successfully reset. You can now login.' });
  } catch(err) {
    res.status(500).send('Server Error');
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

// @route   POST api/auth/session/update
// @desc    Update user session time and activity (Heartbeat)
router.post('/session/update', auth, async (req, res) => {
  const { timeSpentMinutes } = req.body;
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.lastActive = new Date();
    if (timeSpentMinutes && timeSpentMinutes > 0) {
      user.totalSessionTime = (user.totalSessionTime || 0) + timeSpentMinutes;
    }
    await user.save();
    
    res.json({ msg: 'Session recorded' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
