const Submission = require('../models/Submission');
const Team = require('../models/Team');
const Hackathon = require('../models/Hackathon');
const sendResponse = require('../utils/apiResponse');
const { uploadToCloudinary } = require('../config/cloudinary');

// ─────────────────────────────────────────
// @route   POST /api/submissions/:hackathonId/submit
// @access  Private (student) — leader only
// ─────────────────────────────────────────
exports.submitProject = async (req, res) => {
  try {
    const { title, description, projectUrl, demoUrl } = req.body;

    const hackathon = await Hackathon.findById(req.params.hackathonId);
    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    // Can only submit during ongoing or judging phase
    if (!['ongoing', 'judging'].includes(hackathon.status))
      return sendResponse(res, 400, false,
        'Submissions are only allowed during ongoing or judging phase');

    // Must be a team leader in this hackathon
    const team = await Team.findOne({
      hackathon: req.params.hackathonId,
      leader:    req.user.id             // only leader submits
    });

    if (!team)
      return sendResponse(res, 403, false,
        'Only team leaders can submit. Make sure you are a leader in this hackathon');

    // Team must be marked complete before submitting
    if (!team.isComplete)
      return sendResponse(res, 400, false,
        'Mark your team as complete before submitting');

    // One submission per team per hackathon
    const existing = await Submission.findOne({
      team:      team._id,
      hackathon: req.params.hackathonId
    });

    if (existing)
      return sendResponse(res, 400, false,
        'Your team has already submitted. Use edit to update it');

    // Check if submission deadline passed
    const isLate = new Date() > new Date(hackathon.hackathonEnd);

    // Handle presentation file upload if provided
    let presentationUrl = null;
    if (req.file) {
      presentationUrl = await uploadToCloudinary(
        req.file.buffer,
        'hackathon/presentations'
      );
    }

    const submission = await Submission.create({
      hackathon:    req.params.hackathonId,
      team:         team._id,
      title,
      description,
      projectUrl,
      demoUrl,
      presentation: presentationUrl,
      submittedAt:  Date.now(),
      isLate
    });

    sendResponse(res, 201, true,
      isLate ? 'Submission received (marked as late)' : 'Project submitted successfully',
      submission
    );
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/submissions/:hackathonId/edit
// @access  Private (student) — leader only
// ─────────────────────────────────────────
exports.editSubmission = async (req, res) => {
  try {
    const { title, description, projectUrl, demoUrl } = req.body;

    const hackathon = await Hackathon.findById(req.params.hackathonId);
    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    // Cannot edit after judging is done
    if (hackathon.status === 'completed')
      return sendResponse(res, 400, false,
        'Cannot edit submission after hackathon is completed');

    const team = await Team.findOne({
      hackathon: req.params.hackathonId,
      leader:    req.user.id
    });

    if (!team)
      return sendResponse(res, 403, false, 'Only team leader can edit submission');

    const submission = await Submission.findOne({
      team:      team._id,
      hackathon: req.params.hackathonId
    });

    if (!submission)
      return sendResponse(res, 404, false, 'No submission found to edit');

    // Update presentation if new file uploaded
    if (req.file) {
      submission.presentation = await uploadToCloudinary(
        req.file.buffer,
        'hackathon/presentations'
      );
    }

    submission.title       = title       || submission.title;
    submission.description = description || submission.description;
    submission.projectUrl  = projectUrl  || submission.projectUrl;
    submission.demoUrl     = demoUrl     || submission.demoUrl;

    await submission.save();

    sendResponse(res, 200, true, 'Submission updated', submission);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/submissions/:hackathonId/my
// @access  Private (student)
// ─────────────────────────────────────────
exports.getMySubmission = async (req, res) => {
  try {
    const team = await Team.findOne({
      hackathon: req.params.hackathonId,
      members:   req.user.id
    });

    if (!team)
      return sendResponse(res, 404, false, 'You are not in a team for this hackathon');

    const submission = await Submission.findOne({
      team:      team._id,
      hackathon: req.params.hackathonId
    }).populate('team', 'name members leader');

    if (!submission)
      return sendResponse(res, 404, false, 'No submission found for your team');

    sendResponse(res, 200, true, 'Submission fetched', submission);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/submissions/:hackathonId/all
// @access  Private (college, company) — organizer only
// ─────────────────────────────────────────
exports.getAllSubmissions = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.hackathonId);

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    if (hackathon.organizer.toString() !== req.user.id)
      return sendResponse(res, 403, false,
        'Not authorized to view submissions for this hackathon');

    const submissions = await Submission.find({
      hackathon: req.params.hackathonId
    })
      .populate('team', 'name members leader')
      .sort({ submittedAt: 1 });

    sendResponse(res, 200, true, 'Submissions fetched', {
      total: submissions.length,
      submissions
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/submissions/:hackathonId/:submissionId/judge
// @access  Private (college, company) — organizer only
// ─────────────────────────────────────────
exports.judgeSubmission = async (req, res) => {
  try {
    const { score, rank, feedback } = req.body;

    const hackathon = await Hackathon.findById(req.params.hackathonId);

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    if (hackathon.organizer.toString() !== req.user.id)
      return sendResponse(res, 403, false, 'Not authorized to judge this hackathon');

    // Can only judge during judging phase
    if (hackathon.status !== 'judging')
      return sendResponse(res, 400, false,
        'Judging is only allowed when hackathon status is judging');

    const submission = await Submission.findById(req.params.submissionId);

    if (!submission)
      return sendResponse(res, 404, false, 'Submission not found');

    // Validate score range
    if (score !== undefined && (score < 0 || score > 100))
      return sendResponse(res, 400, false, 'Score must be between 0 and 100');

    submission.score    = score    ?? submission.score;
    submission.rank     = rank     ?? submission.rank;
    submission.feedback = feedback ?? submission.feedback;

    await submission.save();

    // TODO: trigger Notification to team members here

    sendResponse(res, 200, true, 'Submission judged', submission);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/submissions/:hackathonId/:submissionId
// @access  Private (college, company) — single submission detail
// ─────────────────────────────────────────
exports.getSubmissionById = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.hackathonId);

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    if (hackathon.organizer.toString() !== req.user.id)
      return sendResponse(res, 403, false, 'Not authorized');

    const submission = await Submission.findById(req.params.submissionId)
      .populate('team', 'name members leader');

    if (!submission)
      return sendResponse(res, 404, false, 'Submission not found');

    sendResponse(res, 200, true, 'Submission fetched', submission);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};