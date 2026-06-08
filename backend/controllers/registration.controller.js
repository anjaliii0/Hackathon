const Registration = require('../models/Registration');
const Hackathon = require('../models/Hackathon');
const Notification = require('../models/Notification');
const sendResponse = require('../utils/apiResponse');

// ─────────────────────────────────────────
// @route   POST /api/registrations/:hackathonId
// @access  Private (student)
// ─────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.hackathonId);
    if (!hackathon) return sendResponse(res, 404, false, 'Hackathon not found');

    if (!hackathon.isApproved)
      return sendResponse(res, 400, false, 'This hackathon is not open for registration yet');

    if (!['open', 'ongoing'].includes(hackathon.status))
      return sendResponse(res, 400, false, `Registration is closed (status: ${hackathon.status})`);

    // Respect the registration deadline if one is set
    const deadline = hackathon.registrationDeadline || hackathon.registrationEnd;
    if (deadline && new Date() > new Date(deadline))
      return sendResponse(res, 400, false, 'Registration deadline has passed');

    const existing = await Registration.findOne({
      hackathon: hackathon._id,
      student: req.user.id,
    });
    if (existing)
      return sendResponse(res, 400, false, 'You are already registered for this hackathon');

    const registration = await Registration.create({
      hackathon: hackathon._id,
      student: req.user.id,
      note: req.body.note,
    });

    // Let the organizer know someone registered
    await Notification.create({
      recipient: hackathon.organizer,
      type: 'general',
      message: `New registration for "${hackathon.title}".`,
      link: `/organizer/hackathons/${hackathon._id}`,
    });

    sendResponse(res, 201, true, 'Registered successfully', registration);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/registrations/:hackathonId
// @access  Private (student)
// ─────────────────────────────────────────
exports.unregister = async (req, res) => {
  try {
    const deleted = await Registration.findOneAndDelete({
      hackathon: req.params.hackathonId,
      student: req.user.id,
    });
    if (!deleted) return sendResponse(res, 404, false, 'You are not registered for this hackathon');
    sendResponse(res, 200, true, 'Registration cancelled');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/registrations/:hackathonId/my
// @access  Private (student)
// ─────────────────────────────────────────
exports.getMyRegistration = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      hackathon: req.params.hackathonId,
      student: req.user.id,
    });
    sendResponse(res, 200, true, 'Registration status fetched', { registered: !!registration, registration });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/registrations/my
// @access  Private (student)
// ─────────────────────────────────────────
exports.getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.user.id })
      .populate('hackathon', 'title status mode banner registrationEnd hackathonStart')
      .sort({ createdAt: -1 });
    sendResponse(res, 200, true, 'Your registrations fetched', registrations);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};
