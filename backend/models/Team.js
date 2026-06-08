const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
    },

    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    inviteCode: {
      type: String,
      required: true,
      uppercase: true,
    },

    isComplete: {
      type: Boolean,
      default: false,
    },

    // Organizer can flag a team during participant management
    isShortlisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// A team name is unique within a single hackathon
teamSchema.index({ hackathon: 1, name: 1 }, { unique: true });

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
