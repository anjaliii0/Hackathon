const Student = require('../models/Student');
const User    = require('../models/User');
const Hackathon    = require('../models/Hackathon');
const Team         = require('../models/Team');
const Submission   = require('../models/Submission');
const Registration = require('../models/Registration');
const Certificate  = require('../models/Certificate');
const sendResponse = require('../utils/apiResponse');
const { uploadToCloudinary } = require('../config/cloudinary');

// Card fields used when returning bookmarked hackathons
const CARD_FIELDS = 'title banner mode themes prizePool registrationEnd registrationDeadline hackathonStart status location venue organizer';

// GET /api/student/profile
exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id })
      .populate('user', 'name email role isVerified');
    if (!student)
      return sendResponse(res, 404, false, 'Student profile not found');
    sendResponse(res, 200, true, 'Profile fetched', student);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// PUT /api/student/profile
// Accepts: bio, college, year, branch, skills, github, linkedin, portfolio
exports.updateProfile = async (req, res) => {
  try {
    const { bio, college, year, branch, skills, github, linkedin, portfolio } = req.body;
    const updated = await Student.findOneAndUpdate(
      { user: req.user.id },
      { bio, college, year, branch, skills, github, linkedin, portfolio },
      { new: true, runValidators: true }
    ).populate('user', 'name email role isVerified');

    if (!updated)
      return sendResponse(res, 404, false, 'Student profile not found');
    sendResponse(res, 200, true, 'Profile updated', updated);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// PUT /api/student/avatar  (multipart)
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file)
      return sendResponse(res, 400, false, 'No image file provided');
    const avatarUrl = await uploadToCloudinary(req.file.buffer, 'hackathon/avatars');
    const updated = await Student.findOneAndUpdate(
      { user: req.user.id }, { avatar: avatarUrl }, { new: true }
    );
    sendResponse(res, 200, true, 'Avatar uploaded', { avatar: updated.avatar });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// PUT /api/student/resume  (multipart)
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file)
      return sendResponse(res, 400, false, 'No resume file provided');
    const resumeUrl = await uploadToCloudinary(req.file.buffer, 'hackathon/resumes');
    const updated = await Student.findOneAndUpdate(
      { user: req.user.id }, { resume: resumeUrl }, { new: true }
    );
    sendResponse(res, 200, true, 'Resume uploaded', { resume: updated.resume });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// DELETE /api/student/account
exports.deleteAccount = async (req, res) => {
  try {
    await Student.findOneAndDelete({ user: req.user.id });
    await User.findByIdAndDelete(req.user.id);
    sendResponse(res, 200, true, 'Account deleted');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// GET /api/student/dashboard  — headline counts for the dashboard
// ─────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const teams = await Team.find({ members: userId }).select('_id');
    const teamIds = teams.map((t) => t._id);

    const [registrations, submissions, certificates] = await Promise.all([
      Registration.countDocuments({ student: userId }),
      Submission.countDocuments({ team: { $in: teamIds } }),
      Certificate.countDocuments({ recipient: userId }),
    ]);

    sendResponse(res, 200, true, 'Dashboard fetched', {
      registrations,
      teams: teams.length,
      submissions,
      certificates,
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// GET /api/student/bookmarks
// ─────────────────────────────────────────
exports.getBookmarks = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id })
      .populate({ path: 'bookmarks', select: CARD_FIELDS, populate: { path: 'organizer', select: 'name' } });

    if (!student) return sendResponse(res, 404, false, 'Student profile not found');

    // Drop any bookmarks whose hackathon was deleted
    const bookmarks = (student.bookmarks || []).filter(Boolean);
    sendResponse(res, 200, true, 'Bookmarks fetched', bookmarks);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// POST /api/student/bookmarks/:hackathonId  — toggle a bookmark
// ─────────────────────────────────────────
exports.toggleBookmark = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const hackathon = await Hackathon.findById(hackathonId).select('_id');
    if (!hackathon) return sendResponse(res, 404, false, 'Hackathon not found');

    const student = await Student.findOne({ user: req.user.id });
    if (!student) return sendResponse(res, 404, false, 'Student profile not found');

    const exists = student.bookmarks.some((b) => b.toString() === hackathonId);
    if (exists) {
      student.bookmarks.pull(hackathonId);
    } else {
      student.bookmarks.push(hackathonId);
    }
    await student.save();

    sendResponse(res, 200, true, exists ? 'Removed from saved' : 'Saved', { bookmarked: !exists });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// GET /api/student/certificates  — certificates issued to this student
// ─────────────────────────────────────────
exports.getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ recipient: req.user.id })
      .populate({ path: 'hackathon', select: 'title organizer', populate: { path: 'organizer', select: 'name' } })
      .populate('team', 'name')
      .sort({ issuedAt: -1 });

    sendResponse(res, 200, true, 'Certificates fetched', certificates);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};
