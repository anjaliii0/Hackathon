const express = require('express');
const router = express.Router();

const {
  submitProject,
  editSubmission,
  getMySubmission,
  getAllSubmissions,
  judgeSubmission,
  getSubmissionById
} = require('../controllers/submission.controller');

const protect   = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const upload    = require('../middlewares/upload.middleware');

// ── Student routes ─────────────────────────────────────
router.post(
  '/:hackathonId/submit',
  protect, authorize('student'),
  upload.single('presentation'),
  submitProject
);

router.put(
  '/:hackathonId/edit',
  protect, authorize('student'),
  upload.single('presentation'),
  editSubmission
);

router.get(
  '/:hackathonId/my',
  protect, authorize('student'),
  getMySubmission
);

// ── Organizer routes ───────────────────────────────────
router.get(
  '/:hackathonId/all',
  protect, authorize('college', 'company'),
  getAllSubmissions
);

router.get(
  '/:hackathonId/:submissionId',
  protect, authorize('college', 'company'),
  getSubmissionById
);

router.put(
  '/:hackathonId/:submissionId/judge',
  protect, authorize('college', 'company'),
  judgeSubmission
);

module.exports = router;