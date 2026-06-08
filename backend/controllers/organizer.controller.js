const Hackathon = require('../models/Hackathon');
const College = require('../models/College');
const Company = require('../models/Company');
const Student = require('../models/Student');
const User = require('../models/User');
const Team = require('../models/Team');
const Submission = require('../models/Submission');
const Registration = require('../models/Registration');
const Announcement = require('../models/Announcement');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const sendResponse = require('../utils/apiResponse');
const { uploadToCloudinary } = require('../config/cloudinary');
const crypto = require('crypto');

// ══════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════

// The profile model that matches the logged-in organizer's role
const profileModelFor = (role) => (role === 'college' ? College : Company);

// Fetch a hackathon and assert the logged-in organizer owns it.
// Returns the hackathon, or null after already sending an error response.
async function findOwnedHackathon(req, res) {
  const hackathon = await Hackathon.findById(req.params.hackathonId);
  if (!hackathon) {
    sendResponse(res, 404, false, 'Hackathon not found');
    return null;
  }
  if (hackathon.organizer.toString() !== req.user.id) {
    sendResponse(res, 403, false, 'You do not own this hackathon');
    return null;
  }
  return hackathon;
}

// Fire-and-forget notification creation for a list of recipient user ids
async function notifyMany(recipientIds, type, message, link) {
  if (!recipientIds.length) return;
  const docs = recipientIds.map((recipient) => ({ recipient, type, message, link }));
  await Notification.insertMany(docs);
}

// All distinct member user-ids participating (via teams) in a hackathon
async function teamMemberIds(hackathonId) {
  const teams = await Team.find({ hackathon: hackathonId }).select('members');
  const ids = new Set();
  teams.forEach((t) => t.members.forEach((m) => ids.add(m.toString())));
  return [...ids];
}

// Escape a value for safe embedding in an HTML cell
const htmlCell = (v) =>
  String(v == null ? '' : v).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// Build a real .xls file (HTML-table flavour) that Excel opens natively — no deps.
function buildXls(title, headers, rows) {
  const head = `<tr>${headers.map((h) => `<th style="background:#384959;color:#fff;padding:6px;border:1px solid #ccc">${htmlCell(h)}</th>`).join('')}</tr>`;
  const body = rows
    .map((r) => `<tr>${r.map((c) => `<td style="padding:6px;border:1px solid #ccc">${htmlCell(c)}</td>`).join('')}</tr>`)
    .join('');
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>${htmlCell(title)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
<body><table border="1">${head}${body}</table></body></html>`;
}

const sendXls = (res, filename, html) => {
  res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(html);
};

// ══════════════════════════════════════════════════════════
//  ORGANIZATION PROFILE  (role-aware: college | company)
// ══════════════════════════════════════════════════════════

// GET /api/organizer/profile
exports.getProfile = async (req, res) => {
  try {
    const Profile = profileModelFor(req.user.role);
    const profile = await Profile.findOne({ user: req.user.id })
      .populate('user', 'name email role')
      .populate('hackathonsHosted', 'title status registrationEnd');

    if (!profile) return sendResponse(res, 404, false, 'Organizer profile not found');
    sendResponse(res, 200, true, 'Profile fetched', profile);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// PUT /api/organizer/profile
exports.updateProfile = async (req, res) => {
  try {
    const Profile = profileModelFor(req.user.role);

    // Whitelist fields per role so a college can't write company-only keys, etc.
    const common = ['logo', 'website', 'description', 'location', 'contactEmail', 'contactPhone', 'socialLinks'];
    const collegeOnly = ['collegeName', 'establishedYear'];
    const companyOnly = ['companyName', 'industry'];
    const allowed = [...common, ...(req.user.role === 'college' ? collegeOnly : companyOnly)];

    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      update,
      { new: true, runValidators: true }
    ).populate('user', 'name email role');

    if (!profile) return sendResponse(res, 404, false, 'Organizer profile not found');
    sendResponse(res, 200, true, 'Profile updated', profile);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// PUT /api/organizer/logo  (multipart: "image")
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) return sendResponse(res, 400, false, 'No image file provided');
    const Profile = profileModelFor(req.user.role);
    const url = await uploadToCloudinary(req.file.buffer, 'hackathon/org-logos');
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id }, { logo: url }, { new: true }
    );
    sendResponse(res, 200, true, 'Logo uploaded', { logo: profile.logo });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// PUT /api/organizer/cover  (multipart: "image")
exports.uploadCover = async (req, res) => {
  try {
    if (!req.file) return sendResponse(res, 400, false, 'No image file provided');
    const Profile = profileModelFor(req.user.role);
    const url = await uploadToCloudinary(req.file.buffer, 'hackathon/org-covers');
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id }, { coverImage: url }, { new: true }
    );
    sendResponse(res, 200, true, 'Cover image uploaded', { coverImage: profile.coverImage });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════════════════════
//  DASHBOARD / ANALYTICS
// ══════════════════════════════════════════════════════════

// GET /api/organizer/overview  — aggregate across all my hackathons
exports.getOverview = async (req, res) => {
  try {
    const hackathons = await Hackathon.find({ organizer: req.user.id }).select('_id status title createdAt');
    const ids = hackathons.map((h) => h._id);

    const [registrations, teams, submissions] = await Promise.all([
      Registration.countDocuments({ hackathon: { $in: ids } }),
      Team.countDocuments({ hackathon: { $in: ids } }),
      Submission.countDocuments({ hackathon: { $in: ids } }),
    ]);

    const byStatus = hackathons.reduce((acc, h) => {
      acc[h.status] = (acc[h.status] || 0) + 1;
      return acc;
    }, {});

    sendResponse(res, 200, true, 'Overview fetched', {
      totals: {
        hackathons: hackathons.length,
        registrations,
        teams,
        submissions,
      },
      byStatus,
      recent: hackathons
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// GET /api/organizer/:hackathonId/analytics
exports.getHackathonAnalytics = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const [totalRegistrations, approved, shortlisted, totalTeams, completeTeams, totalSubmissions, lateSubmissions, reviewed] =
      await Promise.all([
        Registration.countDocuments({ hackathon: hackathon._id }),
        Registration.countDocuments({ hackathon: hackathon._id, status: 'approved' }),
        Registration.countDocuments({ hackathon: hackathon._id, status: 'shortlisted' }),
        Team.countDocuments({ hackathon: hackathon._id }),
        Team.countDocuments({ hackathon: hackathon._id, isComplete: true }),
        Submission.countDocuments({ hackathon: hackathon._id }),
        Submission.countDocuments({ hackathon: hackathon._id, isLate: true }),
        Submission.countDocuments({ hackathon: hackathon._id, status: { $in: ['reviewed', 'shortlisted'] } }),
      ]);

    sendResponse(res, 200, true, 'Analytics fetched', {
      hackathon: { id: hackathon._id, title: hackathon.title, status: hackathon.status },
      registrations: { total: totalRegistrations, approved, shortlisted },
      teams: { total: totalTeams, complete: completeTeams },
      submissions: { total: totalSubmissions, late: lateSubmissions, reviewed },
      certificatesIssued: hackathon.certificatesIssued,
      resultsPublished: hackathon.resultsPublished,
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════════════════════
//  PROBLEM STATEMENTS  (embedded subdocs)
// ══════════════════════════════════════════════════════════

// POST /api/organizer/:hackathonId/problem-statements
exports.addProblemStatement = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const { title, description, difficulty, tags } = req.body;
    if (!title) return sendResponse(res, 400, false, 'Title is required');

    hackathon.problemStatements.push({ title, description, difficulty, tags });
    await hackathon.save();
    sendResponse(res, 201, true, 'Problem statement added', hackathon.problemStatements);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// PUT /api/organizer/:hackathonId/problem-statements/:psId
exports.updateProblemStatement = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const ps = hackathon.problemStatements.id(req.params.psId);
    if (!ps) return sendResponse(res, 404, false, 'Problem statement not found');

    ['title', 'description', 'difficulty', 'tags'].forEach((k) => {
      if (req.body[k] !== undefined) ps[k] = req.body[k];
    });
    await hackathon.save();
    sendResponse(res, 200, true, 'Problem statement updated', hackathon.problemStatements);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// DELETE /api/organizer/:hackathonId/problem-statements/:psId
exports.deleteProblemStatement = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    hackathon.problemStatements.pull(req.params.psId);
    await hackathon.save();
    sendResponse(res, 200, true, 'Problem statement deleted', hackathon.problemStatements);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// POST /api/organizer/:hackathonId/problem-statements/:psId/resources
exports.addProblemResource = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const ps = hackathon.problemStatements.id(req.params.psId);
    if (!ps) return sendResponse(res, 404, false, 'Problem statement not found');

    const { type, title, url, description } = req.body;
    if (!title || !url) return sendResponse(res, 400, false, 'Title and URL are required');

    ps.resources.push({ type, title, url, description });
    await hackathon.save();
    sendResponse(res, 201, true, 'Resource added to problem statement', ps.resources);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// DELETE /api/organizer/:hackathonId/problem-statements/:psId/resources/:resId
exports.deleteProblemResource = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const ps = hackathon.problemStatements.id(req.params.psId);
    if (!ps) return sendResponse(res, 404, false, 'Problem statement not found');

    ps.resources.pull(req.params.resId);
    await hackathon.save();
    sendResponse(res, 200, true, 'Resource removed', ps.resources);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════════════════════
//  RESOURCES  (embedded subdocs)
// ══════════════════════════════════════════════════════════

// POST /api/organizer/:hackathonId/resources
exports.addResource = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const { type, title, url, description } = req.body;
    if (!title || !url) return sendResponse(res, 400, false, 'Title and URL are required');

    hackathon.resources.push({ type, title, url, description });
    await hackathon.save();
    sendResponse(res, 201, true, 'Resource added', hackathon.resources);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// DELETE /api/organizer/:hackathonId/resources/:resId
exports.deleteResource = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    hackathon.resources.pull(req.params.resId);
    await hackathon.save();
    sendResponse(res, 200, true, 'Resource deleted', hackathon.resources);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════════════════════
//  PARTICIPANT MANAGEMENT  (registrations)
// ══════════════════════════════════════════════════════════

// GET /api/organizer/:hackathonId/participants   ?status=&search=
exports.getParticipants = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const { status, search } = req.query;
    const filter = { hackathon: hackathon._id };
    if (status) filter.status = status;

    let regs = await Registration.find(filter)
      .populate('student', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Attach the student profile (college/skills/resume) for each registrant
    const studentIds = regs.map((r) => r.student?._id).filter(Boolean);
    const profiles = await Student.find({ user: { $in: studentIds } })
      .select('user college branch year skills resume avatar github linkedin')
      .lean();
    const profileMap = {};
    profiles.forEach((p) => { profileMap[p.user.toString()] = p; });

    regs = regs.map((r) => ({
      ...r,
      profile: r.student ? profileMap[r.student._id.toString()] || null : null,
    }));

    // Free-text search across name / email / college / skills
    if (search) {
      const q = search.toLowerCase();
      regs = regs.filter((r) => {
        const hay = [
          r.student?.name,
          r.student?.email,
          r.profile?.college,
          r.profile?.branch,
          ...(r.profile?.skills || []),
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }

    sendResponse(res, 200, true, 'Participants fetched', { total: regs.length, participants: regs });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// PUT /api/organizer/:hackathonId/participants/:regId/status   { status }
exports.updateRegistrationStatus = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const { status } = req.body;
    if (!['registered', 'approved', 'rejected', 'shortlisted'].includes(status))
      return sendResponse(res, 400, false, 'Invalid status');

    const reg = await Registration.findOne({ _id: req.params.regId, hackathon: hackathon._id });
    if (!reg) return sendResponse(res, 404, false, 'Registration not found');

    reg.status = status;
    await reg.save();

    if (status === 'approved') {
      await notifyMany([reg.student], 'application_update',
        `Your registration for "${hackathon.title}" was approved.`, `/hackathons/${hackathon._id}`);
    }

    sendResponse(res, 200, true, `Participant marked as ${status}`, reg);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// GET /api/organizer/:hackathonId/participants/export  → CSV download
exports.exportParticipants = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const regs = await Registration.find({ hackathon: hackathon._id })
      .populate('student', 'name email')
      .lean();
    const studentIds = regs.map((r) => r.student?._id).filter(Boolean);
    const profiles = await Student.find({ user: { $in: studentIds } })
      .select('user college branch year skills resume github linkedin').lean();
    const pmap = {};
    profiles.forEach((p) => { pmap[p.user.toString()] = p; });

    const esc = (v) => {
      const s = (v == null ? '' : String(v)).replace(/"/g, '""');
      return `"${s}"`;
    };
    const header = ['Name', 'Email', 'Status', 'College', 'Branch', 'Year', 'Skills', 'GitHub', 'LinkedIn', 'Resume', 'Registered On'];
    const rows = regs.map((r) => {
      const p = r.student ? pmap[r.student._id.toString()] || {} : {};
      return [
        r.student?.name, r.student?.email, r.status,
        p.college, p.branch, p.year,
        (p.skills || []).join('; '),
        p.github, p.linkedin, p.resume,
        new Date(r.createdAt).toISOString().slice(0, 10),
      ].map(esc).join(',');
    });
    const csv = [header.map(esc).join(','), ...rows].join('\n');

    const safeTitle = hackathon.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="participants_${safeTitle}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// GET /api/organizer/:hackathonId/participants/export/excel  → .xls download
exports.exportParticipantsExcel = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const regs = await Registration.find({ hackathon: hackathon._id })
      .populate('student', 'name email').lean();
    const studentIds = regs.map((r) => r.student?._id).filter(Boolean);
    const profiles = await Student.find({ user: { $in: studentIds } })
      .select('user college branch year skills resume github linkedin').lean();
    const pmap = {};
    profiles.forEach((p) => { pmap[p.user.toString()] = p; });

    const headers = ['Name', 'Email', 'Status', 'College', 'Branch', 'Year', 'Skills', 'GitHub', 'LinkedIn', 'Resume', 'Registered On'];
    const rows = regs.map((r) => {
      const p = r.student ? pmap[r.student._id.toString()] || {} : {};
      return [
        r.student?.name, r.student?.email, r.status,
        p.college, p.branch, p.year, (p.skills || []).join(', '),
        p.github, p.linkedin, p.resume,
        new Date(r.createdAt).toISOString().slice(0, 10),
      ];
    });

    const safeTitle = hackathon.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    sendXls(res, `participants_${safeTitle}.xls`, buildXls('Participants', headers, rows));
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════════════════════
//  TEAMS  (organizer view + shortlist)
// ══════════════════════════════════════════════════════════

// PUT /api/organizer/:hackathonId/teams/:teamId/shortlist  { shortlisted }
exports.shortlistTeam = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const team = await Team.findOne({ _id: req.params.teamId, hackathon: hackathon._id });
    if (!team) return sendResponse(res, 404, false, 'Team not found');

    team.isShortlisted = req.body.shortlisted !== false;
    await team.save();

    if (team.isShortlisted) {
      await notifyMany(team.members, 'general',
        `Your team "${team.name}" has been shortlisted in "${hackathon.title}"!`,
        `/hackathons/${hackathon._id}`);
    }

    sendResponse(res, 200, true,
      team.isShortlisted ? 'Team shortlisted' : 'Team removed from shortlist', team);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════════════════════
//  SUBMISSION REVIEW + JUDGE COMMENTS
// ══════════════════════════════════════════════════════════

// PUT /api/organizer/:hackathonId/submissions/:submissionId/review
//    { score, bonusPoints, rank, status, judgeComments:{feedback,suggestions,improvementAreas} }
exports.reviewSubmission = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const submission = await Submission.findOne({
      _id: req.params.submissionId,
      hackathon: hackathon._id,
    });
    if (!submission) return sendResponse(res, 404, false, 'Submission not found');

    const { score, bonusPoints, rank, status, judgeComments, feedback } = req.body;

    if (score !== undefined) {
      if (score < 0 || score > 100) return sendResponse(res, 400, false, 'Score must be 0–100');
      submission.score = score;
    }
    if (bonusPoints !== undefined) submission.bonusPoints = bonusPoints;
    if (rank !== undefined) submission.rank = rank;
    if (status !== undefined) submission.status = status;
    if (feedback !== undefined) submission.feedback = feedback;
    if (judgeComments) {
      submission.judgeComments = {
        feedback: judgeComments.feedback ?? submission.judgeComments?.feedback,
        suggestions: judgeComments.suggestions ?? submission.judgeComments?.suggestions,
        improvementAreas: judgeComments.improvementAreas ?? submission.judgeComments?.improvementAreas,
      };
    }
    if (status === undefined && (score !== undefined || judgeComments)) {
      submission.status = 'reviewed';
    }

    await submission.save();

    // Notify the team their submission was reviewed
    const team = await Team.findById(submission.team).select('members name');
    if (team) {
      await notifyMany(team.members, 'submission_result',
        `Your submission "${submission.title}" has been reviewed.`,
        `/submissions`);
    }

    sendResponse(res, 200, true, 'Submission reviewed', submission);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// GET /api/organizer/:hackathonId/submissions/export  → submission report (.xls)
exports.exportSubmissions = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const subs = await Submission.find({ hackathon: hackathon._id })
      .populate({ path: 'team', select: 'name members', populate: { path: 'members', select: 'name' } })
      .sort({ submittedAt: 1 })
      .lean();

    const headers = [
      'Team', 'Members', 'Project', 'Status', 'Submitted At', 'Late',
      'GitHub', 'PPT/Slides', 'Video Demo', 'Live Demo',
      'Score', 'Bonus', 'Total', 'Feedback', 'Suggestions', 'Improvement Areas',
    ];
    const rows = subs.map((sub) => [
      sub.team?.name,
      (sub.team?.members || []).map((m) => m.name).join(', '),
      sub.title,
      (sub.status || 'submitted').replace(/_/g, ' '),
      sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN') : '',
      sub.isLate ? 'Yes' : 'No',
      sub.githubUrl, sub.pptUrl || sub.presentation, sub.videoUrl, sub.demoUrl,
      sub.score ?? 0, sub.bonusPoints ?? 0, (sub.score ?? 0) + (sub.bonusPoints ?? 0),
      sub.judgeComments?.feedback || sub.feedback,
      sub.judgeComments?.suggestions,
      sub.judgeComments?.improvementAreas,
    ]);

    const safeTitle = hackathon.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    sendXls(res, `submissions_${safeTitle}.xls`, buildXls('Submissions', headers, rows));
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// POST /api/organizer/:hackathonId/submissions/remind   { message? }
// Notifies members of teams that have NOT yet submitted.
exports.remindSubmissions = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const teams = await Team.find({ hackathon: hackathon._id }).select('members');
    const submitted = await Submission.find({ hackathon: hackathon._id }).select('team');
    const submittedTeamIds = new Set(submitted.map((s) => s.team.toString()));

    const pending = teams.filter((t) => !submittedTeamIds.has(t._id.toString()));
    const recipients = [...new Set(pending.flatMap((t) => t.members.map((m) => m.toString())))];

    const msg = req.body.message?.trim()
      || `Reminder: submissions for "${hackathon.title}" are still open. Please submit your project soon!`;

    await notifyMany(recipients, 'submission_reminder', `⏰ ${msg}`, `/submissions`);

    sendResponse(res, 200, true,
      `Reminder sent to ${recipients.length} participant(s) across ${pending.length} team(s) without a submission`,
      { reminded: recipients.length, pendingTeams: pending.length });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════════════════════
//  LEADERBOARD  +  WINNER SELECTION
// ══════════════════════════════════════════════════════════

// GET /api/organizer/:hackathonId/leaderboard  — auto-ranked
exports.getLeaderboard = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const submissions = await Submission.find({ hackathon: hackathon._id })
      .populate({ path: 'team', select: 'name members', populate: { path: 'members', select: 'name email' } })
      .lean();

    // Effective score = score + bonus; tie-break by earliest submission
    const ranked = submissions
      .map((s) => ({ ...s, effectiveScore: (s.score || 0) + (s.bonusPoints || 0) }))
      .sort((a, b) => {
        if (b.effectiveScore !== a.effectiveScore) return b.effectiveScore - a.effectiveScore;
        return new Date(a.submittedAt) - new Date(b.submittedAt);
      })
      .map((s, i) => ({ ...s, computedRank: i + 1 }));

    sendResponse(res, 200, true, 'Leaderboard computed', {
      total: ranked.length,
      leaderboard: ranked,
      winners: hackathon.winners,
      resultsPublished: hackathon.resultsPublished,
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// PUT /api/organizer/:hackathonId/winners   { winners:[{team,submission,position,awardTitle}] }
exports.publishWinners = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const { winners } = req.body;
    if (!Array.isArray(winners) || winners.length === 0)
      return sendResponse(res, 400, false, 'Provide at least one winner');

    hackathon.winners = winners;
    hackathon.resultsPublished = true;
    await hackathon.save();

    // Notify each winning team
    for (const w of winners) {
      if (!w.team) continue;
      const team = await Team.findById(w.team).select('members name');
      if (team) {
        const label = w.awardTitle || (w.position || '').replace(/_/g, ' ');
        await notifyMany(team.members, 'submission_result',
          `🎉 Your team "${team.name}" won ${label} in "${hackathon.title}"!`,
          `/leaderboard`);
      }
    }

    sendResponse(res, 200, true, 'Results published', hackathon.winners);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════════════════════
//  ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════

// POST /api/organizer/:hackathonId/announcements  { title, message, category, pinned }
exports.createAnnouncement = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const { title, message, category, pinned } = req.body;
    if (!title || !message) return sendResponse(res, 400, false, 'Title and message are required');

    const announcement = await Announcement.create({
      hackathon: hackathon._id,
      organizer: req.user.id,
      title, message, category, pinned,
    });

    // Push to all registered participants as a notification
    const regs = await Registration.find({ hackathon: hackathon._id }).select('student');
    await notifyMany(regs.map((r) => r.student), 'general',
      `📢 ${hackathon.title}: ${title}`, `/hackathons/${hackathon._id}`);

    sendResponse(res, 201, true, 'Announcement posted', announcement);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// GET /api/organizer/:hackathonId/announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const announcements = await Announcement.find({ hackathon: hackathon._id })
      .sort({ pinned: -1, createdAt: -1 });
    sendResponse(res, 200, true, 'Announcements fetched', announcements);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// DELETE /api/organizer/:hackathonId/announcements/:annId
exports.deleteAnnouncement = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const ann = await Announcement.findOneAndDelete({
      _id: req.params.annId, hackathon: hackathon._id,
    });
    if (!ann) return sendResponse(res, 404, false, 'Announcement not found');
    sendResponse(res, 200, true, 'Announcement deleted');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════════════════════
//  EMAIL / CONTACT PARTICIPANTS  (delivered as in-app notifications)
// ══════════════════════════════════════════════════════════

// POST /api/organizer/:hackathonId/email
//   { target:'single'|'team'|'all', recipientId?, teamId?, subject, message }
exports.emailParticipants = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const { target, recipientId, teamId, subject, message } = req.body;
    if (!subject || !message) return sendResponse(res, 400, false, 'Subject and message are required');

    let recipients = [];
    if (target === 'single') {
      if (!recipientId) return sendResponse(res, 400, false, 'recipientId required');
      recipients = [recipientId];
    } else if (target === 'team') {
      const team = await Team.findOne({ _id: teamId, hackathon: hackathon._id }).select('members');
      if (!team) return sendResponse(res, 404, false, 'Team not found');
      recipients = team.members.map((m) => m.toString());
    } else {
      // everyone registered
      const regs = await Registration.find({ hackathon: hackathon._id }).select('student');
      recipients = regs.map((r) => r.student.toString());
    }

    const fullMessage = `✉️ ${subject} — ${message}`;
    await notifyMany(recipients, 'general', fullMessage, `/hackathons/${hackathon._id}`);

    // No SMTP configured in this environment — log for the dev/organizer record.
    console.log(`[EMAIL] "${hackathon.title}" → ${recipients.length} recipient(s): ${subject}`);

    sendResponse(res, 200, true, `Message delivered to ${recipients.length} participant(s)`, {
      delivered: recipients.length,
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ══════════════════════════════════════════════════════════
//  CERTIFICATES
// ══════════════════════════════════════════════════════════

const makeCertId = () => `HP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

// POST /api/organizer/:hackathonId/certificates/generate
//   Generates participation certs for all team members, plus winner/finalist
//   certs derived from the published winners list.
exports.generateCertificates = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    let created = 0;

    // 1) Participation — every distinct team member
    const memberIds = await teamMemberIds(hackathon._id);
    for (const uid of memberIds) {
      const exists = await Certificate.findOne({
        hackathon: hackathon._id, recipient: uid, type: 'participation',
      });
      if (!exists) {
        await Certificate.create({
          hackathon: hackathon._id, recipient: uid,
          type: 'participation', certificateId: makeCertId(),
        });
        created++;
      }
    }

    // 2) Winner / finalist — from published winners
    for (const w of hackathon.winners || []) {
      if (!w.team) continue;
      const team = await Team.findById(w.team).select('members');
      if (!team) continue;
      const type = w.position === 'winner' ? 'winner' : 'finalist';
      const awardTitle = w.awardTitle || (w.position || '').replace(/_/g, ' ');
      for (const uid of team.members) {
        const exists = await Certificate.findOne({
          hackathon: hackathon._id, recipient: uid, type,
        });
        if (!exists) {
          await Certificate.create({
            hackathon: hackathon._id, recipient: uid, team: w.team,
            type, awardTitle, certificateId: makeCertId(),
          });
          created++;
        }
      }
    }

    hackathon.certificatesIssued = true;
    await hackathon.save();

    // Let participants know certificates are ready
    await notifyMany(memberIds, 'general',
      `Certificates for "${hackathon.title}" are now available.`, `/certificates`);

    sendResponse(res, 200, true, `Generated ${created} certificate(s)`, { created });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// GET /api/organizer/:hackathonId/certificates
exports.getCertificates = async (req, res) => {
  try {
    const hackathon = await findOwnedHackathon(req, res);
    if (!hackathon) return;

    const certs = await Certificate.find({ hackathon: hackathon._id })
      .populate('recipient', 'name email')
      .populate('team', 'name')
      .sort({ type: 1, createdAt: -1 });

    sendResponse(res, 200, true, 'Certificates fetched', { total: certs.length, certificates: certs });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};
