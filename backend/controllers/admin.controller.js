const User = require('../models/User');
const College = require('../models/College');
const Company = require('../models/Company');
const Student = require('../models/Student');
const Hackathon = require('../models/Hackathon');
const Application = require('../models/Application');
const Team = require('../models/Team');
const Submission = require('../models/Submission');
const Transaction = require('../models/Transaction');
const Broadcast = require('../models/Broadcast');
const Notification = require('../models/Notification');
const sendResponse = require('../utils/apiResponse');

// Notional platform fees (₹) used to record revenue automatically.
const LISTING_FEE = 2000;
const FEATURE_FEE = 1500;

// ══════════════════════════════════════════
//  USER MANAGEMENT
// ══════════════════════════════════════════

// ─────────────────────────────────────────
// @route   GET /api/admin/users
// @access  Private (admin)
// ─────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isBanned, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role)     filter.role = role;
    if (isBanned) filter.isBanned = isBanned === 'true';
    if (search)   filter.name = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    sendResponse(res, 200, true, 'Users fetched', {
      users,
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
// @route   GET /api/admin/users/:id
// @access  Private (admin)
// ─────────────────────────────────────────
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user)
      return sendResponse(res, 404, false, 'User not found');

    // Fetch role-specific profile alongside
    let profile = null;
    if (user.role === 'student')      profile = await Student.findOne({ user: user._id });
    else if (user.role === 'college') profile = await College.findOne({ user: user._id });
    else if (user.role === 'company') profile = await Company.findOne({ user: user._id });

    sendResponse(res, 200, true, 'User fetched', { user, profile });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/admin/users/:id/ban
// @access  Private (admin)
// ─────────────────────────────────────────
exports.banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return sendResponse(res, 404, false, 'User not found');

    // Protect admin accounts from being banned
    if (user.role === 'admin')
      return sendResponse(res, 403, false, 'Cannot suspend another admin');

    user.isBanned = true;
    user.suspendedReason = req.body.reason || 'Violation of platform policy';
    user.suspendedAt = new Date();
    await user.save();

    // Notify the suspended user
    await Notification.create({
      recipient: user._id,
      type: 'general',
      message: `Your account has been suspended. Reason: ${user.suspendedReason}`,
    });

    sendResponse(res, 200, true, `User ${user.name} has been suspended`);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/admin/users/:id/unban
// @access  Private (admin)
// ─────────────────────────────────────────
exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return sendResponse(res, 404, false, 'User not found');

    user.isBanned = false;
    user.suspendedReason = undefined;
    user.suspendedAt = undefined;
    await user.save();

    sendResponse(res, 200, true, `User ${user.name} has been reinstated`);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
// ─────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return sendResponse(res, 404, false, 'User not found');

    if (user.role === 'admin')
      return sendResponse(res, 403, false, 'Cannot delete another admin');

    // Delete role-specific profile too
    if (user.role === 'student')      await Student.findOneAndDelete({ user: user._id });
    else if (user.role === 'college') await College.findOneAndDelete({ user: user._id });
    else if (user.role === 'company') await Company.findOneAndDelete({ user: user._id });

    await user.deleteOne();

    sendResponse(res, 200, true, 'User deleted successfully');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════
//  COLLEGE / COMPANY APPROVAL
// ══════════════════════════════════════════

// ─────────────────────────────────────────
// @route   GET /api/admin/approvals/organizers
// @access  Private (admin)
// ─────────────────────────────────────────
exports.getPendingOrganizers = async (req, res) => {
  try {
    const { type = 'both' } = req.query; // college | company | both

    let colleges = [], companies = [];

    if (type === 'college' || type === 'both')
      colleges = await College.find({ isApproved: false })
        .populate('user', 'name email createdAt');

    if (type === 'company' || type === 'both')
      companies = await Company.find({ isApproved: false })
        .populate('user', 'name email createdAt');

    sendResponse(res, 200, true, 'Pending organizers fetched', { colleges, companies });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/admin/approvals/organizers/:id
// @access  Private (admin)
// ─────────────────────────────────────────
exports.approveOrganizer = async (req, res) => {
  try {
    const { type, action } = req.body; // type: college|company, action: approve|reject

    if (!['college', 'company'].includes(type))
      return sendResponse(res, 400, false, 'Type must be college or company');

    if (!['approve', 'reject'].includes(action))
      return sendResponse(res, 400, false, 'Action must be approve or reject');

    const Profile = type === 'college' ? College : Company;
    const profile = await Profile.findById(req.params.id)
      .populate('user', 'name email');

    if (!profile)
      return sendResponse(res, 404, false, `${type} profile not found`);

    if (action === 'approve') {
      profile.isApproved = true;
      await profile.save();
      // TODO: send approval email to organizer
      sendResponse(res, 200, true, `${type} approved successfully`, profile);
    } else {
      // Reject → delete their profile + user account
      await User.findByIdAndDelete(profile.user._id);
      await profile.deleteOne();
      sendResponse(res, 200, true, `${type} rejected and removed`);
    }
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════
//  HACKATHON MANAGEMENT
// ══════════════════════════════════════════

// ─────────────────────────────────────────
// @route   GET /api/admin/hackathons
// @access  Private (admin)
// ─────────────────────────────────────────
exports.getAllHackathons = async (req, res) => {
  try {
    const { status, isApproved, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status)     filter.status = status;
    if (isApproved !== undefined)
      filter.isApproved = isApproved === 'true';

    const skip = (page - 1) * limit;

    const hackathons = await Hackathon.find(filter)
      .populate('organizer', 'name email role')
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
// @route   GET /api/admin/hackathons/pending
// @access  Private (admin)
// ─────────────────────────────────────────
exports.getPendingHackathons = async (req, res) => {
  try {
    const hackathons = await Hackathon.find({
      isApproved: false,
      status:     'pending_approval'
    }).populate('organizer', 'name email role');

    sendResponse(res, 200, true, 'Pending hackathons fetched', {
      total: hackathons.length,
      hackathons
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/admin/hackathons/:id/approve
// @access  Private (admin)
// ─────────────────────────────────────────
exports.approveHackathon = async (req, res) => {
  try {
    const { action } = req.body; // approve | reject

    if (!['approve', 'reject'].includes(action))
      return sendResponse(res, 400, false, 'Action must be approve or reject');

    const hackathon = await Hackathon.findById(req.params.id)
      .populate('organizer', 'name email');

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    if (hackathon.status !== 'pending_approval')
      return sendResponse(res, 400, false, 'Hackathon is not pending approval');

    if (action === 'approve') {
      hackathon.isApproved = true;
      hackathon.status     = 'open';    // goes live immediately
      await hackathon.save();

      // Record the listing fee as revenue (once per hackathon)
      const already = await Transaction.findOne({ hackathon: hackathon._id, type: 'listing_fee' });
      if (!already) {
        await Transaction.create({
          organizer: hackathon.organizer._id,
          hackathon: hackathon._id,
          type: 'listing_fee',
          amount: LISTING_FEE,
          note: `Listing fee for "${hackathon.title}"`,
        });
      }

      await Notification.create({
        recipient: hackathon.organizer._id,
        type: 'hackathon_approved',
        message: `Your hackathon "${hackathon.title}" was approved and is now live!`,
        link: `/organizer/hackathons/${hackathon._id}`,
      });

      sendResponse(res, 200, true, 'Hackathon approved and is now live', hackathon);
    } else {
      hackathon.status = 'draft';       // send back to draft
      await hackathon.save();

      await Notification.create({
        recipient: hackathon.organizer._id,
        type: 'general',
        message: `Your hackathon "${hackathon.title}" was not approved${req.body.reason ? `: ${req.body.reason}` : ''}. It has been moved back to draft.`,
        link: `/organizer/hackathons/${hackathon._id}`,
      });

      sendResponse(res, 200, true, 'Hackathon rejected, moved back to draft');
    }
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/admin/hackathons/:id/feature
// @access  Private (admin)
// Toggle whether a hackathon is featured on the public home page.
// ─────────────────────────────────────────
exports.toggleFeatureHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    const wasFeatured = hackathon.isFeatured;
    hackathon.isFeatured = req.body.featured !== undefined
      ? !!req.body.featured
      : !hackathon.isFeatured;
    await hackathon.save();

    // Charge a feature fee the first time it's promoted
    if (!wasFeatured && hackathon.isFeatured) {
      await Transaction.create({
        organizer: hackathon.organizer,
        hackathon: hackathon._id,
        type: 'feature_fee',
        amount: FEATURE_FEE,
        note: `Feature promotion for "${hackathon.title}"`,
      });
    }

    sendResponse(res, 200, true,
      hackathon.isFeatured ? 'Hackathon featured' : 'Hackathon unfeatured',
      { isFeatured: hackathon.isFeatured });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/admin/hackathons/:id
// @access  Private (admin)
// ─────────────────────────────────────────
exports.deleteHackathon = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    // Cascade delete → applications, teams, submissions
    await Application.deleteMany({ hackathon: hackathon._id });
    await Team.deleteMany({ hackathon: hackathon._id });
    await Submission.deleteMany({ hackathon: hackathon._id });
    await hackathon.deleteOne();

    sendResponse(res, 200, true, 'Hackathon and all related data deleted');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════
//  PLATFORM STATS
// ══════════════════════════════════════════

// ─────────────────────────────────────────
// @route   GET /api/admin/stats
// @access  Private (admin)
// ─────────────────────────────────────────
exports.getPlatformStats = async (req, res) => {
  try {
    // Run all counts in parallel for speed
    const [
      totalUsers,
      totalStudents,
      totalColleges,
      totalCompanies,
      totalHackathons,
      liveHackathons,
      pendingHackathons,
      totalApplications,
      totalTeams,
      totalSubmissions,
      bannedUsers,
      pendingOrganizers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'college' }),
      User.countDocuments({ role: 'company' }),
      Hackathon.countDocuments(),
      Hackathon.countDocuments({ status: 'ongoing' }),
      Hackathon.countDocuments({ status: 'pending_approval' }),
      Application.countDocuments(),
      Team.countDocuments(),
      Submission.countDocuments(),
      User.countDocuments({ isBanned: true }),
      College.countDocuments({ isApproved: false })
        .then(c => Company.countDocuments({ isApproved: false })
        .then(co => c + co))
    ]);

    sendResponse(res, 200, true, 'Platform stats fetched', {
      users: {
        total:     totalUsers,
        students:  totalStudents,
        colleges:  totalColleges,
        companies: totalCompanies,
        banned:    bannedUsers
      },
      hackathons: {
        total:   totalHackathons,
        live:    liveHackathons,
        pending: pendingHackathons
      },
      activity: {
        applications: totalApplications,
        teams:        totalTeams,
        submissions:  totalSubmissions
      },
      pendingOrganizers
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════
//  ANALYTICS DASHBOARD
// ══════════════════════════════════════════

// ─────────────────────────────────────────
// @route   GET /api/admin/dashboard
// @access  Private (admin)
// Total users, active users, total hackathons, revenue (+ breakdowns).
// ─────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const now = Date.now();
    const dayAgo   = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, students, colleges, companies, admins,
      activeToday, activeWeek, activeMonth,
      suspended, pendingOrganizers,
      totalHackathons, liveHackathons, pendingHackathons, featuredHackathons,
      revenueAgg, revenueByType, recentTx,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'college' }),
      User.countDocuments({ role: 'company' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ lastActive: { $gte: dayAgo } }),
      User.countDocuments({ lastActive: { $gte: weekAgo } }),
      User.countDocuments({ lastActive: { $gte: monthAgo } }),
      User.countDocuments({ isBanned: true }),
      College.countDocuments({ isApproved: false })
        .then(c => Company.countDocuments({ isApproved: false }).then(co => c + co)),
      Hackathon.countDocuments(),
      Hackathon.countDocuments({ status: { $in: ['open', 'ongoing'] } }),
      Hackathon.countDocuments({ status: 'pending_approval' }),
      Hackathon.countDocuments({ isFeatured: true }),
      Transaction.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]),
      Transaction.find({ status: 'paid' })
        .populate('organizer', 'name email')
        .populate('hackathon', 'title')
        .sort({ createdAt: -1 }).limit(8),
    ]);

    const revenue = revenueAgg[0]?.total || 0;
    const revByType = {};
    revenueByType.forEach((r) => { revByType[r._id] = r.total; });

    // Monthly revenue earned this calendar month
    const monthRevAgg = await Transaction.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: monthAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    sendResponse(res, 200, true, 'Dashboard fetched', {
      users: {
        total: totalUsers,
        students, colleges, companies, admins,
        suspended,
        active: { today: activeToday, week: activeWeek, month: activeMonth },
      },
      hackathons: {
        total: totalHackathons,
        live: liveHackathons,
        pending: pendingHackathons,
        featured: featuredHackathons,
      },
      revenue: {
        total: revenue,
        thisMonth: monthRevAgg[0]?.total || 0,
        byType: revByType,
        recent: recentTx,
      },
      pendingOrganizers,
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════
//  EMAIL / BROADCAST SYSTEM
// ══════════════════════════════════════════

// ─────────────────────────────────────────
// @route   POST /api/admin/broadcast
// @access  Private (admin)
//   { audience: all|students|colleges|companies|organizers, subject, message }
// Delivered as in-app notifications; logged as a Broadcast record.
// ─────────────────────────────────────────
exports.broadcastEmail = async (req, res) => {
  try {
    const { audience = 'all', subject, message } = req.body;

    if (!subject || !message)
      return sendResponse(res, 400, false, 'Subject and message are required');

    const roleFilter = {
      all:        {},
      students:   { role: 'student' },
      colleges:   { role: 'college' },
      companies:  { role: 'company' },
      organizers: { role: { $in: ['college', 'company'] } },
    }[audience];

    if (!roleFilter)
      return sendResponse(res, 400, false, 'Invalid audience');

    // Never message admins
    const filter = { ...roleFilter, role: roleFilter.role ?? { $ne: 'admin' } };
    const recipients = await User.find(filter).select('_id');

    if (recipients.length) {
      const docs = recipients.map((u) => ({
        recipient: u._id,
        type: 'general',
        message: `📢 ${subject} — ${message}`,
      }));
      await Notification.insertMany(docs);
    }

    const broadcast = await Broadcast.create({
      sentBy: req.user.id,
      subject, message, audience,
      recipientCount: recipients.length,
    });

    // No SMTP configured here — log for the record.
    console.log(`[BROADCAST] admin → ${audience} (${recipients.length}): ${subject}`);

    sendResponse(res, 201, true,
      `Broadcast delivered to ${recipients.length} user(s)`, broadcast);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/admin/broadcasts
// @access  Private (admin)
// ─────────────────────────────────────────
exports.getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find()
      .populate('sentBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    sendResponse(res, 200, true, 'Broadcasts fetched', broadcasts);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};