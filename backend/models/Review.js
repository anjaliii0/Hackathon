const mongoose = require("mongoose");

// Platform / hackathon testimonials shown on the public home page.
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Snapshot so reviews still render if the user is later removed
    name: {
      type: String,
      required: true,
    },

    role: {
      type: String,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional: a review tied to a specific hackathon
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
    },

    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Review", reviewSchema);
