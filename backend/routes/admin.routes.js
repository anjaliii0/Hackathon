const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  banUser,
  unbanUser,
  deleteUser,
  getPendingOrganizers,
  approveOrganizer,
  getAllHackathons,
  getPendingHackathons,
  approveHackathon,
  toggleFeatureHackathon,
  deleteHackathon,
  getPlatformStats,
  getDashboard,
  broadcastEmail,
  getBroadcasts
} = require('../controllers/admin.controller');

const protect   = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// All admin routes → must be logged in + must be admin
router.use(protect, authorize('admin'));

// ── Stats / analytics ──────────────────────────────
router.get('/stats', getPlatformStats);
router.get('/dashboard', getDashboard);

// ── Email / broadcast ──────────────────────────────
router.post('/broadcast', broadcastEmail);
router.get('/broadcasts', getBroadcasts);

// ── User management ────────────────────────────────
router.get('/users',          getAllUsers);
router.get('/users/:id',      getUserById);
router.put('/users/:id/ban',  banUser);
router.put('/users/:id/unban',unbanUser);
router.delete('/users/:id',   deleteUser);

// ── Organizer approvals ────────────────────────────
router.get('/approvals/organizers',      getPendingOrganizers);
router.put('/approvals/organizers/:id',  approveOrganizer);

// ── Hackathon management ───────────────────────────
router.get('/hackathons',             getAllHackathons);
router.get('/hackathons/pending',     getPendingHackathons);
router.put('/hackathons/:id/approve', approveHackathon);
router.put('/hackathons/:id/feature', toggleFeatureHackathon);
router.delete('/hackathons/:id',      deleteHackathon);

module.exports = router;