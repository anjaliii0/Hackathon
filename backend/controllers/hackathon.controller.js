const Hackathon = require('../models/Hackathon');
const College = require('../models/College');
const Company = require('../models/Company');
const sendResponse = require('../utils/apiResponse');
const { uploadToCloudinary } = require('../config/cloudinary');

// ─────────────────────────────────────────
// @route   GET /api/hackathons
// @access  Public
// ─────────────────────────────────────────
exports.getAllHackathons = async (req, res) => {
  try {
    const { status, mode, theme, search, page = 1, limit = 10 } = req.query;

    const filter = { isApproved: true }; // only show admin-approved ones

    if (status) filter.status = status;
    if (mode)   filter.mode = mode;
    if (theme)  filter.themes = { $in: [theme] };
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;

    const hackathons = await Hackathon.find(filter)
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Hackathon.countDocuments(filter);

    sendResponse(res, 200, true, 'Hackathons fetched', {
      hackathons,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/hackathons/:id
// @access  Public
// ─────────────────────────────────────────
exports.getHackathonById = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id)
      .populate('organizer', 'name email');

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    sendResponse(res, 200, true, 'Hackathon fetched', hackathon);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/hackathons
// @access  Private (college, company)
// ─────────────────────────────────────────
exports.createHackathon = async (req, res) => {
  try {
    const role = req.user.role;

    // Check organizer is approved
    const Profile = role === 'college' ? College : Company;
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile)
      return sendResponse(res, 404, false, 'Organizer profile not found');

    if (!profile.isApproved)
      return sendResponse(res, 403, false, 'Your account is not yet approved by admin');

    const {
      title, description, mode, location, venue,
      registrationStart, registrationEnd, registrationDeadline,
      hackathonStart, hackathonEnd,
      teamSize, maxParticipants,
      themes, prizes, prizePool,
      problemStatements, resources
    } = req.body;

    const hackathon = await Hackathon.create({
      title, description, mode, location, venue,
      registrationStart, registrationEnd, registrationDeadline,
      hackathonStart, hackathonEnd,
      teamSize, maxParticipants,
      themes, prizes, prizePool,
      problemStatements, resources,
      organizer: req.user.id,
      organizerType: role,
      status: 'pending_approval',  // goes to admin first
      isApproved: false
    });

    // Push to organizer's hackathonsHosted list
    await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $push: { hackathonsHosted: hackathon._id } }
    );

    sendResponse(res, 201, true, 'Hackathon created, awaiting admin approval', hackathon);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/hackathons/:id
// @access  Private (college, company) — only owner
// ─────────────────────────────────────────
exports.updateHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    // Only owner can update
    if (hackathon.organizer.toString() !== req.user.id)
      return sendResponse(res, 403, false, 'Not authorized to update this hackathon');

    // Can't edit once it's ongoing or completed
    if (['ongoing', 'completed'].includes(hackathon.status))
      return sendResponse(res, 400, false, `Cannot edit a hackathon that is ${hackathon.status}`);

    const updated = await Hackathon.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    sendResponse(res, 200, true, 'Hackathon updated', updated);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/hackathons/:id/banner
// @access  Private (college, company) — only owner
// ─────────────────────────────────────────
exports.uploadBanner = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    if (hackathon.organizer.toString() !== req.user.id)
      return sendResponse(res, 403, false, 'Not authorized');

    if (!req.file)
      return sendResponse(res, 400, false, 'No image provided');

    const bannerUrl = await uploadToCloudinary(req.file.buffer, 'hackathon/banners');

    hackathon.banner = bannerUrl;
    await hackathon.save();

    sendResponse(res, 200, true, 'Banner uploaded', { banner: bannerUrl });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/hackathons/:id/status
// @access  Private (college, company) — only owner
// ─────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validTransitions = {
      open:      'ongoing',
      ongoing:   'judging',
      judging:   'completed'
    };

    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    if (hackathon.organizer.toString() !== req.user.id)
      return sendResponse(res, 403, false, 'Not authorized');

    // Validate transition
    if (validTransitions[hackathon.status] !== status)
      return sendResponse(res, 400, false,
        `Cannot move from '${hackathon.status}' to '${status}'`);

    hackathon.status = status;
    await hackathon.save();

    sendResponse(res, 200, true, `Status updated to '${status}'`, hackathon);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/hackathons/:id/leaderboard
// @access  Public
// ─────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const Submission = require('../models/Submission');

    const submissions = await Submission.find({
      hackathon: req.params.id,
      rank: { $exists: true }          // only ranked submissions
    })
      .populate('team', 'name members')
      .sort({ rank: 1 });              // rank 1 first

    sendResponse(res, 200, true, 'Leaderboard fetched', submissions);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/hackathons/:id
// @access  Private (college, company) — only owner
// ─────────────────────────────────────────
exports.deleteHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    if (hackathon.organizer.toString() !== req.user.id)
      return sendResponse(res, 403, false, 'Not authorized');

    // Only delete if still in draft or pending
    if (!['draft', 'pending_approval'].includes(hackathon.status))
      return sendResponse(res, 400, false, 'Cannot delete a live or completed hackathon');

    await hackathon.deleteOne();

    sendResponse(res, 200, true, 'Hackathon deleted');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/hackathons/my
// @access  Private (college, company)
// ─────────────────────────────────────────
exports.getMyHackathons = async (req, res) => {
  try {
    const hackathons = await Hackathon.find({ organizer: req.user.id })
      .sort({ createdAt: -1 });

    sendResponse(res, 200, true, 'Your hackathons fetched', hackathons);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};