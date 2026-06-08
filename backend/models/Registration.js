const mongoose = require("mongoose");

// An individual student registering interest in a hackathon.
// (Teams are formed separately, after registration is approved.)
const registrationSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["registered", "approved", "rejected", "shortlisted"],
      default: "registered",
    },

    // Snapshot of a few profile fields for fast organizer listing/search
    note: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// A student can register for a hackathon only once
registrationSchema.index({ hackathon: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
