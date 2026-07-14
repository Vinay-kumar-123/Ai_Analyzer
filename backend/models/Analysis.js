import mongoose from "mongoose";

// ======================================================
// SUB-SCHEMAS
// ======================================================

const qaSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      default: "Question",
    },

    answer: {
      type: String,
      required: true,
      trim: true,
      default: "Answer",
    },
  },
  { _id: false },
);

const executionPlanSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      default: "",
      trim: true,
    },

    task: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

const confusionSchema = new mongoose.Schema(
  {
    concept: {
      type: String,
      default: "",
      trim: true,
    },

    simpleExplanation: {
      type: String,
      default: "",
    },

    realLifeExample: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const actionEngineSchema = new mongoose.Schema(
  {
    step: {
      type: String,
      default: "",
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      default: "Step",
    },

    whatToDo: {
      type: String,
      default: "",
    },

    command: {
      type: String,
      default: "",
    },

    code: {
      type: String,
      default: "",
    },

    expectedResult: {
      type: String,
      default: "",
    },

    commonMistake: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },

    features: {
      type: [String],
      default: [],
    },

    techStack: {
      type: [String],
      default: [],
    },

    folderStructure: {
      type: [String],
      default: [],
    },

    starterCode: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const quizSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      default: "",
    },

    options: {
      type: [String],
      default: [],
    },

    correctAnswerIndex: {
      type: Number,
      default: 0,
    },

    explanation: {
      type: String,
      default: "",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { _id: false },
);

const flashcardSchema = new mongoose.Schema(
  {
    front: {
      type: String,
      default: "",
    },

    back: {
      type: String,
      default: "",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

// ======================================================
// STRUCTURED NOTE SECTION
// ======================================================

const noteSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },

    content: {
      type: String,
      default: "",
    },

    type: {
      type: String,

      enum: [
        "introduction",
        "core_concept",
        "example",
        "advanced",
        "interview",
        "revision",
        "warning",
        "summary",
        "code",
        "project",
        "quiz",
      ],

      default: "core_concept",
    },

    importance: {
      type: String,

      enum: ["high", "medium", "low"],

      default: "medium",
    },

    order: {
      type: Number,
      default: 0,
    },
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
    // ==================================================
    // OWNERSHIP
    // ==================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==================================================
    // INPUT
    // ==================================================

    youtubeUrl: {
      type: String,
      required: true,
      trim: true,
    },

    inputHash: {
      type: String,
      required: true,
      trim: true,
    },

    language: {
      type: String,

      enum: ["english", "hinglish", "hindi", "tamil", "bengali"],

      required: true,
    },

    goal: {
      type: String,

      enum: ["student", "developer", "job_seeker"],

      required: true,
    },

    // ==================================================
    // CONTENT TYPE
    // ==================================================

    contentType: {
      type: String,

      enum: ["tech", "academic", "exam", "interview", "business", "general"],

      default: "general",
    },

    // ==================================================
    // VIDEO METADATA
    // ==================================================

    videoTitle: {
      type: String,
      default: "",
      trim: true,
    },

    thumbnail: {
      type: String,
      default: "",
      trim: true,
    },

    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    transcriptLength: {
      type: Number,
      default: 0,
      min: 0,
    },

    transcript: {
      type: String,
      default: "",
      maxlength: 180000,
    },

    // ==================================================
    // CORE OUTPUT
    // ==================================================

    summary: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    outcome: {
      type: String,
      default: "",
    },

    // ==================================================
    // STRUCTURED NOTES
    // ==================================================

    sections: {
      type: [noteSectionSchema],
      default: [],
      validate: maxArrayLen(50, "sections"),
    },

    // ==================================================
    // ARRAY OUTPUTS
    // ==================================================

    keyPoints: {
      type: [String],
      default: [],
      validate: maxArrayLen(100, "keyPoints"),
    },

    actionSteps: {
      type: [String],
      default: [],
      validate: maxArrayLen(100, "actionSteps"),
    },

    roadmap: {
      type: [String],
      default: [],
      validate: maxArrayLen(50, "roadmap"),
    },

    learningPath: {
      type: [String],
      default: [],
    },

    // ==================================================
    // OBJECT ARRAYS
    // ==================================================

    qa: {
      type: [qaSchema],
      default: [],
    },

    executionPlan: {
      type: [executionPlanSchema],
      default: [],
    },

    confusion: {
      type: [confusionSchema],
      default: [],
    },

    actionEngine: {
      type: [actionEngineSchema],
      default: [],
    },

    quiz: {
      type: [quizSchema],
      default: [],
      validate: maxArrayLen(100, "quiz"),
    },

    flashcards: {
      type: [flashcardSchema],
      default: [],
      validate: maxArrayLen(200, "flashcards"),
    },

    // ==================================================
    // PROJECT
    // ==================================================

    project: {
      type: projectSchema,
      default: () => ({}),
    },

    // ==================================================
    // RAW AI
    // ==================================================

    rawAI: {
      type: String,
      default: "",
      maxlength: 50000,
    },

    // ==================================================
    // CREDIT SYSTEM
    // ==================================================

    creditsUsed: {
      type: Number,
      required: true,
      min: 1,
    },

    creditsDeducted: {
      type: Boolean,
      default: false,
    },

    // ==================================================
    // STATUS
    // ==================================================

    status: {
      type: String,

      enum: ["queued", "processing", "completed", "failed"],

      default: "queued",
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    error: {
      type: String,
      default: "",
    },

    // ==================================================
    // TIMING
    // ==================================================

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    processingTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==================================================
    // CACHE / VERSION
    // ==================================================

    aiVersion: {
      type: String,
      default: "v5",
    },

    isCached: {
      type: Boolean,
      default: false,
    },

    notesGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },

    quizGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },

    flashcardsGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },

    projectGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },

    roadmapGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },
  },

  {
    timestamps: true,
    minimize: false,
  },
);

// ======================================================
// INDEXES
// ======================================================

analysisSchema.index({
  user: 1,
  createdAt: -1,
});

analysisSchema.index({
  user: 1,
  inputHash: 1,
  status: 1,
});

analysisSchema.index({
  inputHash: 1,
});

analysisSchema.index({
  user: 1,
  createdAt: 1,
});

analysisSchema.index({
  inputHash: 1,
  goal: 1,
  language: 1,
  status: 1,
});

analysisSchema.index({
  status: 1,
  createdAt: -1,
});

analysisSchema.index({
  contentType: 1,
});

analysisSchema.index({
  videoTitle: "text",
  summary: "text",
});

// ======================================================
// PRE SAVE
// ======================================================

analysisSchema.pre("save", async function () {
  if (this.notes && this.notes.length > 200000) {
    this.notes = this.notes.slice(0, 200000);
  }

  if (this.summary && this.summary.length > 15000) {
    this.summary = this.summary.slice(0, 15000);
  }

  if (this.rawAI && this.rawAI.length > 50000) {
    this.rawAI = this.rawAI.slice(0, 50000);
  }

  if (Array.isArray(this.sections) && this.sections.length) {
    this.sections = this.sections.map((section) => ({
      ...section,
      content:
        section.content?.length > 20000
          ? section.content.slice(0, 20000)
          : section.content,
    }));
  }

  if (this.keyPoints?.length > 100) {
    this.keyPoints = this.keyPoints.slice(0, 100);
  }

  if (this.actionSteps?.length > 100) {
    this.actionSteps = this.actionSteps.slice(0, 100);
  }

  if (this.roadmap?.length > 50) {
    this.roadmap = this.roadmap.slice(0, 50);
  }

  if (this.sections?.length > 50) {
    this.sections = this.sections.slice(0, 50);
  }

  if (this.quiz?.length > 100) {
    this.quiz = this.quiz.slice(0, 100);
  }

  if (this.flashcards?.length > 200) {
    this.flashcards = this.flashcards.slice(0, 200);
  }

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
  return this.findOne({
    user: userId,
    inputHash,
    status: "completed",
  }).select("_id status");
};

analysisSchema.statics.findRunning = function (userId, inputHash) {
  return this.findOne({
    user: userId,
    inputHash,

    status: {
      $in: ["queued", "processing"],
    },
  }).select("_id status");
};

analysisSchema.statics.countToday = function (userId) {
  const todayStart = new Date();

  todayStart.setHours(0, 0, 0, 0);

  return this.countDocuments({
    user: userId,

    createdAt: {
      $gte: todayStart,
    },
  });
};

// ======================================================
// EXPORT
// ======================================================

const Analysis =
  mongoose.models.Analysis || mongoose.model("Analysis", analysisSchema);

export default Analysis;
