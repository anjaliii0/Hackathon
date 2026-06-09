const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    avatar:   { type: String },
    bio:      { type: String },
    college:  { type: String, trim: true },
    year:     { type: String, trim: true },      // e.g. "2nd Year"
    branch:   { type: String, trim: true },      // e.g. "Computer Science"
    skills:   [{ type: String, trim: true }],
    resume:   { type: String },                  // Cloudinary URL
    github:   { type: String },
    linkedin: { type: String },
    portfolio:{ type: String },
    teamsJoined:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    hackathonsApplied: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
    bookmarks:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
