const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/organizer.controller');
const protect = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

// Every organizer route → logged in + college/company
router.use(protect, authorize('college', 'company'));

// ── Organization profile ───────────────────────────────
router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);
router.put('/logo', upload.single('image'), ctrl.uploadLogo);
router.put('/cover', upload.single('image'), ctrl.uploadCover);

// ── Dashboard / analytics ───────────────────────────────
router.get('/overview', ctrl.getOverview);
router.get('/:hackathonId/analytics', ctrl.getHackathonAnalytics);

// ── Problem statements ──────────────────────────────────
router.post('/:hackathonId/problem-statements', ctrl.addProblemStatement);
router.put('/:hackathonId/problem-statements/:psId', ctrl.updateProblemStatement);
router.delete('/:hackathonId/problem-statements/:psId', ctrl.deleteProblemStatement);
// resources scoped to a problem statement
router.post('/:hackathonId/problem-statements/:psId/resources', ctrl.addProblemResource);
router.delete('/:hackathonId/problem-statements/:psId/resources/:resId', ctrl.deleteProblemResource);

// ── Resources ───────────────────────────────────────────
router.post('/:hackathonId/resources', ctrl.addResource);
router.delete('/:hackathonId/resources/:resId', ctrl.deleteResource);

// ── Participant management ──────────────────────────────
router.get('/:hackathonId/participants', ctrl.getParticipants);
router.get('/:hackathonId/participants/export', ctrl.exportParticipants);
router.get('/:hackathonId/participants/export/excel', ctrl.exportParticipantsExcel);
router.put('/:hackathonId/participants/:regId/status', ctrl.updateRegistrationStatus);

// ── Teams ───────────────────────────────────────────────
router.put('/:hackathonId/teams/:teamId/shortlist', ctrl.shortlistTeam);

// ── Submission review + reports ─────────────────────────
router.get('/:hackathonId/submissions/export', ctrl.exportSubmissions);
router.post('/:hackathonId/submissions/remind', ctrl.remindSubmissions);
router.put('/:hackathonId/submissions/:submissionId/review', ctrl.reviewSubmission);

// ── Leaderboard / winners ───────────────────────────────
router.get('/:hackathonId/leaderboard', ctrl.getLeaderboard);
router.put('/:hackathonId/winners', ctrl.publishWinners);

// ── Announcements ───────────────────────────────────────
router.post('/:hackathonId/announcements', ctrl.createAnnouncement);
router.get('/:hackathonId/announcements', ctrl.getAnnouncements);
router.delete('/:hackathonId/announcements/:annId', ctrl.deleteAnnouncement);

// ── Email / contact ─────────────────────────────────────
router.post('/:hackathonId/email', ctrl.emailParticipants);

// ── Certificates ────────────────────────────────────────
router.post('/:hackathonId/certificates/generate', ctrl.generateCertificates);
router.get('/:hackathonId/certificates', ctrl.getCertificates);

module.exports = router;
