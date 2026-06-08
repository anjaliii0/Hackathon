const express = require('express');
const router = express.Router();

const {
  getProfile,
  updateProfile,
  uploadLogo,
  deleteAccount
} = require('../controllers/company.controller');

const protect   = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const upload    = require('../middlewares/upload.middleware');

// All routes → must be logged in + must be company
router.use(protect, authorize('company'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/logo', upload.single('logo'), uploadLogo);
router.delete('/account', deleteAccount);

module.exports = router;