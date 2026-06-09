const express = require('express');
const router = express.Router();

const {
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadResume,
  deleteAccount,
  getDashboard,
  getBookmarks,
  toggleBookmark,
  getMyCertificates
} = require('../controllers/student.controller');

const protect   = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const upload    = require('../middlewares/upload.middleware');

// All routes → must be logged in + must be student
router.use(protect, authorize('student'));

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Dashboard, bookmarks, certificates
router.get('/dashboard', getDashboard);
router.get('/bookmarks', getBookmarks);
router.post('/bookmarks/:hackathonId', toggleBookmark);
router.get('/certificates', getMyCertificates);

// File uploads  → multer runs BEFORE controller
router.put('/avatar', upload.single('avatar'), uploadAvatar);
router.put('/resume', upload.single('resume'),  uploadResume);

// Account
router.delete('/account', deleteAccount);

module.exports = router;