const College = require('../models/College');
const User = require('../models/User');
const sendResponse = require('../utils/apiResponse');
const { uploadToCloudinary } = require('../config/cloudinary');

// ─────────────────────────────────────────
// @route   GET /api/college/profile
// @access  Private (college)
// ─────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const college = await College.findOne({ user: req.user.id })
      .populate('user', 'name email role')
      .populate('hackathonsHosted', 'title status registrationEnd'); // preview of hosted hackathons

    if (!college)
      return sendResponse(res, 404, false, 'College profile not found');

    sendResponse(res, 200, true, 'Profile fetched', college);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/college/profile
// @access  Private (college)
// ─────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { collegeName, location, website, description, establishedYear, contactEmail } = req.body;

    const updated = await College.findOneAndUpdate(
      { user: req.user.id },
      { collegeName, location, website, description, establishedYear, contactEmail },
      { new: true, runValidators: true }
    ).populate('user', 'name email role');

    if (!updated)
      return sendResponse(res, 404, false, 'College profile not found');

    sendResponse(res, 200, true, 'Profile updated', updated);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/college/logo
// @access  Private (college)
// ─────────────────────────────────────────
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file)
      return sendResponse(res, 400, false, 'No image file provided');

    const logoUrl = await uploadToCloudinary(req.file.buffer, 'hackathon/college-logos');

    const updated = await College.findOneAndUpdate(
      { user: req.user.id },
      { logo: logoUrl },
      { new: true }
    );

    sendResponse(res, 200, true, 'Logo uploaded', { logo: updated.logo });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/college/account
// @access  Private (college)
// ─────────────────────────────────────────
exports.deleteAccount = async (req, res) => {
  try {
    // ⚠️ In production → also handle their hackathons (cancel or reassign)
    await College.findOneAndDelete({ user: req.user.id });
    await User.findByIdAndDelete(req.user.id);

    sendResponse(res, 200, true, 'Account deleted successfully');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};