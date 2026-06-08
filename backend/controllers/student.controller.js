const Student = require('../models/Student');
const User    = require('../models/User');
const sendResponse = require('../utils/apiResponse');
const { uploadToCloudinary } = require('../config/cloudinary');

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
