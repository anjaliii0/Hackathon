const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },

    type: {
      type: String,
      enum: ["participation", "finalist", "winner"],
      default: "participation",
    },

    // e.g. "Winner", "1st Runner Up", "Best UI Award"
    awardTitle: {
      type: String,
    },

    // Public verification code shown on the certificate
    certificateId: {
      type: String,
      required: true,
      unique: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Certificate", certificateSchema);
