const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    companyName: {
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

    industry: {
      type: String,
    },

    website: {
      type: String,
    },

    description: {
      type: String,
    },

    location: {
      type: String,
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

const Company = mongoose.model("Company", companySchema);

module.exports = Company;