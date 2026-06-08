const express = require('express');
const router = express.Router();

const {
  createTeam,
  joinTeam,
  getMyTeam,
  markTeamComplete,
  regenerateInviteCode,
  leaveTeam,
  deleteTeam,
  getAllTeams
} = require('../controllers/team.controller');

const protect   = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// ── Student routes ─────────────────────────────────
router.post(
  '/:hackathonId/create',
  protect, authorize('student'),
  createTeam
);

router.post(
  '/:hackathonId/join',
  protect, authorize('student'),
  joinTeam
);

router.get(
  '/:hackathonId/my',
  protect, authorize('student'),
  getMyTeam
);

router.put(
  '/:hackathonId/complete',
  protect, authorize('student'),
  markTeamComplete
);

router.put(
  '/:hackathonId/regenerate-code',
  protect, authorize('student'),
  regenerateInviteCode
);

router.delete(
  '/:hackathonId/leave',
  protect, authorize('student'),
  leaveTeam
);

router.delete(
  '/:hackathonId/delete',
  protect, authorize('student'),
  deleteTeam
);

// ── Organizer routes ───────────────────────────────
router.get(
  '/:hackathonId/all',
  protect, authorize('college', 'company'),
  getAllTeams
);

module.exports = router;