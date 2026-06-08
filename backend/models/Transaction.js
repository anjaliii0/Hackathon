const mongoose = require("mongoose");

// Platform revenue ledger. Records are created by the system when an
// organizer's hackathon is approved (listing fee) or featured (promo fee).
const transactionSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
    },

    type: {
      type: String,
      enum: ["listing_fee", "feature_fee", "other"],
      default: "listing_fee",
    },

    amount: {
      type: Number,
      required: true,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["paid", "pending", "refunded"],
      default: "paid",
    },

    note: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
