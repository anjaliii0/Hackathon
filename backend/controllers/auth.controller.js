const User = require('../models/User');
const Student = require('../models/Student');
const College = require('../models/College');
const Company = require('../models/Company');
const generateToken = require('../utils/generateToken');
const sendResponse = require('../utils/apiResponse');
const crypto = require('crypto');

// ─────────────────────────────────────────
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;

    // Validate role
    if (!['student', 'college', 'company'].includes(role))
      return sendResponse(res, 400, false, 'Invalid role. Must be student, college, or company');

    const normalizedEmail = email?.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
      return sendResponse(res, 400, false, 'Email already registered');

    // Generate 6-digit email verification code
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verifyExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    const user = await User.create({
      name, email: normalizedEmail, password, role,
      emailVerifyCode: verifyCode,
      emailVerifyExpire: verifyExpire,
      isVerified: false,
    });

    // Create role-specific profile
    if (role === 'student')
      await Student.create({ user: user._id });
    else if (role === 'college')
      await College.create({ user: user._id, collegeName: name, contactEmail: normalizedEmail });
    else if (role === 'company')
      await Company.create({ user: user._id, companyName: name, contactEmail: normalizedEmail });

    const token = generateToken(user._id, user.role);

    // TODO: send verifyCode via email (nodemailer/sendgrid)
    // For dev: return it in the response so you can test without email setup
    console.log(`[DEV] Email verify code for ${normalizedEmail}: ${verifyCode}`);

    sendResponse(res, 201, true, 'Registration successful. Check your email for verification code.', {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: false },
      // Remove this in production:
      devVerifyCode: process.env.NODE_ENV !== 'production' ? verifyCode : undefined,
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user)
      return sendResponse(res, 401, false, 'Invalid email or password');

    if (user.isBanned)
      return sendResponse(res, 403, false, 'Your account has been banned');

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return sendResponse(res, 401, false, 'Invalid email or password');

    user.lastActive = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    sendResponse(res, 200, true, 'Login successful', {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/logout
// @access  Private
// ─────────────────────────────────────────
exports.logout = (req, res) => {
  sendResponse(res, 200, true, 'Logged out successfully');
};

// ─────────────────────────────────────────
// @route   GET /api/auth/me
// @access  Private
// ─────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    sendResponse(res, 200, true, 'User fetched', user);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/verify-email
// @access  Private (must be logged in)
// ─────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);

    if (!user)
      return sendResponse(res, 404, false, 'User not found');

    if (user.isVerified)
      return sendResponse(res, 400, false, 'Email already verified');

    if (!user.emailVerifyCode || !user.emailVerifyExpire)
      return sendResponse(res, 400, false, 'No pending verification. Request a new code.');

    if (new Date() > new Date(user.emailVerifyExpire))
      return sendResponse(res, 400, false, 'Verification code expired. Request a new one.');

    if (user.emailVerifyCode !== code.toString())
      return sendResponse(res, 400, false, 'Invalid verification code');

    user.isVerified = true;
    user.emailVerifyCode = undefined;
    user.emailVerifyExpire = undefined;
    await user.save();

    sendResponse(res, 200, true, 'Email verified successfully');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/resend-verification
// @access  Private
// ─────────────────────────────────────────
exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendResponse(res, 404, false, 'User not found');
    if (user.isVerified) return sendResponse(res, 400, false, 'Already verified');

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerifyCode   = verifyCode;
    user.emailVerifyExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    console.log(`[DEV] Resent verify code for ${user.email}: ${verifyCode}`);
    sendResponse(res, 200, true, 'Verification code resent',
      process.env.NODE_ENV !== 'production' ? { devVerifyCode: verifyCode } : {}
    );
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email?.trim().toLowerCase() });
    if (!user)
      return sendResponse(res, 404, false, 'No user with that email');

    const rawToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken  = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
    // TODO: send email
    console.log(`[DEV] Reset URL: ${resetUrl}`);
    sendResponse(res, 200, true, 'Reset link sent (check server logs in dev)');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ─────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user)
      return sendResponse(res, 400, false, 'Invalid or expired token');

    user.password = req.body.password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);
    sendResponse(res, 200, true, 'Password reset successful', { token });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};
