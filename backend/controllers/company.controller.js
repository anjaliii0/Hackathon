const Company = require('../models/Company');
const User = require('../models/User');
const sendResponse = require('../utils/apiResponse');
const { uploadToCloudinary } = require('../config/cloudinary');

// ─────────────────────────────────────────
// @route   GET /api/company/profile
// @access  Private (company)
// ─────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id })
      .populate('user', 'name email role')
      .populate('hackathonsHosted', 'title status registrationEnd');

    if (!company)
      return sendResponse(res, 404, false, 'Company profile not found');

    sendResponse(res, 200, true, 'Profile fetched', company);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/company/profile
// @access  Private (company)
// ─────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { companyName, industry, website, description, location, contactEmail } = req.body;

    const updated = await Company.findOneAndUpdate(
      { user: req.user.id },
      { companyName, industry, website, description, location, contactEmail },
      { new: true, runValidators: true }
    ).populate('user', 'name email role');

    if (!updated)
      return sendResponse(res, 404, false, 'Company profile not found');

    sendResponse(res, 200, true, 'Profile updated', updated);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/company/logo
// @access  Private (company)
// ─────────────────────────────────────────
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file)
      return sendResponse(res, 400, false, 'No image file provided');

    const logoUrl = await uploadToCloudinary(req.file.buffer, 'hackathon/company-logos');

    const updated = await Company.findOneAndUpdate(
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
// @route   DELETE /api/company/account
// @access  Private (company)
// ─────────────────────────────────────────
exports.deleteAccount = async (req, res) => {
  try {
    await Company.findOneAndDelete({ user: req.user.id });
    await User.findByIdAndDelete(req.user.id);

    sendResponse(res, 200, true, 'Account deleted successfully');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};