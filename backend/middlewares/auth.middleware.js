const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendResponse = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    let token;

    // Accept token from header →  "Bearer <token>"
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token)
      return sendResponse(res, 401, false, 'Not authorized, no token');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user)
      return sendResponse(res, 401, false, 'User no longer exists');

    if (req.user.isBanned)
      return sendResponse(res, 403, false, 'Your account has been banned');

    // Track activity (throttled: only write if stale by >5 min) for analytics
    const FIVE_MIN = 5 * 60 * 1000;
    if (!req.user.lastActive || Date.now() - new Date(req.user.lastActive).getTime() > FIVE_MIN) {
      User.updateOne({ _id: req.user._id }, { lastActive: new Date() }).catch(() => {});
    }

    next();
  } catch (err) {
    sendResponse(res, 401, false, 'Token invalid or expired');
  }
};

module.exports = protect;