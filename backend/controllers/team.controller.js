const Team = require('../models/Team');
const Registration = require('../models/Registration');
const Hackathon = require('../models/Hackathon');
const Student = require('../models/Student');
const sendResponse = require('../utils/apiResponse');
const crypto = require('crypto');

// helper → generate short unique invite code
const generateInviteCode = () => crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F9C1B2"

// ─────────────────────────────────────────
// @route   POST /api/teams/:hackathonId/create
// @access  Private (student)
// ─────────────────────────────────────────
exports.createTeam = async (req, res) => {
  try {
    const { name } = req.body;

    const hackathon = await Hackathon.findById(req.params.hackathonId);
    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    // Must be registered for this hackathon to create a team
    const registration = await Registration.findOne({
      student:   req.user.id,
      hackathon: req.params.hackathonId,
    });

    if (!registration)
      return sendResponse(res, 403, false, 'You must register for this hackathon before creating a team');

    if (registration.status === 'rejected')
      return sendResponse(res, 403, false, 'Your registration was not accepted for this hackathon');

    // Student can only be in one team per hackathon
    const existingTeam = await Team.findOne({
      hackathon: req.params.hackathonId,
      members:   req.user.id
    });

    if (existingTeam)
      return sendResponse(res, 400, false, 'You are already in a team for this hackathon');

    // Team name unique per hackathon
    const nameExists = await Team.findOne({
      hackathon: req.params.hackathonId,
      name:      name.trim()
    });

    if (nameExists)
      return sendResponse(res, 400, false, 'Team name already taken for this hackathon');

    const team = await Team.create({
      name:       name.trim(),
      hackathon:  req.params.hackathonId,
      leader:     req.user.id,
      members:    [req.user.id],           // leader is first member
      inviteCode: generateInviteCode(),
      isComplete: false
    });

    // Push team to student profile
    await Student.findOneAndUpdate(
      { user: req.user.id },
      { $push: { teamsJoined: team._id } }
    );

    sendResponse(res, 201, true, 'Team created', team);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/teams/:hackathonId/join
// @access  Private (student)
// ─────────────────────────────────────────
exports.joinTeam = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    const hackathon = await Hackathon.findById(req.params.hackathonId);
    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    // Must be registered for this hackathon to join a team
    const registration = await Registration.findOne({
      student:   req.user.id,
      hackathon: req.params.hackathonId,
    });

    if (!registration)
      return sendResponse(res, 403, false, 'You must register for this hackathon before joining a team');

    if (registration.status === 'rejected')
      return sendResponse(res, 403, false, 'Your registration was not accepted for this hackathon');

    // Already in a team?
    const existingTeam = await Team.findOne({
      hackathon: req.params.hackathonId,
      members:   req.user.id
    });

    if (existingTeam)
      return sendResponse(res, 400, false, 'You are already in a team for this hackathon');

    // Find team by invite code
    const team = await Team.findOne({
      hackathon:  req.params.hackathonId,
      inviteCode: inviteCode.toUpperCase()
    });

    if (!team)
      return sendResponse(res, 404, false, 'Invalid invite code');

    // Check team is not full
    if (team.isComplete)
      return sendResponse(res, 400, false, 'This team is already marked as complete');

    if (team.members.length >= hackathon.teamSize.max)
      return sendResponse(res, 400, false,
        `Team is full. Max size is ${hackathon.teamSize.max}`);

    // Add member
    team.members.push(req.user.id);
    await team.save();

    // Push team to student profile
    await Student.findOneAndUpdate(
      { user: req.user.id },
      { $push: { teamsJoined: team._id } }
    );

    sendResponse(res, 200, true, 'Joined team successfully', team);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/teams/:hackathonId/my
// @access  Private (student)
// ─────────────────────────────────────────
exports.getMyTeam = async (req, res) => {
  try {
    const team = await Team.findOne({
      hackathon: req.params.hackathonId,
      members:   req.user.id
    })
      .populate('members', 'name email')
      .populate('leader',  'name email')
      .populate('hackathon', 'title teamSize');

    if (!team)
      return sendResponse(res, 404, false, 'You are not in any team for this hackathon');

    sendResponse(res, 200, true, 'Team fetched', team);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/teams/:hackathonId/complete
// @access  Private (student) — leader only
// ─────────────────────────────────────────
exports.markTeamComplete = async (req, res) => {
  try {
    const team = await Team.findOne({
      hackathon: req.params.hackathonId,
      leader:    req.user.id             // only leader can mark complete
    });

    if (!team)
      return sendResponse(res, 403, false, 'Only team leader can mark team as complete');

    const hackathon = await Hackathon.findById(req.params.hackathonId);

    // Check minimum team size met
    if (team.members.length < hackathon.teamSize.min)
      return sendResponse(res, 400, false,
        `Need at least ${hackathon.teamSize.min} members to mark complete`);

    team.isComplete = true;
    await team.save();

    sendResponse(res, 200, true, 'Team marked as complete', team);
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/teams/:hackathonId/regenerate-code
// @access  Private (student) — leader only
// ─────────────────────────────────────────
exports.regenerateInviteCode = async (req, res) => {
  try {
    const team = await Team.findOne({
      hackathon: req.params.hackathonId,
      leader:    req.user.id
    });

    if (!team)
      return sendResponse(res, 403, false, 'Only team leader can regenerate invite code');

    if (team.isComplete)
      return sendResponse(res, 400, false, 'Cannot regenerate code for a complete team');

    team.inviteCode = generateInviteCode();
    await team.save();

    sendResponse(res, 200, true, 'Invite code regenerated', { inviteCode: team.inviteCode });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/teams/:hackathonId/leave
// @access  Private (student) — non-leader only
// ─────────────────────────────────────────
exports.leaveTeam = async (req, res) => {
  try {
    const team = await Team.findOne({
      hackathon: req.params.hackathonId,
      members:   req.user.id
    });

    if (!team)
      return sendResponse(res, 404, false, 'You are not in any team for this hackathon');

    // Leader cannot leave — must delete team instead
    if (team.leader.toString() === req.user.id)
      return sendResponse(res, 400, false, 'Team leader cannot leave. Delete the team instead');

    // Remove from members
    team.members = team.members.filter(m => m.toString() !== req.user.id);
    team.isComplete = false;   // re-open team if was complete
    await team.save();

    // Remove from student profile
    await Student.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { teamsJoined: team._id } }
    );

    sendResponse(res, 200, true, 'Left team successfully');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/teams/:hackathonId/delete
// @access  Private (student) — leader only
// ─────────────────────────────────────────
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findOne({
      hackathon: req.params.hackathonId,
      leader:    req.user.id
    });

    if (!team)
      return sendResponse(res, 403, false, 'Only the team leader can delete the team');

    // Remove team from all members' student profiles
    await Student.updateMany(
      { teamsJoined: team._id },
      { $pull: { teamsJoined: team._id } }
    );

    await team.deleteOne();

    sendResponse(res, 200, true, 'Team deleted successfully');
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/teams/:hackathonId/all
// @access  Private (college, company) — organizer only
// ─────────────────────────────────────────
exports.getAllTeams = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.hackathonId);

    if (!hackathon)
      return sendResponse(res, 404, false, 'Hackathon not found');

    if (hackathon.organizer.toString() !== req.user.id)
      return sendResponse(res, 403, false, 'Not authorized to view teams for this hackathon');

    const teams = await Team.find({ hackathon: req.params.hackathonId })
      .populate('members', 'name email')
      .populate('leader',  'name email');

    sendResponse(res, 200, true, 'Teams fetched', {
      total: teams.length,
      teams
    });
  } catch (err) {
    sendResponse(res, 500, false, err.message);
  }
};