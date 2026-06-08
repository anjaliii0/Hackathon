const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    collegeName: {
      type: String,
      required: true,
      trim: true,
    },

    logo: {
      type: String,
    },

    coverImage: {
      type: String,
    },

    location: {
      type: String,
    },

    website: {
      type: String,
    },

    description: {
      type: String,
    },

    establishedYear: {
      type: Number,
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    contactPhone: {
      type: String,
      trim: true,
    },

    socialLinks: {
      twitter: { type: String },
      linkedin: { type: String },
      instagram: { type: String },
      facebook: { type: String },
      github: { type: String },
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    hackathonsHosted: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hackathon",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const College = mongoose.model("College", collegeSchema);

module.exports = College;