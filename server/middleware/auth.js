const jwt = require('jsonwebtoken');

const auth = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

const User = require('../models/User');

const checkSubscription = (tier) => {
  return async (req, res, next) => {
    // TEMPORARY: Unlock all features for presentation/everyone
    return next();
    
    /* Original check:
    try {
      if (req.user.role === 'Admin') return next();

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ msg: 'User not found' });
      }

      if (user.subscriptionStatus !== tier) {
        return res.status(403).json({ msg: `Access denied: ${tier} subscription required` });
      }

      next();
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
    */
  };
};

module.exports = auth;
module.exports.checkSubscription = checkSubscription;
