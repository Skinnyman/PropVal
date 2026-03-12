const jwt = require('jsonwebtoken');

const auth = function(req, res, next) {
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

const checkSubscription = (tier) => {
  return (req, res, next) => {
    // TEMPORARY: Allow all users to access professional features for testing/demo
    next();
  };
};

module.exports = auth;
module.exports.checkSubscription = checkSubscription;
