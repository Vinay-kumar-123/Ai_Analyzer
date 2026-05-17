import mongoose from "mongoose";

// ======================================================
// SUB-SCHEMAS
// Note: _id: false on all sub-schemas — no orphan IDs,
// no accidental ObjectId cast errors on plain objects.
// ======================================================

// ── Q & A ──────────────────────────────────────────────

const qaSchema = new mongoose.Schema(
  {
    question: {
      type:     String,
      required: true,
      trim:     true,
      default:  "Question",
    },
    answer: {
      type:     String,
      required: true,
      trim:     true,
      default:  "Answer",
    },
  },
  { _id: false }
);

// ── Timestamp Marker ───────────────────────────────────

const timestampSchema = new mongoose.Schema(
  {
    time:  { type: String, default: "", trim: true },
    label: { type: String, default: "", trim: true },
  },
  { _id: false }
);

// ── Execution Plan ─────────────────────────────────────
// IMPORTANT: Both fields are plain Strings.
// AI sometimes returns numbers for "day" — cast silently via type: String.

const executionPlanSchema = new mongoose.Schema(
  {
    day:  { type: String, default: "", trim: true },
    task: { type: String, default: "", trim: true },
  },
  { _id: false }
);

// ── Confusion Breakdown ────────────────────────────────

const confusionSchema = new mongoose.Schema(
  {
    concept:           { type: String, default: "", trim: true },
    simpleExplanation: { type: String, default: "" },
    realLifeExample:   { type: String, default: "" },
  },
  { _id: false }
);

// ── Action Engine Step ─────────────────────────────────

const actionEngineSchema = new mongoose.Schema(
  {
    step:           { type: String, default: "", trim: true },
    title:          { type: String, required: true, trim: true, default: "Step" },
    whatToDo:       { type: String, default: "" },
    command:        { type: String, default: "" },
    code:           { type: String, default: "" },
    expectedResult: { type: String, default: "" },
    commonMistake:  { type: String, default: "" },
  },
  { _id: false }
);

// ── Project Builder ────────────────────────────────────

const projectSchema = new mongoose.Schema(
  {
    title:           { type: String, default: "", trim: true },
    features:        { type: [String], default: [] },
    techStack:       { type: [String], default: [] },
    folderStructure: { type: [String], default: [] },
    starterCode:     { type: String, default: "" },
  },
  { _id: false }
);

// ======================================================
// ARRAY VALIDATOR FACTORY
// Reusable — avoids repeating validate objects inline.
// ======================================================

const maxArrayLen = (max, label) => ({
  validator: (arr) => arr.length <= max,
  message:   `${label} exceeds maximum of ${max} items`,
});

// ======================================================
// MAIN ANALYSIS SCHEMA
// ======================================================

const analysisSchema = new mongoose.Schema(
  {
    // ── Ownership ──────────────────────────────────────
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },

    // ── Input ──────────────────────────────────────────
    youtubeUrl: {
      type:     String,
      required: true,
      trim:     true,
    },

    inputHash: {
      type:     String,
      required: true,
    },

    language: {
      type:     String,
      enum:     ["english", "hinglish", "hindi", "tamil", "bengali"],
      required: true,
    },

    goal: {
      type:     String,
      enum:     ["student", "developer", "job_seeker"],
      required: true,
    },

    // ── Content Classification ─────────────────────────
    contentType: {
      type:    String,
      enum:    ["tech", "academic", "exam", "interview", "business", "general"],
      default: "general",
    },

    // ── Video Metadata ─────────────────────────────────
    videoTitle: {
      type:    String,
      default: "",
      trim:    true,
    },

    thumbnail: {
      type:    String,
      default: "",
      trim:    true,
    },

    duration: {
      type:    Number,
      default: 0,
      min:     0,
    },

    transcriptLength: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── AI Output: Scalar ──────────────────────────────
    summary: {
      type:    String,
      default: "",
    },

    notes: {
      type:    String,
      default: "",
    },

    outcome: {
      type:    String,
      default: "",
    },

    // ── AI Output: String Arrays ───────────────────────
    keyPoints: {
      type:     [String],
      default:  [],
      validate: maxArrayLen(100, "keyPoints"),
    },

    actionSteps: {
      type:     [String],
      default:  [],
      validate: maxArrayLen(100, "actionSteps"),
    },

    roadmap: {
      type:     [String],
      default:  [],
      validate: maxArrayLen(50, "roadmap"),
    },

    learningPath: {
      type:    [String],
      default: [],
    },

    // ── AI Output: Object Arrays ───────────────────────
    qa: {
      type:    [qaSchema],
      default: [],
    },

    timestamps: {
      type:    [timestampSchema],
      default: [],
    },

    executionPlan: {
      type:    [executionPlanSchema],
      default: [],
    },

    confusion: {
      type:    [confusionSchema],
      default: [],
    },

    actionEngine: {
      type:    [actionEngineSchema],
      default: [],
    },

    // ── Project Builder ────────────────────────────────
    project: {
      type:    projectSchema,
      default: () => ({}),
    },

    // ── Raw AI Output ──────────────────────────────────
    // Capped at 50K chars in the worker before save.
    // Consider moving to a separate collection at scale.
    rawAI: {
      type:    String,
      default: "",
    },

    // ── Credit System ──────────────────────────────────
    creditsUsed: {
      type:     Number,
      required: true,
      min:      1,
    },

    creditsDeducted: {
      type:    Boolean,
      default: false,
    },

    // ── Status ─────────────────────────────────────────
    status: {
      type:    String,
      enum:    ["queued", "processing", "completed", "failed"],
      default: "queued",
    },

    progress: {
      type:    Number,
      default: 0,
      min:     0,
      max:     100,
    },

    error: {
      type:    String,
      default: "",
    },

    // ── Timing ─────────────────────────────────────────
    startedAt: {
      type:    Date,
      default: null,
    },

    completedAt: {
      type:    Date,
      default: null,
    },

    processingTime: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── Cache / Versioning ─────────────────────────────
    aiVersion: {
      type:    String,
      default: "v4",
    },

    isCached: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    minimize:   false,       // preserve empty objects/arrays in MongoDB
  }
);

// ======================================================
// INDEXES
// ======================================================

// Primary query: user's analysis list
analysisSchema.index({ user: 1, createdAt: -1 });

// Cache check: completed result for same input
analysisSchema.index({ user: 1, inputHash: 1, status: 1 });

// Running check: queued or processing same input
analysisSchema.index({ user: 1, inputHash: 1 });

// Daily limit count
analysisSchema.index({ user: 1, createdAt: 1 });

// Cross-user cache sharing potential
analysisSchema.index({ inputHash: 1, goal: 1, language: 1, status: 1 });

// Queue management
analysisSchema.index({ status: 1, createdAt: -1 });

// Content-based filtering
analysisSchema.index({ contentType: 1 });

// Text search
analysisSchema.index({ videoTitle: "text", summary: "text" });

// ======================================================
// PRE-SAVE MIDDLEWARE
// ======================================================

// async pre-save — no next() parameter (Mongoose 7+ / 8.x compatible)
analysisSchema.pre("save", async function () {
  // Cap heavy text fields
  if (this.notes   && this.notes.length   > 200000) this.notes   = this.notes.slice(0, 200000);
  if (this.summary && this.summary.length > 15000)  this.summary = this.summary.slice(0, 15000);
  if (this.rawAI   && this.rawAI.length   > 50000)  this.rawAI   = this.rawAI.slice(0, 50000);

  // Cap arrays
  if (this.keyPoints   && this.keyPoints.length   > 100) this.keyPoints   = this.keyPoints.slice(0, 100);
  if (this.actionSteps && this.actionSteps.length > 100) this.actionSteps = this.actionSteps.slice(0, 100);
  if (this.roadmap     && this.roadmap.length     > 50)  this.roadmap     = this.roadmap.slice(0, 50);

  // Compute processingTime automatically
  if (this.startedAt && this.completedAt && !this.processingTime) {
    this.processingTime = this.completedAt.getTime() - this.startedAt.getTime();
  }
});

// ======================================================
// VIRTUALS
// ======================================================

analysisSchema.virtual("processingSeconds").get(function () {
  return this.processingTime ? Math.floor(this.processingTime / 1000) : 0;
});

analysisSchema.virtual("isComplete").get(function () {
  return this.status === "completed";
});

analysisSchema.virtual("hasFailed").get(function () {
  return this.status === "failed";
});

// ======================================================
// STATIC METHODS
// ======================================================

// Find completed cached result for a given input
analysisSchema.statics.findCached = function (userId, inputHash) {
  return this.findOne({ user: userId, inputHash, status: "completed" }).select("_id status");
};

// Find any running job for the same input
analysisSchema.statics.findRunning = function (userId, inputHash) {
  return this.findOne({
    user:   userId,
    inputHash,
    status: { $in: ["queued", "processing"] },
  }).select("_id status");
};

// Count today's analyses for a user
analysisSchema.statics.countToday = function (userId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return this.countDocuments({ user: userId, createdAt: { $gte: todayStart } });
};

// ======================================================
// EXPORT
// ======================================================

const Analysis =
  mongoose.models.Analysis || mongoose.model("Analysis", analysisSchema);

export default Analysis;