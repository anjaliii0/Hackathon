const Application = require('../models/Application');
const Hackathon = require('../models/Hackathon');
const sendResponse = require('../utils/apiResponse');

// ─────────────────────────────────────────
// @route   POST /api/applications/:hackathonId/apply
// @access  Private (student)
// ─────────────────────────────────────────
exports.applyToHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.hackathonId);

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    // Only apply to open hackathons
    if (hackathon.status !== 'open')
      return sendResponse(res, 400, false, 'Hackathon is not open for registration');

    // Check registration deadline
    if (new Date() > new Date(hackathon.registrationEnd))
      return sendResponse(res, 400, false, 'Registration deadline has passed');

    // Prevent duplicate application
    const existing = await Application.findOne({
      student: req.user.id,
      hackathon: req.params.hackathonId
    });

    if (existing)
      return sendResponse(res, 400, false, 'You have already applied to this hackathon');

    const application = await Application.create({
      student:   req.user.id,
      hackathon: req.params.hackathonId,
      status:    'pending',
      appliedAt: Date.now()
    });

    sendResponse(res, 201, true, 'Application submitted successfully', application);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/applications/my
// @access  Private (student)
// ─────────────────────────────────────────
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user.id })
      .populate('hackathon', 'title status registrationEnd hackathonStart banner')
      .sort({ appliedAt: -1 });

    sendResponse(res, 200, true, 'Applications fetched', applications);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/applications/:hackathonId
// @access  Private (student) — single application status
// ─────────────────────────────────────────
exports.getMyApplicationForHackathon = async (req, res) => {
  try {
    const application = await Application.findOne({
      student:   req.user.id,
      hackathon: req.params.hackathonId
    }).populate('hackathon', 'title status');

    if (!application)
      return sendResponse(res, 404, false, 'No application found for this hackathon');

    sendResponse(res, 200, true, 'Application fetched', application);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/applications/:hackathonId/withdraw
// @access  Private (student)
// ─────────────────────────────────────────
exports.withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findOne({
      student:   req.user.id,
      hackathon: req.params.hackathonId
    });

    if (!application)
      return sendResponse(res, 404, false, 'Application not found');

    // Can only withdraw if still pending
    if (application.status !== 'pending')
      return sendResponse(res, 400, false,
        `Cannot withdraw a '${application.status}' application`);

    await application.deleteOne();

    sendResponse(res, 200, true, 'Application withdrawn successfully');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/applications/:hackathonId/all
// @access  Private (college, company) — organizer only
// ─────────────────────────────────────────
exports.getAllApplications = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.hackathonId);

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    // Only the organizer of THIS hackathon can view
    if (hackathon.organizer.toString() !== req.user.id)
      return sendResponse(res, 403, false, 'Not authorized to view these applications');

    const { status } = req.query; // filter by status if needed
    const filter = { hackathon: req.params.hackathonId };
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate('student', 'name email')          // basic info
      .populate({
        path:   'student',
        model:  'User',
        select: 'name email'
      })
      .populate('team', 'name')
      .sort({ appliedAt: 1 });                    // oldest first

    sendResponse(res, 200, true, 'Applications fetched', {
      total: applications.length,
      applications
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/applications/:hackathonId/:applicationId/review
// @access  Private (college, company) — organizer only
// ─────────────────────────────────────────
exports.reviewApplication = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;

    // Only these statuses are valid review outcomes
    const allowed = ['accepted', 'rejected', 'waitlisted'];
    if (!allowed.includes(status))
      return sendResponse(res, 400, false, 'Invalid status. Use accepted / rejected / waitlisted');

    const hackathon = await Hackathon.findById(req.params.hackathonId);

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    if (hackathon.organizer.toString() !== req.user.id)
      return sendResponse(res, 403, false, 'Not authorized to review applications');

    const application = await Application.findById(req.params.applicationId);

    if (!application)
      return sendResponse(res, 404, false, 'Application not found');

    // Can't re-review already decided applications
    if (application.status !== 'pending')
      return sendResponse(res, 400, false,
        `Application already ${application.status}`);

    application.status     = status;
    application.reviewNote = reviewNote || '';
    application.reviewedAt = Date.now();
    await application.save();

    // TODO: trigger Notification to student here later

    sendResponse(res, 200, true, `Application ${status}`, application);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};