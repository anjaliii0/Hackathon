const express = require('express');
const router = express.Router();

const {
  register,
  unregister,
  getMyRegistration,
  getMyRegistrations,
} = require('../controllers/registration.controller');

const protect = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

router.use(protect, authorize('student'));

router.get('/my', getMyRegistrations);
router.get('/:hackathonId/my', getMyRegistration);
router.post('/:hackathonId', register);
router.delete('/:hackathonId', unregister);

module.exports = router;
