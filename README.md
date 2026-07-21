# 🎓 AI Learning OS (`AiAnalyzer`)

> **Enterprise-Grade AI Educational Content Intelligence System**  
> Transform long-form educational YouTube videos into high-yield, interactive study suites equipped with Grounded AI Tutoring, 5-Minute Exam Revision, Smart Categorized Notes, Quizzes, Flashcards, and Roadmaps.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-blue?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Bull_Queue-red?style=flat-square&logo=redis)](https://redis.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--Mini-purple?style=flat-square&logo=openai)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 📌 Executive Overview

**AI Learning OS** is an AI-powered study platform built for students, developers, and researchers. By digesting educational YouTube transcripts, the platform generates a structured knowledge suite in real time, drastically reducing study time while maximizing long-term memory retention.

Built with a **Lazy-Tab Generation Architecture**, **4-Level RAG Retrieval Engine**, and **Double-Spend Proof Credit Pipeline**, the system balances high AI quality with strict token cost optimization.

---

## ✨ Features

### 🎥 1. AI YouTube Analysis
- Paste any public YouTube URL to trigger automated transcript fetching, chunking, and AI synthesis.
- Displays video metadata, channel context, duration warnings, and real-time processing progress.

### 🌐 2. Shared Analysis Architecture (Zero Duplicate LLM Costs)
- If a YouTube video has already been analyzed by *any* user on the platform, subsequent users receive instant access to the shared analysis with **0 additional OpenAI API calls**.
- Maps shared content to individual `UserAnalysis` records for personalized progress tracking.

### 🧠 3. Graph-Ready Knowledge Core
- Normalizes raw content into stable, graph-ready identifiers (`topics`, `concepts`, `definitions`, `commands`, `comparisons`).
- Prepares the database for future Mind Map, Knowledge Graph, and Concept Dependency visualization without schema redesigns.

### 🤖 4. Grounded AI Tutor Workspace
- Context-aware 1-on-1 AI Tutor grounded strictly in the video material using a 4-Level RAG pipeline.
- Automatically generates **4 contextual follow-up suggestions** per reply in a **single OpenAI completion call**.
- Includes 10 free messages per analysis with 1-credit (+10 messages) unlock packs.

### ⚡ 5. 5-Minute Exam Revision Mode
- Exam-ready revision dashboard generated **100% in-memory from stored content (0 OpenAI API calls)**.
- Features High-Yield Points, Key Terms, Common Exam Pitfalls, Viva Questions, 30-Second Recall Checklist, and One-Line Exam Takeaway.

### 📝 6. Smart Categorized Notes
- Structured educational notes separated into clear modules with code snippets, key formulas, and real-world analogies.

### 🃏 7. Interactive Flashcards
- Flip-card interface featuring active recall prompts, difficulty tags, self-ratings, and study progress tracking.

### 🧪 8. Knowledge Check Quiz
- Dynamic multiple-choice quiz engine with immediate explanation feedback, score calculation, and review screens.

### 🗺️ 9. Dynamic Learning Roadmap
- Step-by-step milestone progression guide providing logical next steps and recommended prerequisites.

### 💳 10. Atomic Credit & Billing System
- Credit-based monetization engine integrated with Razorpay.
- Built with **atomic MongoDB operations** (`findOneAndUpdate({ credits: { $gte: required } })`) to prevent double-spend race conditions under concurrent requests.

### ⚡ 11. Lazy Generation Pipeline
- Core summary generates eagerly upon video submission; heavy secondary tabs (Notes, Roadmap, Quiz, Flashcards) generate lazily on-demand when clicked, optimizing background queue latency.

### 🔒 12. JWT Authentication & Security
- HttpOnly cookie-based session management, password hashing (Bcrypt), Mongoose query sanitization, and ownership protection.

### 📊 13. Student Dashboard
- Centralized user dashboard displaying available credit balance, total analyses created, recent history, search filtering, and deletion controls.

### 📜 14. Analysis History Management
- Paginated, searchable history interface with skeleton loading states, focus traps, and modal accessibility.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 / Next.js 16 (App Router), Framer Motion, Lucide / React Icons | Responsive UI, SSR/SSG, micro-animations, theme control |
| **Styling** | Vanilla CSS Tokens, Glassmorphism, Dark Palette | Modern visual aesthetics without framework bloat |
| **Backend** | Node.js (v20+), Express.js (v4.19) | RESTful API, controller-service-generator pipeline |
| **Database** | MongoDB, Mongoose ODM | Document storage, atomic updates, compound indexes |
| **Queue & Cache** | Redis, Bull Queue | Asynchronous background jobs, state management |
| **AI Integration** | OpenAI API (`gpt-4o-mini`), Custom Prompt Builders | Synthesis, RAG context retrieval, dynamic model routing |
| **Auth & Security** | JSON Web Tokens (JWT), Bcrypt.js, Express Mongo Sanitize | Authentication, password hashing, NoSQL injection protection |
| **Payments** | Razorpay Node SDK | Credit pack checkout & webhook verification |

---

## 🏗️ Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │              Next.js 16                │
                      │         (React 19 Frontend)            │
                      └──────────────────┬─────────────────────┘
                                         │  HTTP / REST
                                         ▼
                      ┌────────────────────────────────────────┐
                      │            Express API Server          │
                      └──────────┬───────────────────┬─────────┘
                                 │                   │
                     ┌───────────▼─────────┐       ┌─▼──────────────────────┐
                     │ MongoDB (Data Core) │       │   Bull Queue / Redis   │
                     │  - Users            │       └───────────┬────────────┘
                     │  - Analyses         │                   │
                     │  - UserAnalyses     │        ┌──────────▼────────────┐
                     └─────────────────────┘        │  Analysis Queue Worker│
                                                    └──────────┬────────────┘
                                                               │
                                                    ┌──────────▼────────────┐
                                                    │   OpenAI API Pipeline │
                                                    │ (4-Level RAG Engine)  │
                                                    └───────────────────────┘
```

---

## 📂 Folder Structure

```
AiAnalyzer_copy/
├── backend/
│   ├── config/             # DB, Redis, Razorpay, AI limits config
│   ├── controllers/        # HTTP Handlers (Analyze, Auth, Dashboard, Payment, Tutor)
│   ├── generators/         # LLM Generation Logic (Notes, Quiz, Flashcards, Tutor, etc.)
│   ├── middleware/         # Auth Guard, Error Handler, Mongo Sanitizer
│   ├── models/             # Mongoose Schemas (User, Analysis, UserAnalysis, Payment, Plan)
│   ├── prompts/            # Grounded System Prompts & Security Hardening Templates
│   ├── queues/             # Bull Redis Task Queues
│   ├── routes/             # Express API Endpoints
│   ├── scripts/            # Database Migration & Audit Scripts
│   ├── services/           # Business Services & 4-Level RAG Engine
│   ├── utils/              # YouTube Meta Extractor, Credit Calculators
│   ├── workers/            # Queue Workers for Asynchronous LLM Processing
│   ├── app.js              # Express Application Setup
│   └── server.js           # Server Entry Point & Process Listeners
│
└── frontend/
    ├── public/             # Static Assets & Icons
    └── src/
        ├── app/            # Next.js App Router (analyze, dashboard, buy-credits, result/[id])
        ├── components/     # Reusable UI Components (Navbar, History, Modals, Screens)
        ├── constants/      # Tab Definitions & Pricing Plans
        ├── contexts/       # React Auth & State Contexts
        ├── hooks/          # Custom Hooks (usePolling, useLazyGeneration, useTabManager)
        └── services/       # Frontend API Clients (resultApi, analysisService)
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **MongoDB**: Local instance or MongoDB Atlas URI
- **Redis**: Local server or Upstash/Redis Cloud instance
- **OpenAI API Key**: Active API key with access to `gpt-4o-mini`

### Step 1: Clone Repository
```bash
git clone https://github.com/YourUsername/AiAnalyzer.git
cd AiAnalyzer
```

### Step 2: Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/aianalyzer
JWT_SECRET=your_super_secret_jwt_key_here
REDIS_URL=redis://127.0.0.1:6379

# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-your_openai_api_key_here
OPENAI_MODEL_FAST=gpt-4o-mini

# Razorpay Credentials (Optional for local dev)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

Start backend development server:
```bash
npm run dev
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
```

Create `frontend/.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start frontend development server:
```bash
npm run dev
```

Visit application at `http://localhost:3000`.

---

## 🔑 Environment Variables Reference

### Backend `.env.example`
| Variable | Required | Description | Default |
|---|---|---|---|
| `PORT` | No | Server listener port | `5000` |
| `MONGODB_URI` | **Yes** | MongoDB connection string | - |
| `JWT_SECRET` | **Yes** | Secret for signing JWT auth tokens | - |
| `REDIS_URL` | **Yes** | Connection URL for Redis queue server | `redis://127.0.0.1:6379` |
| `OPENAI_API_KEY` | **Yes** | OpenAI API key | - |
| `OPENAI_MODEL_FAST` | No | Target fast model for synthesis | `gpt-4o-mini` |
| `FRONTEND_URL` | **Yes** | Allowed CORS origin | `http://localhost:3000` |

---

## 📡 Key API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Create user account
- `POST /api/auth/login` — Authenticate & set HttpOnly cookie
- `GET /api/auth/me` — Fetch current user profile & balance
- `POST /api/auth/logout` — Revoke session cookie

### 📹 Analysis (`/api/analyze`)
- `POST /api/analyze/youtube` — Submit YouTube URL for analysis
- `GET /api/analyze/:id` — Fetch complete analysis document
- `GET /api/analyze/:id/status` — Poll job progress status
- `POST /api/analyze/:id/generate` — Lazily trigger section generation (`notes`, `quiz`, `flashcards`, `roadmap`)

### 🤖 AI Tutor (`/api/analyze/:id/tutor`)
- `GET /api/analyze/:id/tutor/status` — Fetch chat history and quota balance
- `POST /api/analyze/:id/tutor/chat` — Submit student question (4-Level RAG single-call response)
- `POST /api/analyze/:id/tutor/purchase-pack` — Deduct 1 credit atomically for +10 tutor messages

---

## 🛡️ Security Posture

1. **Atomic Credit Balances**: Uses conditional `findOneAndUpdate({ _id: userId, credits: { $gte: 1 } })` to prevent double-spending in race conditions.
2. **Prompt Injection Guardrails**: Encloses student input inside `<student_question>` XML tags with strict system prompt isolation rules.
3. **NoSQL Injection Defense**: Integrated `express-mongo-sanitize` strips `$` and `.` operators from request bodies.
4. **JWT Security**: Signed tokens stored in secure HttpOnly cookies preventing XSS script access.
5. **Authorization Guards**: Resource level ownership checks (`UserAnalysis`) enforce data isolation between users.

---

## ⚡ Performance & Cost Optimization Metrics

- **0 LLM Calls for 5-Minute Revision**: Computes 100% in-memory from stored analysis data.
- **Single-Call AI Tutor Replies**: Generates answer + 4 follow-up suggestions in **1 single API call**.
- **Shared Analysis Engine**: Instant results with 0 AI cost for previously analyzed videos.
- **Lazy Tab Loading**: Saves up to 70% unnecessary LLM API generation calls by loading secondary tabs on click.

---

## 🚀 Production Deployment Checklist

- [x] Configure production MongoDB cluster (MongoDB Atlas).
- [x] Provision production Redis instance (Upstash / AWS ElastiCache).
- [x] Set secure, random `JWT_SECRET` string.
- [x] Set production CORS origins (`FRONTEND_URL`).
- [x] Run `node scripts/audit_backend.js` (Verify 73/73 backend files pass).
- [x] Run `npm run build` in `frontend` (Verify 0 compilation errors).
- [x] Verify MongoDB compound indexes on `UserAnalysis` (`{ user: 1, createdAt: -1 }`).

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author & Team

**AI Learning OS Engineering Team**  
*Building production-grade AI educational technology.*
