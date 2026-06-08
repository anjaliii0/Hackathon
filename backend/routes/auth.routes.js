const express = require('express');
const router  = express.Router();
const {
  register, login, logout, getMe,
  forgotPassword, resetPassword,
  verifyEmail, resendVerification,
} = require('../controllers/auth.controller');

const protect = require('../middlewares/auth.middleware');

// Public
router.post('/register',       register);
router.post('/login',          login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected
router.post('/logout',              protect, logout);
router.get('/me',                   protect, getMe);
router.post('/verify-email',        protect, verifyEmail);
router.post('/resend-verification', protect, resendVerification);

module.exports = router;
