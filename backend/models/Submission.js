const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    projectUrl: {
      type: String,
    },

    // GitHub repository link
    githubUrl: {
      type: String,
    },

    demoUrl: {
      type: String,
    },

    // Video demo link (YouTube/Loom/etc.)
    videoUrl: {
      type: String,
    },

    presentation: {
      type: String,
    },

    // Direct PPT / slide-deck link
    pptUrl: {
      type: String,
    },

    // Which problem statement (index into hackathon.problemStatements) was tackled
    problemStatementIndex: {
      type: Number,
    },

    status: {
      type: String,
      enum: ["submitted", "under_review", "reviewed", "shortlisted"],
      default: "submitted",
    },

    score: {
      type: Number,
    },

    bonusPoints: {
      type: Number,
      default: 0,
    },

    rank: {
      type: Number,
    },

    feedback: {
      type: String,
    },

    // Structured judge comments
    judgeComments: {
      feedback: { type: String },
      suggestions: { type: String },
      improvementAreas: { type: String },
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    isLate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission;