import mongoose from "mongoose";

// ---------------- SUB SCHEMAS ----------------

// 🔥 Action Engine (execution level)
const actionEngineSchema = new mongoose.Schema(
  {
    step: String,
    title: { type: String, required: true },
    whatToDo: String,
    command: String,
    code: String,
    expectedResult: String,
    commonMistake: String,
  },
  { _id: false }
);

// 🔥 Q&A
const qaSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

// 🔥 Timestamps
const timestampSchema = new mongoose.Schema(
  {
    time: String,
    label: String,
  },
  { _id: false }
);

// 🔥 Execution Plan (7-day / step-based)
const executionPlanSchema = new mongoose.Schema(
  {
    day: String,
    task: String,
  },
  { _id: false }
);

// 🔥 Confusion Breakdown
const confusionSchema = new mongoose.Schema(
  {
    concept: String,
    simpleExplanation: String,
    realLifeExample: String,
  },
  { _id: false }
);

// ---------------- MAIN SCHEMA ----------------

const analysisSchema = new mongoose.Schema(
  {
    // ---------------- USER ----------------
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ---------------- INPUT ----------------
    youtubeUrl: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    inputHash: {
      type: String,
      required: true,
      index: true,
    },

    language: {
      type: String,
      enum: ["english", "hinglish"],
      required: true,
    },

    goal: {
      type: String,
      enum: ["student", "developer", "job_seeker"],
      required: true,
    },

    // 🔥 Content Type (VERY IMPORTANT)
    contentType: {
      type: String,
      enum: ["tech", "academic", "exam", "interview", "business", "general"],
      default: "general",
    },

    // ---------------- VIDEO META ----------------
    videoTitle: {
      type: String,
      default: "",
      trim: true,
    },

    thumbnail: {
      type: String,
      default: "",
    },

    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ---------------- AI OUTPUT ----------------

    summary: {
      type: String,
      default: "",
    },

    keyPoints: {
      type: [String],
      default: [],
      validate: (arr) => arr.length <= 50,
    },

    notes: {
      type: String,
      default: "",
    },

    actionSteps: {
      type: [String],
      default: [],
      validate: (arr) => arr.length <= 50,
    },

    actionEngine: {
      type: [actionEngineSchema],
      default: [],
    },

    roadmap: {
      type: [String],
      default: [],
      validate: (arr) => arr.length <= 30,
    },

    qa: {
      type: [qaSchema],
      default: [],
    },

    timestamps: {
      type: [timestampSchema],
      default: [],
    },

    learningPath: {
      type: [String],
      default: [],
    },

    // 🔥 Project Builder
    project: {
      title: { type: String, default: "" },
      features: { type: [String], default: [] },
      techStack: { type: [String], default: [] },
      folderStructure: { type: [String], default: [] },
      starterCode: { type: String, default: "" },
    },

    executionPlan: {
      type: [executionPlanSchema],
      default: [],
    },

    outcome: {
      type: String,
      default: "",
    },

    confusion: {
      type: [confusionSchema],
      default: [],
    },

    // ---------------- CREDIT ----------------

    creditsUsed: {
      type: Number,
      required: true,
      min: 1,
    },

    // ---------------- STATUS ----------------

    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },

    startedAt: Date,
    completedAt: Date,

    // ---------------- ERROR ----------------

    error: {
      type: String,
      default: null,
    },

    // ---------------- PERFORMANCE ----------------

    processingTime: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ---------------- INDEXES ----------------

// 🔥 Dashboard queries fast
analysisSchema.index({ user: 1, createdAt: -1 });

// 🔥 Deduplication (VERY IMPORTANT)
analysisSchema.index({ user: 1, inputHash: 1 });

// 🔥 Status filtering (queue / retry)
analysisSchema.index({ status: 1, createdAt: -1 });

// 🔥 Content-based filtering
analysisSchema.index({ contentType: 1 });

// ---------------- EXPORT ----------------

export default mongoose.models.Analysis ||
  mongoose.model("Analysis", analysisSchema);