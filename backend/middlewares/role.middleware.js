const sendResponse = require('../utils/apiResponse');

// Usage → authorize('admin', 'college')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendResponse(
        res, 403, false,
        `Role '${req.user.role}' is not allowed to access this route`
      );
    }
    next();
  };
};

module.exports = authorize;