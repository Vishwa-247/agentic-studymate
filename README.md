# Agentic StudyMate — AI-Powered Career Learning Platform

> **Production-grade learning path orchestrator with multi-agent architecture**

An intelligent career preparation platform that uses a **weighted multi-signal orchestrator** to adaptively route learners through interviews, courses, DSA practice, resume analysis, and project building — all powered by AI agents.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        API Gateway (port 8000)                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │              Embedded Services (no separate process)           │    │
│  │  ┌──────────────┐ ┌──────────────────┐ ┌────────────────────┐ │    │
│  │  │  Evaluator   │ │  Orchestrator v2 │ │   Job Search       │ │    │
│  │  │  (scoring)   │ │  (decision engine)│ │   (Brave+Firecrawl)│ │    │
│  │  └──────────────┘ └──────────────────┘ └────────────────────┘ │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                              │ proxy                                   │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                   Proxied Agent Services                       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │    │
│  │  │Interview │ │ Resume   │ │  DSA     │ │ Course           │ │    │
│  │  │ Coach    │ │ Analyzer │ │ Service  │ │ Generation       │ │    │
│  │  │ :8002    │ │ :8003    │ │ :8004    │ │ :8008            │ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │    │
│  │  ┌──────────┐ ┌──────────────────┐                           │    │
│  │  │ Profile  │ │ Project Studio   │                           │    │
│  │  │ Service  │ │ (multi-agent)    │                           │    │
│  │  │ :8006    │ │ :8012            │                           │    │
│  │  └──────────┘ └──────────────────┘                           │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Orchestrator v2 — System Design

The orchestrator is the **brain** of the platform. It decides what each user should work on next.

### Decision Engine (Weighted Multi-Signal)

```
┌────────────────────────────────────────────────────────────────────┐
│                       Decision Pipeline                            │
│                                                                    │
│  User State ──► Signal Extraction ──► Candidate Scoring ──►       │
│                                       (5 signals × weights)       │
│                                                                    │
│  ──► Diversity Filter ──► LLM Reasoning ──► Persist & Return     │
└────────────────────────────────────────────────────────────────────┘
```

**5 Scoring Signals (weighted):**

| Signal | Weight | Description |
|--------|--------|-------------|
| **Weakness Severity** | 40% | How far below threshold are relevant skills? |
| **Rate of Change** | 15% | Is the user improving or degrading? |
| **Recency** | 15% | When did user last visit this module? |
| **Goal Alignment** | 15% | Does module match user's target career role? |
| **Pattern Signal** | 15% | Memory patterns (repeated struggles, breakthroughs) |

**Decision Depth Levels:**
- `NORMAL` — All skills healthy, recommend skill application
- `REMEDIATION` — One skill below 0.4, targeted practice needed
- `CRITICAL` — One skill below 0.2, urgent intervention
- `ONBOARDING` — New user, no history yet

### System Design Patterns Used

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| **Circuit Breaker** | Per-service state machine (CLOSED→OPEN→HALF_OPEN) | Prevent cascading failures |
| **Service Registry** | Background health checks with latency tracking | Service discovery & availability |
| **Event Sourcing** | `orchestrator_decisions` audit trail table | Full decision explainability |
| **Observer Pattern** | In-memory metrics (Counter + Histogram ring buffers) | Zero-dependency observability |
| **Strategy Pattern** | Pluggable scoring signals with configurable weights | Extensible decision logic |
| **Graceful Degradation** | Fallback defaults when DB/LLM/services unavailable | Never crash the user |
| **Temporal Decay** | Recent performance weighted higher via EMA | Responsive to current skill state |
| **Diversity Filter** | Prevent N consecutive same-module recommendations | Balanced learning path |

### Orchestrator File Structure

```
backend/orchestrator/
├── __init__.py            # Package exports
├── config.py              # Module registry, skill dimensions, goal weights, tuning knobs
├── models.py              # Pydantic models (Decision, SkillScores, UserState, etc.)
├── engine.py              # Weighted multi-signal decision engine (core logic)
├── state_manager.py       # User state lifecycle (DB reads/writes, decision history)
├── circuit_breaker.py     # Circuit breaker pattern (per-service, 3-state FSM)
├── service_registry.py    # Service discovery + background health monitoring
├── metrics.py             # In-memory metrics (Counter, Histogram, ring buffer)
├── main_v2.py             # Standalone FastAPI app (port 8011)
├── rules.py               # Legacy rule engine (backward compatibility)
├── state.py               # Legacy state module (backward compatibility)
└── main.py                # Legacy FastAPI app (backward compatibility)
```

---

## Features

### 🎯 Adaptive Learning Path
- Orchestrator continuously tracks 5 skill dimensions
- Weighted decision engine considers weakness severity, momentum, goals, and patterns
- LLM generates human-readable recommendations (Decision 2 pattern)

### 🎤 Mock Interview Coach
- AI-powered question generation with multi-turn conversations
- WebSocket-based real-time interview sessions
- Voice interview support with transcription
- Post-interview evaluation across 5 thinking dimensions

### 📚 Interactive Course Generation
- AI-generated courses with audio narration (ElevenLabs)
- Code playgrounds, quizzes, flashcards, mind maps
- Adaptive difficulty based on understanding scores

### 💻 DSA Practice
- 450+ problems with AI-powered chatbot hints
- Progress tracking with spaced repetition
- Topic-wise analytics and skill prediction

### 📄 Resume Analyzer
- PDF/DOCX parsing with AI analysis
- STAR methodology scoring
- Job matching with multi-source crawling (Brave Search + Firecrawl)
- Skills gap analysis with AI recommendations

### 🚀 Project Studio
- 6-agent CrewAI-style pipeline (Idea → Market + Architecture + UX → Planner → Critic)
- Collaborative project building with AI agents

### 🔍 Job Search & Matching
- Multi-source job crawling (Brave Search API, 3 parallel queries)
- Concurrent Firecrawl scraping with blocked-domain filtering
- AI-powered skill matching with Groq/Gemini key rotation pool
- Freshness filters and gap analysis

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI, Framer Motion |
| **Backend** | Python, FastAPI, Uvicorn |
| **Database** | Supabase (PostgreSQL), asyncpg |
| **AI** | Groq (Llama 3.3 70B), Google Gemini 2.0 Flash, ElevenLabs |
| **APIs** | Brave Search, Firecrawl |
| **Auth** | Supabase Auth, JWT |
| **Architecture** | Microservices with API Gateway, Event Sourcing, Circuit Breaker |

---

## Quick Start

### Frontend
```bash
npm install
cp .env.example .env    # Add your Supabase keys
npm run dev             # http://localhost:5173
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env    # Add API keys (Groq, Gemini, Brave, Firecrawl, Supabase)

# Start the API Gateway (includes evaluator + orchestrator + job search)
uvicorn api-gateway.main:app --host 0.0.0.0 --port 8000 --reload

# Start individual agent services as needed
uvicorn agents.interview-coach.main:app --port 8002
uvicorn agents.resume-analyzer.main:app --port 8003
uvicorn agents.dsa-service.main:app --port 8004
uvicorn agents.course-generation.main:app --port 8008
```

### Service Ports

| Service | Port | Type |
|---------|------|------|
| API Gateway | 8000 | Central hub |
| Interview Coach | 8002 | Proxied |
| Resume Analyzer | 8003 | Proxied |
| DSA Service | 8004 | Proxied |
| Profile Service | 8006 | Proxied |
| Course Generation | 8008 | Proxied |
| Evaluator | 8000 | Embedded |
| Orchestrator | 8000 | Embedded |
| Project Studio | 8012 | Proxied |

---

## API Endpoints

### Orchestrator
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/next?user_id=UUID` | Get next recommended module |
| `GET` | `/api/state/{user_id}` | Get user state with context |
| `GET` | `/api/orchestrator/decisions?user_id=UUID` | Decision audit trail |
| `GET` | `/api/orchestrator/metrics` | Metrics dashboard |
| `GET` | `/api/orchestrator/circuit-breakers` | Circuit breaker status |
| `GET` | `/api/orchestrator/services` | Service health registry |

### Evaluator
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/evaluate` | Score a user's answer (5 dimensions) |

### Job Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/job-search/search-and-match` | Multi-source job search + AI matching |

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_DB_URL=postgresql://...

# AI Keys  
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=...

# Search & Scrape
BRAVE_SEARCH_API_KEY=...
FIRECRAWL_API_KEY=fc-...

# Optional: Orchestrator tuning
ORCH_WEAKNESS_THRESHOLD=0.4
ORCH_CB_FAILURE_THRESHOLD=5
ORCH_HEALTH_CHECK_INTERVAL=30
```

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `user_state` | Per-user skill scores (5 dimensions) |
| `scores` | Individual evaluation scores per interaction |
| `interactions` | Raw question/answer pairs |
| `user_memory` | Event log for pattern detection |
| `user_patterns` | Detected learning patterns |
| `orchestrator_decisions` | Decision audit trail with input snapshots |
| `user_onboarding` | Target role, primary focus |

---

## License

MIT
