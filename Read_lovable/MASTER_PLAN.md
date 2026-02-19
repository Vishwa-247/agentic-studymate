# STUDYMATE — Master Implementation Plan & Full Context

> **PURPOSE**: This is the single source of truth for the entire project rebuild.  
> **Read this file FIRST** in any new chat session to understand everything that has been analyzed, decided, and planned.  
> **Last Updated**: 2026-02-19 (Orchestrator v2 + Auth Security completed)  
> **Session**: Full codebase audit + 14-day sprint plan locked + Phase 1-2 DONE

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Tech Stack (Actual)](#2-tech-stack-actual)
3. [Architecture Map](#3-architecture-map)
4. [Critical Bugs Found (10)](#4-critical-bugs-found-10)
5. [Architectural Flaws Found (7)](#5-architectural-flaws-found-7)
6. [Module-by-Module Completion Audit](#6-module-by-module-completion-audit)
7. [All 15 Design Decisions (Locked)](#7-all-15-design-decisions-locked)
8. [14-Day Sprint Plan](#8-14-day-sprint-plan)
9. [Constraints & Context](#9-constraints--context)
10. [File Map (Key Files)](#10-file-map-key-files)
11. [What Works Right Now](#11-what-works-right-now)
12. [What Is Completely Missing](#12-what-is-completely-missing)

---

## 1. Project Identity

**Name**: StudyMate — Agentic Career Preparation Platform  
**Type**: College final year project (12-credit)  
**Developer**: Solo  
**Deadline**: ~2 weeks from Feb 16, 2026  
**Goal**: Startup-grade project that trains students to think like production engineers through AI-driven questioning, challenging, and adaptive learning paths.

**Core Loop**:
```
User → Orchestrator (Brain) → Chooses Module → Module QUESTIONS User
→ User Responds → System Evaluates & Adapts → Career State Updates
→ Orchestrator Replans Next Action
```

**6 Modules**:
1. Agent Orchestrator (Brain)
2. Interactive Course Generation
3. Project Studio (Multi-Agent)
4. Production Thinking Interview
5. DSA Skill Mastery
6. Career Tracker

---

## 2. Tech Stack (Actual)

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | React 18 + TypeScript + Vite | Port 5173 (dev), configured as 8080 in vite.config |
| **UI** | Tailwind CSS + shadcn/ui (Radix) | Electric Indigo theme |
| **Animation** | Framer Motion + GSAP + Lenis | Smooth scroll |
| **Routing** | React Router v6 | 15+ pages |
| **State** | TanStack React Query + Context | Server state + auth context |
| **Auth** | Supabase Auth (frontend + gateway) | Gateway validates Supabase JWT (FIXED Feb 19) |
| **Backend** | Python FastAPI microservices | 9 services, each standalone |
| **API Gateway** | FastAPI (port 8000) | Routes to all services |
| **Database** | Supabase PostgreSQL | 30+ migrations |
| **Database (DSA)** | MongoDB (motor async) | TO BE MIGRATED to Supabase |
| **LLM (Primary)** | Groq (free tier) | llama-3.3-70b-versatile |
| **LLM (Course)** | Google Gemini | Dedicated API key pools |
| **LLM (Fallback)** | OpenRouter | For scoring |
| **Audio** | ElevenLabs | Text-to-speech |
| **Web Scraping** | Firecrawl | Job search |
| **Search** | Brave Search API | Web search |
| **Edge Functions** | Supabase (Deno) | 6 functions deployed |
| **Emotion** | Flask + PyTorch + ViT | Separate Flask app (optional) |

---

## 3. Architecture Map

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│  Port 5173 — Vite Dev Server                        │
│  Auth: Supabase JS Client → access_token            │
│  API: src/lib/api.ts → localhost:8000               │
│  Also calls: Supabase Edge Functions directly       │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP + Bearer <supabase_jwt>
┌───────────────────────▼─────────────────────────────┐
│              API GATEWAY (FastAPI)                    │
│  Port 8000 — backend/api-gateway/main.py (~1650 ln)  │
│  ✅ CORS: specific origins only (FIXED)              │
│  ✅ Auth: Supabase JWT validation (FIXED)            │
│  ✅ Embedded: Orchestrator v2 + Evaluator + Job Srch │
│  Routes: /api/next, /api/evaluate, /api/interview/*  │
│  /api/resume/*, /api/course/*, /api/project-studio/* │
│  /api/job-search/*, /api/orchestrator/metrics        │
│  /auth/signin (Supabase token), /auth/signup (410)   │
└──┬──────┬──────┬──────┬────────────────────┬────────┘
   │      │      │      │  (embedded)        │
   ▼      ▼      ▼      ▼                    │
┌──────┐┌──────┐┌──────┐┌────────────────┐   │
│Inter ││Resume││Course││ Orchestrator v2 │   │
│8002  ││8003  ││8008  ││ DecisionEngine │   │
└──────┘└──────┘└──────┘│ CircuitBreaker │   │
                        │ ServiceRegistry│   │
                        │ StateManager   │   │
                        │ Metrics        │   │
                        └────────────────┘   │
                                  │          │
                          ┌───────┘          │
                          ▼                  ▼
                    ┌──────────┐      ┌──────────┐
                    │ DSA Svc  │      │ Proj.    │
                    │ 8004     │      │ Studio   │
                    │ MongoDB! │      │ 8012     │
                    └──────────┘      └──────────┘

Also: Profile Service (8006), Emotion Detection (Flask, 5001)
Also: 6 Supabase Edge Functions called directly from frontend
```

**Port Registry**:
| Service | Port | File |
|---------|------|------|
| API Gateway | 8000 | backend/api-gateway/main.py (~1650 lines) |
| Interview Coach | 8002 | backend/agents/interview-coach/main.py |
| Resume Analyzer | 8003 | backend/agents/resume-analyzer/main.py |
| DSA Service | 8004 | backend/agents/dsa-service/main.py |
| Emotion Detection | 5001 | backend/agents/emotion-detection/app.py |
| Profile Service | 8006 | backend/agents/profile-service/main.py |
| Course Generation | 8008 | backend/agents/course-generation/main.py |
| Evaluator | 8000 | **Embedded in API Gateway** (was 8010) |
| Orchestrator v2 | 8000 | **Embedded in API Gateway** (was 8011) |
| Project Studio | 8012 | backend/agents/project-studio/main.py |
| Job Search | 8000 | **Embedded in API Gateway** (was 8013) |

---

## 4. Critical Bugs Found (10)

### Bug 1: CORS Misconfiguration (SECURITY) — ✅ FIXED (Feb 19)
- **File**: `backend/api-gateway/main.py`
- **Issue**: `allow_origins=["*"]` with `allow_credentials=True` — browsers will reject this
- **Fix**: Set specific origins: `["http://localhost:5173", "https://your-vercel-app.vercel.app"]`
- **Resolution**: CORS now uses `ALLOWED_ORIGINS` list + `ALLOWED_ORIGIN_REGEX` pattern. Commit `781d0b3`.

### Bug 2: Blocking `time.sleep()` in Async Server (CRASH RISK)
- **File**: `backend/agents/project-studio/main.py`
- **Issue**: Uses `time.sleep(1)` inside async FastAPI — blocks the entire event loop
- **Fix**: Use `await asyncio.sleep()` or remove artificial delays (service is 100% mock anyway)

### Bug 3: Hardcoded Gateway JWT Secret (SECURITY) — ✅ FIXED (Feb 19)
- **File**: `backend/api-gateway/main.py`
- **Issue**: `SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")`
- **Fix**: Remove default, require env var, or better: remove gateway JWT entirely and use Supabase JWT only
- **Resolution**: `verify_token()` now validates Supabase JWT first via `SUPABASE_JWT_SECRET`, legacy fallback kept. Commit `781d0b3`.

### Bug 4: Dual Auth System Conflict — ✅ FIXED (Feb 19)
- **Files**: Gateway uses its own JWT, frontend uses Supabase Auth
- **Issue**: Two incompatible auth systems. Gateway `/auth/signin` creates its own tokens. Frontend sends Supabase tokens. They don't validate each other.
- **Fix**: Remove gateway auth entirely. Validate Supabase JWTs in gateway instead.
- **Resolution**: Gateway validates Supabase JWT primary, legacy fallback. Frontend `gatewayAuthService.ts` rewritten to use Supabase access_token. Commit `781d0b3`.

### Bug 5: Fake Sign-In Accepts Any Credentials — ✅ FIXED (Feb 19)
- **File**: `backend/api-gateway/main.py`
- **Issue**: `/auth/signin` accepts any email/password with `"demo"` logic, returns a valid token
- **Fix**: Remove fake auth endpoints. Use Supabase Auth only.
- **Resolution**: `/auth/signup` returns 410 Gone. `/auth/signin` now validates `supabase_token` if provided. `password:'demo'` backdoor removed from frontend. Commit `781d0b3`.

### Bug 6: Port Mismatch in Frontend Config
- **File**: `src/configs/backendConfig.ts`
- **Issue**: DSA service port listed as 8002 but actual service runs on 8004
- **Fix**: Correct to 8004 (or better: route everything through gateway)

### Bug 7: Missing Auth Tokens in Frontend API Calls
- **File**: `src/lib/api.ts`
- **Issue**: API calls to gateway don't include Supabase auth token in headers
- **Fix**: Add `Authorization: Bearer ${supabase.auth.session().access_token}` to all requests

### Bug 8: Unprotected Endpoints
- **File**: `backend/api-gateway/main.py`
- **Issue**: `/api/next` (orchestrator), resume history endpoints have NO authentication
- **Fix**: Add auth middleware to all `/api/*` routes

### Bug 9: No Score Decay in Evaluator
- **File**: `backend/evaluator/aggregator.py`
- **Issue**: Uses ALL-TIME average for user scores — old bad scores haunt forever
- **Fix**: Add recency-weighted scoring (exponential decay or sliding window)

### Bug 10: Gateway References Non-Existent Service
- **File**: `backend/api-gateway/main.py`
- **Issue**: References `resume-analyzer-groq` service that doesn't exist in registry
- **Fix**: Remove or correct the reference

---

## 5. Architectural Flaws Found (7)

### Flaw 1: Not Truly Agentic — ✅ FIXED (Feb 18-19)
- **Current**: ~~Orchestrator uses deterministic if-elif rules (rules.py)~~
- **Needed**: LLM reasoning + weighted scoring + onboarding data integration
- **Impact**: Core selling point of project is undermined
- **Resolution**: Orchestrator v2 built with 5-signal weighted `DecisionEngine`, LLM reasoning via Groq/Gemini with key rotation, onboarding data integration (`target_role`, `primary_focus`). 8 new modules, ~2,500 lines. Commit `dc8f9ea`.

### Flaw 2: No Inter-Service Communication — ✅ FIXED (Feb 18-19)
- **Current**: ~~All services are isolated silos. Evaluator can't push to Orchestrator.~~
- **Needed**: Evaluator → Orchestrator feedback loop (at minimum synchronous HTTP call)
- **Impact**: "Career State Updates → Orchestrator Replans" loop is broken
- **Resolution**: Evaluator + Orchestrator v2 + Job Search all embedded in gateway (same process). Evaluator scores feed directly into `StateManager` → `DecisionEngine`. No HTTP hop needed. Commit `dc8f9ea`.

### Flaw 3: Project Studio is 100% Mock
- **File**: `backend/agents/project-studio/main.py` (101 lines)
- **Current**: Returns hardcoded JSON with `time.sleep()` delays
- **Impact**: Flagship "most unique" module doesn't work at all

### Flaw 4: Emotion Detection Decoupled
- **Current**: Separate Flask app (not FastAPI), separate port, not integrated with evaluation
- **Decision**: Make optional — works if running, gracefully skipped if not

### Flaw 5: Fat Gateway — Proxy Only — ✅ FIXED (Feb 18-19)
- **Current**: ~~Gateway is just an HTTP proxy, adds no value~~
- **Needed**: Auth validation, rate limiting, request correlation
- **Impact**: Security and observability gaps
- **Resolution**: Gateway now validates Supabase JWT, embeds orchestrator v2 (decision engine, circuit breakers, metrics), service health monitoring, request correlation via `decision_id`. Commits `dc8f9ea`, `781d0b3`.

### Flaw 6: No Circuit Breakers or Retries — ✅ FIXED (Feb 18-19)
- **Current**: ~~If any service is down, gateway returns raw error~~
- **Needed**: httpx retry with backoff, circuit breaker pattern
- **Impact**: Demo fragility — one service crash breaks everything
- **Resolution**: Per-service `CircuitBreaker` (CLOSED→OPEN→HALF_OPEN), `ServiceRegistry` with background health checks, latency tracking. Exposed at `/api/orchestrator/circuit-breakers` and `/api/orchestrator/services`. Commit `dc8f9ea`.

### Flaw 7: Frontend Bypasses Gateway
- **Current**: OrchestratorCard calls Supabase Edge Function directly, some components call services directly
- **Needed**: Consistent routing through gateway OR through Supabase Edge Functions (pick one)
- **Impact**: Inconsistent auth, CORS issues, hard to deploy

---

## 6. Module-by-Module Completion Audit

### Module 1: Agent Orchestrator — 95% Done ✅ (REBUILT Feb 18-19)
| Component | Status | Notes |
|-----------|--------|-------|
| Rule engine (rules.py) | ✅ Done | Legacy, kept as fallback |
| State management (state.py) | ✅ Done | Upsert + fetch from user_state |
| Memory system (shared/memory.py) | ✅ Done | 417 lines, full UserMemory class |
| API endpoints | ✅ Done | /next, /state, /memory, /metrics, /circuit-breakers, /services |
| Frontend OrchestratorCard | ✅ Done | Calls edge function, shows recommendation |
| Supabase Edge Function | ✅ Done | orchestrator-next checks onboarding + metrics |
| **LLM reasoning via Groq** | ✅ **DONE** | Groq/Gemini with 7+12 key rotation pool |
| **Weighted scoring with decay** | ✅ **DONE** | 5-signal engine: weakness 40%, rate 15%, recency 15%, goal 15%, pattern 15% |
| **Onboarding data integration** | ✅ **DONE** | Uses target_role, primary_focus for goal_alignment scoring |
| **Circuit breakers** | ✅ **NEW** | Per-service CLOSED→OPEN→HALF_OPEN state machine |
| **Service registry** | ✅ **NEW** | Background health monitoring with latency tracking |
| **Metrics system** | ✅ **NEW** | In-memory Counter + Histogram ring buffer |
| **Decision audit trail** | ✅ **NEW** | Persists to orchestrator_decisions table |
| **State lifecycle** | ✅ **NEW** | Enhanced StateManager with decision history |

### Module 2: Interactive Course Generation — 75% Done
| Component | Status | Notes |
|-----------|--------|-------|
| Backend service (1231 lines) | ✅ Done | Parallel generation with Gemini |
| API key pool management | ✅ Done | Semaphores for concurrency |
| Chapter generation | ✅ Done | Full content + quizzes + flashcards |
| Frontend CourseGenerator page | ✅ Done | UI complete |
| Frontend CourseDetailNew page | ✅ Done | Chapter rendering |
| Games generation | ✅ Done | Interactive learning games |
| "Think First" questions | ❌ Missing | Question before each chapter |
| Scenario-first teaching | ❌ Missing | Currently dumps content |

### Module 3: Project Studio — 15% Done
| Component | Status | Notes |
|-----------|--------|-------|
| Backend endpoint exists | ✅ Done | But 100% mock (101 lines) |
| Frontend page exists | ✅ Done | ProjectStudio.tsx + ProjectStudioDemo.tsx |
| Frontend shows agent cards | ✅ Done | Hardcoded static 5-agent display |
| Real LLM agent pipeline | ❌ Missing | Need 6 Groq-powered agents |
| Sequential real-time display | ❌ Missing | Show each agent's work as it completes |
| Agent 1: Idea Validator | ❌ Missing | |
| Agent 2: Market Researcher | ❌ Missing | |
| Agent 3: System Architect | ❌ Missing | |
| Agent 4: UI/UX Advisor | ❌ Missing | |
| Agent 5: Execution Planner | ❌ Missing | |
| Agent 6: Devil's Advocate | ❌ Missing | |

### Module 4: Production Thinking Interview — 70% Done
| Component | Status | Notes |
|-----------|--------|-------|
| Backend service (1208 lines) | ✅ Done | Technical/Aptitude/HR modes work |
| Journey state machine | ✅ Done | journey.py (454 lines) |
| Production Thinking mode | ✅ Partial | 3 hardcoded scenarios |
| 5-stage flow | ✅ Done | Clarification→Core→Followup→Curveball→Reflection |
| Frontend MockInterview page | ✅ Done | 1162 lines (has old commented code lines 1-570) |
| Frontend InterviewResult | ✅ Done | Shows scores |
| Dynamic scenario generation | ❌ Missing | Need Groq to generate scenarios |
| 6-metric alignment | ❌ Missing | Currently uses 5 different metrics |
| Evaluator integration | ❌ Partial | Evaluator scores but metrics don't match plan |

### Module 5: DSA Skill Mastery — 70% Done
| Component | Status | Notes |
|-----------|--------|-------|
| Backend service (1118 lines) | ✅ Done | Full CRUD + AI chatbot + feedback |
| AI chatbot for hints | ✅ Done | Groq-powered |
| Problem tracking | ✅ Done | Status, difficulty, completion |
| Analytics endpoint | ✅ Done | Topic-wise breakdown |
| Frontend DSASheet page | ✅ Done | Problem listing |
| Frontend DSATopic page | ✅ Done | Topic detail view |
| **MongoDB dependency** | ⚠️ Problem | Uses motor/MongoDB, needs Supabase migration |
| Hardcoded problem data | ⚠️ Problem | dsaProblems.ts (293 lines) in frontend |
| Visual algorithm stepper | ❌ Not planned | Decision: tracking + resources + AI chatbot instead |

### Module 6: Career Tracker — 45% Done
| Component | Status | Notes |
|-----------|--------|-------|
| Dashboard.tsx (972 lines) | ✅ Done | Tabs: overview, courses, DSA, interviews |
| Stats cards | ✅ Done | Basic metrics display |
| 6-metric TypeScript types | ✅ Done | Already defined in Dashboard.tsx |
| Evaluator pipeline | ✅ Done | Save interaction → LLM score → aggregate |
| User state table | ✅ Done | user_state with metric scores |
| Radar chart | ❌ Missing | Need recharts implementation |
| Line chart (trends) | ❌ Missing | Score over time |
| Progress bars per module | ❌ Missing | Completion tracking |
| History table | ❌ Missing | Past interactions list |
| Metric mismatch | ⚠️ Problem | Evaluator saves 5 old metrics, dashboard expects 6 new ones |

### Supporting Features
| Feature | Status | Notes |
|---------|--------|-------|
| Resume Analyzer | ✅ Done | 1199 lines, Docling + PyPDF2 + Groq |
| Profile Builder | ✅ Done | Profile service (959 lines) |
| Job Search | ✅ Done | Firecrawl + Groq matching |
| Supabase Auth | ✅ Done | Frontend login/signup works |
| Onboarding Flow | ✅ Done | 5-step wizard |
| Emotion Detection | ✅ Done | Flask + ViT (optional) |

### Overall Score: ~70% Complete (updated Feb 19)
| Category | Completion | Change |
|----------|-----------|--------|
| Backend Services | 70% | ↑ from 60% (orchestrator v2, embedded services) |
| Frontend Pages | 70% | — |
| Intelligence/AI Logic | 65% | ↑ from 35% (5-signal engine, LLM reasoning, key rotation) |
| Database/Migrations | 65% | — |
| Security/Config | 80% | ↑ from 30% (Supabase JWT, CORS, auth overhaul) |
| Deployment | 0% | — |
| **Overall** | **~70%** | **↑ from 55%** |

---

## 7. All 15 Design Decisions (Locked)

These were discussed and finalized — do NOT re-ask these questions.

### Decision 1: Onboarding
**Keep existing 5-step wizard as-is.** It works, saves to Supabase, has custom input. No changes needed.

### Decision 2: Orchestrator Intelligence
**Hybrid approach**: Rules engine routes to module (fast) + Groq LLM generates the explanation/reason (personalized). Rules determine WHAT, LLM explains WHY.

### Decision 3: Course "Think First" Feature
**Add ONE interactive question per chapter** — a scenario/question shown BEFORE the chapter content. User answers, then sees the chapter. Lightweight implementation, big UX impact.

### Decision 4: Project Studio Agents
**6 agents**: Idea Validator → Market Researcher → System Architect → UI/UX Advisor → Execution Planner → Devil's Advocate. All powered by Groq LLM.

### Decision 5: Project Studio Display
**Sequential real-time display** — show each agent's output as it completes (streaming feel). User sees Agent 1 output first, then Agent 2 appears below, etc.

### Decision 6: Agent Disagreement
**Skip disagreement for now.** Devil's Advocate agent provides the "challenge" perspective instead. Simpler to implement, same educational value.

### Decision 7: Interview Modes
**Keep all 3 existing modes** (Technical, Aptitude, HR) + **add Production Thinking** as 4th mode. Don't remove working features.

### Decision 8: Interview Scenarios
**Dynamic generation via Groq** — generate scenarios based on user's target_role from onboarding. Keep 3 hardcoded scenarios as fallback if Groq fails.

### Decision 9: Evaluation Metrics
**Update to 6 metrics** matching the project plan:
1. `clarification_habit` — Does user ask clarifying questions?
2. `structure` — Is the answer well-organized?
3. `tradeoff_awareness` — Does user consider alternatives?
4. `scalability_thinking` — Does user think at scale?
5. `failure_awareness` — Does user consider failure modes?
6. `adaptability` — Can user handle curveballs?

### Decision 10: DSA Module Approach
**No visual algorithm stepper.** Instead: problem tracking (status, difficulty) + curated resources (LeetCode links) + AI chatbot for hints/explanations. This is realistic and doable in 2 weeks.

### Decision 11: DSA Problem Data
**Fixed JSON dataset seeded into Supabase.** Migrate the hardcoded TypeScript array (dsaProblems.ts) into a Supabase table. No dynamic problem generation.

### Decision 12: Career Tracker Charts
**5 chart types** using Recharts:
1. Radar chart — 6 metrics overview
2. Line chart — score trends over time
3. Progress bars — per-module completion
4. Completion donut — overall progress
5. History table — past interactions with scores

### Decision 13: Resume + Profile
**Keep as supporting features.** They work. Minor polish only (fix auth token sending, error handling).

### Decision 14: Job Search
**Keep as bonus feature.** Works with Firecrawl. No changes needed unless time permits.

### Decision 15: Emotion Detection
**Make optional.** If Flask server is running, use it. If not, skip gracefully. Don't block any feature on emotion detection.

---

## 8. 14-Day Sprint Plan

**Core Philosophy**: Fix what's 55% done, not rebuild from scratch.  
**Total**: ~79 hours over 14 days = ~5.6 hours/day  
**Key Principle**: Working React frontend + Python backend already exist. We're enhancing intelligence, not replacing infrastructure.

---

### PHASE 1: CRITICAL FIXES (Days 1-3) — ✅ Day 1-2 COMPLETE

#### Day 1: Security & Config Cleanup (8 hours) — ✅ DONE (Feb 19, commit 781d0b3)

| # | Task | Files | Fixes Bugs | Status |
|---|------|-------|------------|--------|
| 1 | Remove hardcoded secrets, move to env vars | `api-gateway/main.py` | Bug 3 | ✅ Done |
| 2 | Fix CORS — specific origins only | `api-gateway/main.py` | Bug 1 | ✅ Done |
| 3 | Remove fake `/auth/signin` and `/auth/signup` | `api-gateway/main.py` | Bug 4, 5 | ✅ Done |
| 4 | Validate Supabase JWT in gateway instead | `api-gateway/main.py` | Bug 4 | ✅ Done |
| 5 | Protect all `/api/*` endpoints with auth middleware | `api-gateway/main.py` | Bug 8 | ✅ Done |
| 6 | Fix frontend to send Supabase auth token | `gatewayAuthService.ts`, `useAuth.ts` | Bug 7 | ✅ Done |
| 7 | Verify all Supabase tables exist | Supabase dashboard | — | Pending |
| 8 | MongoDB → Supabase migration for DSA | `dsa-service/main.py` | — | Pending |
| 9 | Seed DSA problems from `dsaProblems.ts` into Supabase | New migration SQL | — | Pending |
| 10 | Fix port mismatch in frontend config | `src/configs/backendConfig.ts` | Bug 6 | Pending |
| 11 | Remove non-existent service reference | `api-gateway/main.py` | Bug 10 | Pending |

**Success Criteria**:
- No console errors on login
- All API endpoints return valid responses with auth
- DSA problems load from Supabase

#### Day 2: Orchestrator Intelligence Upgrade (6 hours) — ✅ DONE (Feb 18-19, commit dc8f9ea)

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Add LLM reasoning layer after rule engine (Groq explains WHY) | `orchestrator/engine.py` + 7 new files | ✅ Done |
| 2 | Add weighted scoring — recent activities × 1.5, exponential decay | `orchestrator/engine.py` — 5-signal weighted engine | ✅ Done |
| 3 | Fetch + integrate onboarding data (target_role, focus) | `orchestrator/engine.py` — goal_alignment signal | ✅ Done |
| 4 | Update edge function to pass onboarding context | Embedded in gateway, no edge function needed | ✅ Done |

**Implementation pattern**:
```python
# After rules.py determines module
def explain_recommendation(module, metrics, user_goal):
    prompt = f"""You are a career coach. Explain why this user should focus on {module}.
    User goal: {user_goal}
    Recent metrics: {metrics}
    Write 2 sentences: 1) What pattern you noticed 2) Why this module will help.
    Be specific and encouraging."""
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150
    )
    return response.choices[0].message.content
```

**Success Criteria**:
- Orchestrator card shows human-readable explanation (not raw `clarity_avg (0.35) < 0.4`)
- Recommendations change based on recent performance
- Onboarding preferences influence routing

#### Day 3: Interview Metrics Alignment (4 hours)

| # | Task | Files |
|---|------|-------|
| 1 | Update evaluator scoring to 6 new metrics | `evaluator/main.py`, `evaluator/scorer.py`, `evaluator/prompts.py` |
| 2 | Add recency-weighted scoring (exponential decay) | `evaluator/aggregator.py` |
| 3 | Database migration: rename/add metric columns | New Supabase migration |
| 4 | Update Dashboard to display 6 metrics correctly | `src/pages/Dashboard.tsx` |

**Metric mapping**:
| Old | → New | Action |
|-----|-------|--------|
| clarity | clarification_habit | Rename + adjust prompt |
| (none) | structure | NEW |
| tradeoffs | tradeoff_awareness | Rename |
| (none) | scalability_thinking | NEW |
| failure_awareness | failure_awareness | Keep |
| adaptability | adaptability | Keep |
| dsa_predict | (removed) | Drop |

**Success Criteria**:
- Interview results show 6 metrics with correct names
- Dashboard displays updated metrics
- Old data migrated to new schema

---

### PHASE 2: PROJECT STUDIO — THE BIG ONE (Days 4-6)

#### Day 4: Backend Agent Pipeline (8 hours)

| # | Task | Files |
|---|------|-------|
| 1 | Create 6 agent prompt templates | `project-studio/main.py` (rewrite) |
| 2 | Build sequential execution with context passing | `project-studio/main.py` |
| 3 | Create `project_studio_sessions` table | New Supabase migration |
| 4 | Save each agent output to DB for real-time display | `project-studio/main.py` |
| 5 | Add error handling — partial results if agent fails | `project-studio/main.py` |

**Agent pipeline**:
```
User Input → Idea Analyst → Research Agent → System Design Agent
→ UI/UX Agent → Execution Planner → Devil's Advocate
```
Each agent receives context from ALL previous agents.

**Agent prompt templates**:
```python
AGENT_PROMPTS = {
    "idea_analyst": """You are a senior product manager reviewing a project idea.
    User said: {user_input}
    Ask 3 clarifying questions:
    1. Who is the target user?
    2. What problem does this solve?
    3. Why is this better than existing solutions?
    If the idea is too vague, reject it politely and suggest improvements.""",
    
    "research_agent": """Previous analysis: {idea_analysis}
    Research similar products. Find 2-3 competitors.
    Explain what they do well and what they miss.
    Suggest scope that's achievable in 6-8 weeks.""",
    
    "system_design_agent": """Project: {project_summary}
    Design high-level architecture:
    - Key APIs needed
    - Database schema (tables only)
    - 2-3 major trade-offs
    Keep it simple. This is for a student project.""",
    
    "uiux_agent": """Design 3-5 core screens.
    For each: screen name, main user action, key UI elements.""",
    
    "execution_planner": """Create a 6-week plan:
    Week 1-2, Week 3-4, Week 5-6.
    Be realistic. This is a solo developer.""",
    
    "devils_advocate": """Review the entire plan above.
    Point out 2-3 risks:
    - What might go wrong?
    - What's being underestimated?
    - What should be cut to save time?
    Be constructive, not discouraging."""
}
```

**Success Criteria**:
- All 6 agents run sequentially with Groq
- Each agent receives context from previous agents
- Output stored in Supabase `project_studio_sessions` table

#### Day 5: Project Studio Frontend (6 hours)

| # | Task | Files |
|---|------|-------|
| 1 | Replace demo component with real implementation | `ProjectStudio.tsx` |
| 2 | Subscribe to Supabase Realtime for agent updates | `ProjectStudio.tsx` |
| 3 | Show agents appearing one by one as they complete | `ProjectStudio.tsx` |
| 4 | Add loading states per agent | New `AgentCard` component |
| 5 | Add "Save Project Plan" button | `ProjectStudio.tsx` |

**Success Criteria**:
- User can input project idea
- Agents appear one by one as they complete
- Output is readable and formatted
- User can save the plan

#### Day 6: Project Studio Polish (4 hours)

| # | Task |
|---|------|
| 1 | Add "Example Ideas" button (pre-filled prompts) |
| 2 | Handle errors gracefully ("Agent timed out, retrying...") |
| 3 | Add "Start Over" button |
| 4 | Test with 3-5 different project ideas |
| 5 | Fix any broken agents |

---

### PHASE 3: COURSE INTERACTIVITY (Day 7)

#### Day 7: "Think First" Questions (6 hours)

| # | Task | Files |
|---|------|-------|
| 1 | Update course generation to include scenario question per chapter | `course-generation/main.py` |
| 2 | Update frontend to show scenario BEFORE content | `CourseDetailNew.tsx` |
| 3 | Regenerate one sample course with new format | Manual test |

**Pattern**: Each chapter gets `scenario_question` + `options` shown first. User answers, THEN sees `explanation` + `followup_question`.

**Success Criteria**:
- New courses have "Think First" scenarios
- User must answer before seeing content
- Follow-up questions appear after explanation

---

### PHASE 4: CAREER TRACKER VISUALIZATIONS (Days 8-9)

#### Day 8: Radar Chart — 6 Metrics (4 hours)

| # | Task | Files |
|---|------|-------|
| 1 | Build RadarChart component with Recharts | New component |
| 2 | Fetch latest metrics from `interview_metrics` table | `Dashboard.tsx` |
| 3 | Color-code: red < 40%, yellow 40-70%, green > 70% | Component styling |
| 4 | Integrate into Dashboard overview tab | `Dashboard.tsx` |

#### Day 9: Trend Lines & History (5 hours)

| # | Task |
|---|------|
| 1 | Score Trend Over Time — line chart (X: dates, Y: avg score) |
| 2 | Module Completion Progress — horizontal bar chart |
| 3 | Orchestrator History — timeline of recommendations with reasons |

**Success Criteria**:
- All charts render without errors
- Charts update with real data
- UI is clean and readable

---

### PHASE 5: POLISH & TESTING (Days 10-12)

#### Day 10: Dynamic Interview Scenarios (4 hours)

| # | Task | Files |
|---|------|-------|
| 1 | Generate scenarios via Groq based on target_role | `interview-coach/journey.py` |
| 2 | Keep 3 hardcoded scenarios as fallback | `interview-coach/journey.py` |
| 3 | Clean up 570 lines of dead code in MockInterview.tsx | `src/pages/MockInterview.tsx` |

**Success Criteria**:
- Each interview gets a unique scenario matching user's career goal
- Fallback to hardcoded if generation fails

#### Day 11: End-to-End Testing (8 hours)

**Test every critical path** (record with Loom):
1. Onboarding → Dashboard → Orchestrator recommendation (15 min)
2. Course Generation → Interactive Chapter → Quiz (20 min)
3. Project Studio → 6 agents → Save plan (30 min)
4. Interview → All modes → Results → Dashboard update (45 min)
5. DSA → Solve problem → AI hint → Track progress (15 min)

Fix bugs immediately as found.

#### Day 12: UI Polish (6 hours)

| # | Task |
|---|------|
| 1 | Consistent styling across all pages |
| 2 | Add loading skeletons (not just spinners) |
| 3 | Improve error messages ("Generation failed. Try again?" not "Error 500") |
| 4 | Add tooltips for complex UI elements |
| 5 | Basic mobile responsiveness check |

---

### PHASE 6: DEMO PREPARATION (Days 13-14)

#### Day 13: Demo Script (4 hours)

**7-minute demo flow**:
1. **Intro** (30s): "This is StudyMate, an agentic career platform"
2. **Onboarding** (1min): Show how system learns about user
3. **Orchestrator** (1min): "System recommends Interview Module because user struggles with trade-offs"
4. **Project Studio** (2min): Input idea → 6 agents → final plan
5. **Interview** (2min): Show Production Thinking flow with clarification → curveball
6. **Dashboard** (30s): Show radar chart, trends, growth

Practice 3 times, timing each section.

#### Day 14: Deploy & Backup (6 hours)

**Morning**:
1. Deploy frontend to Vercel
2. Deploy backend to Railway/Render
3. Test deployed version
4. Fix environment variable issues

**Afternoon**:
1. Create backup database export
2. Record full demo video (backup if live demo fails)
3. Prepare 3-slide presentation:
   - Slide 1: Problem (students don't think like engineers)
   - Slide 2: Solution (agentic system that questions & adapts)
   - Slide 3: Architecture (6 modules, orchestrator brain)

---

### Daily Time Summary

| Day | Focus | Hours | Critical? |
|-----|-------|-------|-----------|
| 1 | Security & Config & DSA Migration | 8 | 🔴 YES |
| 2 | Orchestrator Intelligence | 6 | 🔴 YES |
| 3 | Interview Metrics Alignment | 4 | 🟡 MEDIUM |
| 4 | Project Studio Backend | 8 | 🔴 YES |
| 5 | Project Studio Frontend | 6 | 🔴 YES |
| 6 | Project Studio Polish | 4 | 🟡 MEDIUM |
| 7 | Course Interactivity | 6 | 🟡 MEDIUM |
| 8 | Career Tracker — Radar Chart | 4 | 🟡 MEDIUM |
| 9 | Career Tracker — Trends & History | 5 | 🟢 NICE-TO-HAVE |
| 10 | Dynamic Interview Scenarios | 4 | 🟢 NICE-TO-HAVE |
| 11 | End-to-End Testing | 8 | 🔴 YES |
| 12 | UI Polish | 6 | 🟡 MEDIUM |
| 13 | Demo Script & Practice | 4 | 🔴 YES |
| 14 | Deploy & Backup | 6 | 🔴 YES |
| | **Total** | **79** | |

### Risk Mitigation — If You Fall Behind

**Cut these (in priority order)**:
1. Day 10: Dynamic scenarios → use 3 hardcoded ones
2. Day 9: Extra charts → keep only radar chart
3. Day 12: UI polish → functional > pretty
4. Day 6: Project Studio edge cases

**NEVER cut**:
- Security fixes (Day 1)
- Project Studio core (Days 4-5)
- Testing (Day 11)
- Demo prep (Day 13)

### Final Checklist (Day 14 Evening)

- [ ] All 6 modules load without errors
- [ ] Orchestrator gives smart recommendations with LLM reasoning
- [ ] Project Studio runs end-to-end with real Groq calls
- [ ] Interviews show 6 metrics correctly
- [ ] Dashboard displays at least radar chart
- [ ] Demo script is under 8 minutes
- [ ] Backup video recorded
- [ ] Deployed version is live and accessible
- [ ] Database is backed up

### Demo Must Prove 3 Things

1. **Agentic Behavior**: System questions user, adapts recommendations
2. **Production Thinking**: Interviews force clarification, trade-offs, failure awareness
3. **Real LLM Integration**: Not hardcoded responses, actual AI agents

---

## 9. Constraints & Context

| Constraint | Value |
|------------|-------|
| **Budget** | Free-tier APIs ONLY (Groq, Gemini free, Supabase free) |
| **LLM Provider** | Groq primary (llama-3.3-70b-versatile), Gemini for courses |
| **Database** | Supabase PostgreSQL only (migrate MongoDB out) |
| **Deployment** | Vercel/Netlify (frontend) + Railway/Render (backend) |
| **Timeline** | 2 weeks (~14 days) |
| **Team** | Solo developer |
| **Work Style** | File-by-file approval (show changes, get approval, then next) |
| **Project Type** | College final year, 12-credit |
| **No** | Judge0, Docker sandbox, WebRTC, mobile app, social features |

---

## 10. File Map (Key Files)

### Backend — Core
| File | Lines | Purpose |
|------|-------|---------|
| `backend/api-gateway/main.py` | ~1650 | Central API gateway + embedded orchestrator v2 + evaluator + job search |
| `backend/orchestrator/main.py` | 311 | Orchestrator API endpoints (legacy standalone) |
| `backend/orchestrator/main_v2.py` | ~200 | Orchestrator v2 standalone FastAPI app |
| `backend/orchestrator/engine.py` | ~350 | **NEW** — 5-signal weighted DecisionEngine |
| `backend/orchestrator/config.py` | ~200 | **NEW** — ModuleDefinition, EngineConfig, MODULES registry |
| `backend/orchestrator/models.py` | ~150 | **NEW** — Pydantic models (Decision, SkillScores, UserState) |
| `backend/orchestrator/circuit_breaker.py` | ~100 | **NEW** — Per-service circuit breaker state machine |
| `backend/orchestrator/service_registry.py` | ~150 | **NEW** — Background health monitoring |
| `backend/orchestrator/metrics.py` | ~200 | **NEW** — Counter + Histogram ring buffer |
| `backend/orchestrator/state_manager.py` | ~200 | **NEW** — Enhanced state lifecycle + audit trail |
| `backend/orchestrator/rules.py` | ~100 | Deterministic rule engine (legacy fallback) |
| `backend/orchestrator/state.py` | ~100 | User state CRUD |
| `backend/evaluator/main.py` | 247 | Evaluation pipeline |
| `backend/evaluator/scorer.py` | ~150 | LLM scoring via Groq |
| `backend/evaluator/aggregator.py` | ~100 | Score aggregation |
| `backend/evaluator/prompts.py` | ~50 | LLM prompt templates |
| `backend/shared/memory.py` | 417 | UserMemory class |
| `backend/shared/database/supabase_connection.py` | ~50 | DB connection (has hardcoded URL!) |

### Backend — Agents
| File | Lines | Purpose |
|------|-------|---------|
| `backend/agents/interview-coach/main.py` | 1208 | Interview simulation |
| `backend/agents/interview-coach/journey.py` | 454 | Production thinking state machine |
| `backend/agents/resume-analyzer/main.py` | 1199 | Resume parsing + analysis |
| `backend/agents/dsa-service/main.py` | 1118 | DSA tracking (MongoDB!) |
| `backend/agents/course-generation/main.py` | 1231 | Course gen with Gemini |
| `backend/agents/profile-service/main.py` | 959 | User profile management |
| `backend/agents/project-studio/main.py` | 101 | **100% MOCK — needs complete rebuild** |
| `backend/agents/job-search/main.py` | 136 | Job search with Firecrawl |
| `backend/agents/emotion-detection/app.py` | 444 | Flask + ViT (optional) |

### Frontend — Pages
| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/Dashboard.tsx` | 972 | Main dashboard + career tracker |
| `src/pages/MockInterview.tsx` | 1162 | Interview UI (570 lines commented out!) |
| `src/pages/CourseGenerator.tsx` | ~300 | Course creation |
| `src/pages/CourseDetailNew.tsx` | ~400 | Chapter viewer |
| `src/pages/ProjectStudio.tsx` | ~200 | Project studio UI |
| `src/pages/DSASheet.tsx` | ~300 | Problem listing |
| `src/pages/DSATopic.tsx` | ~200 | Topic detail |
| `src/pages/ResumeAnalyzer.tsx` | ~300 | Resume upload + results |
| `src/pages/ProfileBuilder.tsx` | ~300 | Profile editing |
| `src/pages/Onboarding.tsx` | ~450 | 5-step wizard |
| `src/pages/Auth.tsx` | ~551 | Login/signup + duplicate email detection |

### Frontend — Key Components
| File | Purpose |
|------|---------|
| `src/components/OrchestratorCard.tsx` | AI recommendation display (325 lines) |
| `src/components/ProtectedRoute.tsx` | Auth + onboarding gate |
| `src/components/ProjectStudioDemo.tsx` | Static hardcoded agent cards |

### Frontend — Config & API
| File | Purpose | Issues |
|------|---------|--------|
| `src/lib/api.ts` | Centralized API client | ~~Missing auth token~~ Sends Supabase JWT |
| `src/api/services/gatewayAuthService.ts` | Gateway auth service | **REWRITTEN** — uses Supabase access_token |
| `src/configs/environment.ts` | API_GATEWAY_URL | Hardcoded localhost:8000 |
| `src/configs/backendConfig.ts` | Service ports | DSA port wrong (8002 vs 8004) |

### Frontend — Data (Hardcoded)
| File | Lines | Purpose |
|------|-------|---------|
| `src/data/dsaProblems.ts` | 293 | Hardcoded problem array |
| `src/data/companyProblems.ts` | ~100 | Company-wise problems |
| `src/data/cseSuggestions.ts` | ~50 | Course suggestions |

### Database
| Path | Purpose |
|------|---------|
| `supabase/migrations/` | 30+ SQL migration files |
| `supabase/functions/orchestrator-next/` | Edge function for orchestrator |
| `supabase/functions/generate-feedback-suggestions/` | Edge function |
| `supabase/functions/youtube-recommendations/` | Edge function |
| `supabase/functions/course-generator-agent/` | Edge function |
| `supabase/functions/generate-course-content/` | Edge function |
| `supabase/functions/dsa-intelligent-search/` | Edge function |
| `database/oboe_course_migration.sql` | Course schema |

---

## 11. What Works Right Now

These features are functional and tested (or close to it):

1. **Supabase Auth** — Login/signup via frontend works
2. **Onboarding Flow** — 5-step wizard saves to Supabase
3. **Dashboard Layout** — Tabs, stats cards, orchestrator card displays
4. **Orchestrator v2** — 5-signal weighted engine with LLM reasoning, circuit breakers, metrics
5. **OrchestratorCard** — Shows recommendation, navigates to module
6. **Course Generation** — Parallel generation with Gemini (chapters, quizzes, flashcards, games)
7. **Interview Coach** — Technical/Aptitude/HR modes with AI responses
8. **Production Thinking Journey** — 5-stage flow works (with 3 hardcoded scenarios)
9. **Resume Analyzer** — Upload PDF → Docling parse → Groq analysis → results
10. **Profile Builder** — Profile CRUD via profile service
11. **Job Search** — Firecrawl web scraping + Groq matching
12. **DSA Service** — Problem CRUD + AI chatbot (BUT requires MongoDB)
13. **Evaluator Pipeline** — Score answers via Groq, aggregate to user_state
14. **Memory System** — UserMemory tracks behavior patterns
15. **6 Edge Functions** — Deployed to Supabase

---

## 12. What Is Completely Missing

These must be built from scratch:

1. **Project Studio real pipeline** — 6 Groq-powered agents (currently 100% mock)
2. ~~**LLM reasoning in orchestrator**~~ — ✅ **DONE** (Feb 18-19, commit dc8f9ea)
3. **Recency-weighted scoring** — Evaluator uses all-time average (unfair)
4. **6-metric alignment** — Evaluator uses 5 old metrics, plan requires 6 new ones
5. **Dynamic interview scenarios** — All 3 current scenarios are hardcoded
6. **"Think First" questions** — No interactive pre-chapter questions
7. **Career tracker charts** — No radar, line, progress, or history visualizations
8. ~~**Evaluator → Orchestrator loop**~~ — ✅ **DONE** (embedded in same process, commit dc8f9ea)
9. ~~**Security layer**~~ — ✅ **DONE** (Supabase JWT validation, CORS fix, commit 781d0b3)
10. **Deployment** — No Dockerfiles, no cloud deployment, localhost only
11. **MongoDB → Supabase migration** — DSA service still on MongoDB
12. ~~**Frontend auth token sending**~~ — ✅ **DONE** (gatewayAuthService rewritten, commit 781d0b3)

---

## Appendix: Metric Mapping

### Current (Evaluator saves these)
```
clarity, tradeoffs, adaptability, failure_awareness, dsa_predict
```

### Target (Project plan requires these)
```
clarification_habit, structure, tradeoff_awareness, scalability_thinking, failure_awareness, adaptability
```

### Migration Plan
| Old Metric | → New Metric | Notes |
|-----------|-------------|-------|
| clarity | clarification_habit | Rename + adjust prompt |
| (none) | structure | NEW — add to scoring prompt |
| tradeoffs | tradeoff_awareness | Rename |
| (none) | scalability_thinking | NEW — add to scoring prompt |
| failure_awareness | failure_awareness | Keep |
| adaptability | adaptability | Keep |
| dsa_predict | (removed) | Drop — not in project plan |

---

## Appendix: Environment Variables Needed

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://...
SUPABASE_JWT_SECRET=your-supabase-jwt-secret  # NEW — required for gateway JWT validation

# LLM
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
OPENROUTER_API_KEY=your-openrouter-key

# Optional Services
FIRECRAWL_API_KEY=your-firecrawl-key
ELEVENLABS_API_KEY=your-elevenlabs-key
BRAVE_API_KEY=your-brave-key

# Frontend (Vite)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_GATEWAY_URL=http://localhost:8000

# Deployment
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.vercel.app
```

---

*This document was generated from a comprehensive codebase audit and multi-session planning conversation. All decisions are final unless explicitly revisited.*
