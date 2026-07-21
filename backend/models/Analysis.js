import mongoose from "mongoose";

// ======================================================
// SUB-SCHEMAS
// ======================================================

const quizSchema = new mongoose.Schema(
  {
    question:           { type: String, default: "" },
    options:            { type: [String], default: [] },
    correctAnswerIndex: { type: Number, default: 0 },
    explanation:        { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { _id: false },
);

const noteSectionSchema = new mongoose.Schema(
  {
    title:     { type: String, default: "", trim: true },
    content:   { type: String, default: "" },
    type: {
      type: String,
      enum: [
        "introduction", "core_concept", "example", "advanced",
        "interview", "revision", "warning", "summary", "code", "project",
      ],
      default: "core_concept",
    },
    importance: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    // Added in Notes v2 — difficulty badge and next-topic connector
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    nextTopic: { type: String, default: "", trim: true },
    order:     { type: Number, default: 0 },
  },
  { _id: false },
);

// ── Flashcard sub-schema ─────────────────────────────────────────────────────

const flashcardSchema = new mongoose.Schema(
  {
    question:   { type: String, default: "" },
    answer:     { type: String, default: "" },
    type: {
      type: String,
      enum: ["definition", "concept", "difference", "true_false", "code_recall", "scenario"],
      default: "concept",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    tags: { type: [String], default: [] },
  },
  { _id: false },
);

// ── Knowledge Core sub-schema ────────────────────────────────────────────────
// Graph-ready, versioned internal representation for future learning OS features.
// NOT exposed directly to the UI. Default null for backward compatibility.

const knowledgeCoreMetadataSchema = new mongoose.Schema(
  {
    schemaVersion:  { type: String, default: "v1" },
    aiVersion:      { type: String, default: "v5" },
    promptVersion:  { type: String, default: "v1" },
    generatedAt:    { type: Date,   default: Date.now },
    domain:         { type: String, default: "general" },
    level:          { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    sourceType:     { type: String, default: "youtube" },
    sourceLanguage: { type: String, default: "english" },
    videoDuration:  { type: Number, default: 0 },
    videoId:        { type: String, default: "" },
    videoTitle:     { type: String, default: "" },
  },
  { _id: false }
);

const knowledgeCoreSchema = new mongoose.Schema(
  {
    metadata:          { type: knowledgeCoreMetadataSchema, default: () => ({}) },
    topics:            { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{ id, name }]
    concepts:          { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{ id, name, explanation, importance, confidence }]
    definitions:       { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{ id, term, definition, confidence }]
    comparisons:       { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{ id, subjectA, subjectB, difference, confidence }]
    prerequisites:     { type: [String], default: [] },
    commands:          { type: [String], default: [] },
    formulas:          { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{ id, name, formula, explanation, confidence }]
    glossary:          { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{ id, term, definition }]
    relationships:     { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{ id, sourceId, targetId, relationship, confidence }]
    realWorldExamples: { type: [String], default: [] },
    bestPractices:     { type: [String], default: [] },
    commonMistakes:    { type: [String], default: [] },
    revisionPoints:    { type: [String], default: [] },
    interviewInsights: { type: [String], default: [] },
    timeline:          { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{ step, title, description }]
    references:        { type: [String], default: [] },
  },
  { _id: false }
);

const executionPlanSchema = new mongoose.Schema(
  {
    day:  { type: String, default: "", trim: true },
    task: { type: String, default: "", trim: true },
  },
  { _id: false },
);

// ======================================================
// ARRAY VALIDATOR FACTORY
// ======================================================

const maxArrayLen = (max, label) => ({
  validator: (arr) => (Array.isArray(arr) ? arr.length <= max : true),
  message: `${label} exceeds maximum of ${max} items`,
});

// ======================================================
// MAIN ANALYSIS SCHEMA
// ======================================================

const analysisSchema = new mongoose.Schema(
  {
    // ── Ownership ───────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    // ── Input ───────────────────────────────────────────
    youtubeUrl: { type: String, required: true, trim: true },
    inputHash:  { type: String, required: true, trim: true },

    language: {
      type: String,
      enum: [
        "english", "hinglish", "hindi", "tamil", "bengali",
        "telugu", "marathi", "gujarati", "punjabi", "urdu",
        "malayalam", "kannada", "arabic", "spanish", "french",
        "german", "japanese", "korean", "chinese", "portuguese",
      ],
      required: true,
    },

    goal: {
      type: String,
      enum: ["student", "developer", "job_seeker"],
      required: true,
    },

    // ── Content Type ────────────────────────────────────
    contentType: {
      type: String,
      enum: ["tech", "academic", "interview", "general"],
      default: "general",
    },

    // ── Video Metadata ──────────────────────────────────
    videoTitle:       { type: String, default: "", trim: true },
    thumbnail:        { type: String, default: "", trim: true },
    duration:         { type: Number, default: 0, min: 0 },
    transcriptLength: { type: Number, default: 0, min: 0 },

    // ── Transcript (saved for lazy generation) ──────────
    transcript: { type: String, default: "", maxlength: 180000 },

    // ── Initial Analysis Output ─────────────────────────
    summary:   { type: String, default: "" },
    outcome:   { type: String, default: "" },
    keyPoints: {
      type: [String],
      default: [],
      validate: maxArrayLen(100, "keyPoints"),
    },

    // ── Lazy: Notes ──────────────────────────────────────
    learningObjectives: { type: String, default: "" },
    notes:              { type: String, default: "" },
    sections: {
      type: [noteSectionSchema],
      default: [],
      validate: maxArrayLen(50, "sections"),
    },

    // ── Lazy: Quiz ───────────────────────────────────────
    quiz: {
      type: [quizSchema],
      default: [],
      validate: maxArrayLen(50, "quiz"),
    },

    // ── Lazy: Roadmap ─────────────────────────────────────
    roadmap: {
      type: [String],
      default: [],
      validate: maxArrayLen(50, "roadmap"),
    },

    learningPath: {
      type: [String],
      default: [],
    },

    executionPlan: {
      type: [executionPlanSchema],
      default: [],
    },

    // ── Credit System ────────────────────────────────────
    creditsUsed:     { type: Number, required: true, min: 1 },
    creditsDeducted: { type: Boolean, default: false },

    // ── Status ───────────────────────────────────────────
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
    },

    progress:    { type: Number, default: 0, min: 0, max: 100 },
    error:       { type: String, default: "" },

    // ── Timing ───────────────────────────────────────────
    startedAt:      { type: Date, default: null },
    completedAt:    { type: Date, default: null },
    processingTime: { type: Number, default: 0, min: 0 },

    // ── Cache / Version ──────────────────────────────────
    aiVersion:      { type: String, default: "v5" },
    isCached:       { type: Boolean, default: false },
    cacheHits:      { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: null },

    // ── Lazy: Flashcards ─────────────────────────────────
    flashcards: {
      type: [flashcardSchema],
      default: [],
      validate: maxArrayLen(200, "flashcards"),
    },

    // ── Internal: Knowledge Core ──────────────────────────
    // Internal canonical representation (graph-ready).
    // Default null ensures zero migration needed for historical analyses.
    knowledgeCore: {
      type: knowledgeCoreSchema,
      default: null,
    },

    // ── Lazy Generation Flags ────────────────────────────
    notesGenerated:      { type: Boolean, default: false, index: true },
    quizGenerated:       { type: Boolean, default: false, index: true },
    roadmapGenerated:    { type: Boolean, default: false, index: true },
    flashcardsGenerated: { type: Boolean, default: false, index: true },
  },

  { timestamps: true, minimize: false },
);

// ======================================================
// INDEXES
// ======================================================

analysisSchema.index({ user: 1, createdAt: -1 });
analysisSchema.index({ user: 1, inputHash: 1, status: 1 });
analysisSchema.index({ inputHash: 1, goal: 1, language: 1, status: 1 }, { language_override: "dummy_language" });
analysisSchema.index({ status: 1, createdAt: -1 });
analysisSchema.index({ videoTitle: "text", summary: "text" }, { language_override: "dummy_language" });

// Unique index for the global cache with active requests (excludes failed ones)
analysisSchema.index(
  { inputHash: 1, language: 1, aiVersion: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["completed", "queued", "processing"] } },
    language_override: "dummy_language",
  }
);

// ======================================================
// PRE SAVE
// ======================================================

analysisSchema.pre("save", function () {
  if (this.notes?.length > 200000) this.notes = this.notes.slice(0, 200000);
  if (this.summary?.length > 15000) this.summary = this.summary.slice(0, 15000);

  if (Array.isArray(this.sections) && this.sections.length) {
    this.sections = this.sections.map((s) => ({
      ...s,
      content: s.content?.length > 20000 ? s.content.slice(0, 20000) : s.content,
    }));
  }

  if (this.keyPoints?.length  > 100) this.keyPoints  = this.keyPoints.slice(0, 100);
  if (this.roadmap?.length    > 50)  this.roadmap    = this.roadmap.slice(0, 50);
  if (this.sections?.length   > 50)  this.sections   = this.sections.slice(0, 50);
  if (this.quiz?.length       > 50)  this.quiz       = this.quiz.slice(0, 50);
  if (this.flashcards?.length > 200) this.flashcards = this.flashcards.slice(0, 200);

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

analysisSchema.statics.findCached = function (userId, inputHash) {
  return this.findOne({ user: userId, inputHash, status: "completed" }).select("_id status");
};

analysisSchema.statics.findRunning = function (userId, inputHash) {
  return this.findOne({ user: userId, inputHash, status: { $in: ["queued", "processing"] } }).select("_id status");
};

analysisSchema.statics.findCachedGlobal = function (inputHash, language, version) {
  return this.findOne({ inputHash, language, aiVersion: version, status: "completed" });
};

analysisSchema.statics.findRunningGlobal = function (inputHash, language, version) {
  return this.findOne({ inputHash, language, aiVersion: version, status: { $in: ["queued", "processing"] } });
};

analysisSchema.statics.countToday = function (userId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return this.countDocuments({ user: userId, createdAt: { $gte: todayStart } });
};

// ======================================================
// EXPORT
// ======================================================

const Analysis = mongoose.models.Analysis || mongoose.model("Analysis", analysisSchema);

export default Analysis;
