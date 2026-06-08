const express = require('express');
const router = express.Router();

const {
  getAllHackathons,
  getHackathonById,
  createHackathon,
  updateHackathon,
  uploadBanner,
  updateStatus,
  getLeaderboard,
  deleteHackathon,
  getMyHackathons
} = require('../controllers/hackathon.controller');

const protect   = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const upload    = require('../middlewares/upload.middleware');

// ── Public routes ─────────────────────────
router.get('/',    getAllHackathons);
router.get('/my',  protect, authorize('college', 'company'), getMyHackathons);
router.get('/:id', getHackathonById);
router.get('/:id/leaderboard', getLeaderboard);

// ── Organizer routes ──────────────────────
router.post('/',
  protect, authorize('college', 'company'),
  createHackathon
);

router.put('/:id',
  protect, authorize('college', 'company'),
  updateHackathon
);

router.put('/:id/banner',
  protect, authorize('college', 'company'),
  upload.single('banner'),
  uploadBanner
);

router.put('/:id/status',
  protect, authorize('college', 'company'),
  updateStatus
);

router.delete('/:id',
  protect, authorize('college', 'company'),
  deleteHackathon
);

module.exports = router;