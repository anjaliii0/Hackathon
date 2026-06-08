const mongoose = require("mongoose");

// A platform-wide message sent by an admin. Delivered as in-app
// notifications to the targeted audience; kept here as an audit log.
const broadcastSchema = new mongoose.Schema(
  {
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
    },

    // Who received it
    audience: {
      type: String,
      enum: ["all", "students", "colleges", "companies", "organizers"],
      default: "all",
    },

    recipientCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Broadcast", broadcastSchema);
