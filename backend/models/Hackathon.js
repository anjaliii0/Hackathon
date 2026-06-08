const mongoose = require("mongoose");

const hackathonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    banner: {
      type: String,
    },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    organizerType: {
      type: String,
      enum: ["college", "company"],
      required: true,
    },

    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      default: "online",
    },

    location: {
      type: String,
    },

    // Physical/virtual venue details (shown for offline/hybrid)
    venue: {
      type: String,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "open",
        "ongoing",
        "judging",
        "completed",
      ],
      default: "draft",
    },

    registrationStart: {
      type: Date,
    },

    registrationEnd: {
      type: Date,
    },

    // Explicit registration deadline (defaults to registrationEnd if unset)
    registrationDeadline: {
      type: Date,
    },

    hackathonStart: {
      type: Date,
    },

    hackathonEnd: {
      type: Date,
    },

    teamSize: {
      min: {
        type: Number,
        default: 1,
      },

      max: {
        type: Number,
        default: 4,
      },
    },

    maxParticipants: {
      type: Number,
    },

    themes: [
      {
        type: String,
        trim: true,
      },
    ],

    // Total prize pool (display headline figure)
    prizePool: {
      type: Number,
      default: 0,
    },

    prizes: [
      {
        rank: {
          type: Number,
        },

        title: {
          type: String,
        },

        amount: {
          type: Number,
        },
      },
    ],

    // Problem statements participants can pick from
    problemStatements: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
        },
        difficulty: {
          type: String,
          enum: ["easy", "medium", "hard"],
          default: "medium",
        },
        tags: [{ type: String, trim: true }],

        // Resources scoped to this specific problem statement
        resources: [
          {
            type: {
              type: String,
              enum: ["pdf", "api", "dataset", "link", "video"],
              default: "link",
            },
            title: { type: String, required: true, trim: true },
            url: { type: String, required: true },
            description: { type: String },
          },
        ],
      },
    ],

    // Shared resources: PDFs, APIs, datasets, links, videos
    resources: [
      {
        type: {
          type: String,
          enum: ["pdf", "api", "dataset", "link", "video"],
          default: "link",
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
        url: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
      },
    ],

    // Final results, populated at winner-selection time
    winners: [
      {
        team: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
        },
        submission: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Submission",
        },
        position: {
          type: String,
          enum: ["winner", "runner_up", "second_runner_up", "special_award"],
        },
        awardTitle: {
          type: String,
        },
      },
    ],

    resultsPublished: {
      type: Boolean,
      default: false,
    },

    certificatesIssued: {
      type: Boolean,
      default: false,
    },

    // Highlighted on the public home page (admin-curated)
    isFeatured: {
      type: Boolean,
      default: false,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Hackathon = mongoose.model("Hackathon", hackathonSchema);

module.exports = Hackathon;