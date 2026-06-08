const Hackathon = require('../models/Hackathon');
const Registration = require('../models/Registration');
const Review = require('../models/Review');
const User = require('../models/User');
const sendResponse = require('../utils/apiResponse');

// Fields needed to render a hackathon card on the public site
const CARD_FIELDS = 'title banner mode themes prizePool registrationEnd registrationDeadline hackathonStart status location venue organizer';

// ─────────────────────────────────────────
// @route   GET /api/home
// @access  Public
// Returns everything the landing page needs in one call.
// ─────────────────────────────────────────
exports.getHomeData = async (req, res) => {
  try {
    const now = new Date();
    const base = { isApproved: true };

    // ── Featured (admin-curated; fall back to biggest prize pools) ──
    let featured = await Hackathon.find({ ...base, isFeatured: true })
      .populate('organizer', 'name')
      .select(CARD_FIELDS)
      .sort({ createdAt: -1 })
      .limit(6);

    if (featured.length === 0) {
      featured = await Hackathon.find(base)
        .populate('organizer', 'name')
        .select(CARD_FIELDS)
        .sort({ prizePool: -1, createdAt: -1 })
        .limit(6);
    }

    // ── Upcoming (events that haven't started yet) ──
    let upcoming = await Hackathon.find({ ...base, hackathonStart: { $gt: now } })
      .populate('organizer', 'name')
      .select(CARD_FIELDS)
      .sort({ hackathonStart: 1 })
      .limit(6);

    if (upcoming.length === 0) {
      // fall back to anything still open for registration / recently created
      upcoming = await Hackathon.find(base)
        .populate('organizer', 'name')
        .select(CARD_FIELDS)
        .sort({ createdAt: -1 })
        .limit(6);
    }

    // ── Trending (most registrations) ──
    const agg = await Registration.aggregate([
      { $group: { _id: '$hackathon', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);
    const trendingIds = agg.map((a) => a._id);
    const countMap = {};
    agg.forEach((a) => { countMap[a._id.toString()] = a.count; });

    let trending = [];
    if (trendingIds.length) {
      const docs = await Hackathon.find({ _id: { $in: trendingIds }, ...base })
        .populate('organizer', 'name')
        .select(CARD_FIELDS);
      trending = docs
        .map((h) => ({ ...h.toObject(), registrationCount: countMap[h._id.toString()] || 0 }))
        .sort((a, b) => b.registrationCount - a.registrationCount);
    }
    if (trending.length === 0) {
      const docs = await Hackathon.find(base)
        .populate('organizer', 'name')
        .select(CARD_FIELDS)
        .sort({ createdAt: -1 })
        .limit(6);
      trending = docs.map((h) => ({ ...h.toObject(), registrationCount: 0 }));
    }

    // ── Platform stats for the hero ──
    const [totalHackathons, totalStudents, totalColleges, totalCompanies, prizeAgg] = await Promise.all([
      Hackathon.countDocuments(base),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'college' }),
      User.countDocuments({ role: 'company' }),
      Hackathon.aggregate([{ $match: base }, { $group: { _id: null, total: { $sum: '$prizePool' } } }]),
    ]);

    // ── Recent reviews ──
    const reviews = await Review.find({ isApproved: true })
      .sort({ createdAt: -1 })
      .limit(8);

    sendResponse(res, 200, true, 'Home data fetched', {
      featured,
      trending,
      upcoming,
      reviews,
      stats: {
        hackathons: totalHackathons,
        students: totalStudents,
        organizers: totalColleges + totalCompanies,
        prizePool: prizeAgg[0]?.total || 0,
      },
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/reviews
// @access  Public
// ─────────────────────────────────────────
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isApproved: true })
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 20);
    sendResponse(res, 200, true, 'Reviews fetched', reviews);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/reviews
// @access  Private (any logged-in user)
// ─────────────────────────────────────────
exports.createReview = async (req, res) => {
  try {
    const { rating, comment, hackathon } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return sendResponse(res, 400, false, 'Rating must be between 1 and 5');
    if (!comment || !comment.trim())
      return sendResponse(res, 400, false, 'Comment is required');

    const review = await Review.create({
      user: req.user.id,
      name: req.user.name,
      role: req.user.role,
      rating,
      comment: comment.trim(),
      hackathon: hackathon || undefined,
    });

    sendResponse(res, 201, true, 'Thanks for your review!', review);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};
