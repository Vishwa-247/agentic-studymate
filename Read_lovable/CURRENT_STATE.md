# StudyMate - Current State

> **For Any AI Agent**: This file is updated after each implementation phase. For the FULL context (bugs, decisions, implementation plan), read `MASTER_PLAN.md` first.

**Last Updated**: 2026-02-19  
**Updated By**: Copilot (Post Orchestrator v2 + Auth Security Overhaul)  
**Phase**: Phase 2 complete — Orchestrator v2 production build + Auth security overhaul done  
**Overall Completion**: ~70%

---

## ⚠️ IMPORTANT: Read MASTER_PLAN.md

The comprehensive document `Read_lovable/MASTER_PLAN.md` contains:
- All 10 critical bugs found (5 now FIXED)
- All 7 architectural flaws (4 now FIXED)
- All 15 design decisions (locked)
- Full 5-phase implementation plan with day-by-day tasks
- Complete module-by-module audit with % completion
- File map with line counts
- Environment variables needed
- Metric mapping (old → new)

**Read that file for the complete picture. This file is a quick status snapshot.**

---

## Quick Status Snapshot (Feb 19, 2026)

| Module | Completion | Key Gap | Changed? |
|--------|-----------|---------|----------|
| 1. Orchestrator | **95%** | Frontend card may need minor updates for new response shape | ✅ REBUILT |
| 2. Course Gen | 75% | No "Think First" questions | — |
| 3. Project Studio | 15% | 100% mock — needs complete rebuild | — |
| 4. Interview | 70% | Hardcoded scenarios, wrong metrics | — |
| 5. DSA | 70% | MongoDB dependency, needs migration | — |
| 6. Career Tracker | 45% | No charts, metric mismatch | — |
| Security/Config | **80%** | Need to set SUPABASE_JWT_SECRET env var | ✅ FIXED |
| Deployment | 0% | Localhost only | — |

---

## ✅ Phase 2: Orchestrator v2 + Auth Security — COMPLETED (Feb 19, 2026)

### What Was Built (Feb 18-19, 2026)

#### 1. Production Orchestrator v2 (Complete Rebuild)

The orchestrator was completely rebuilt from a simple if-elif rule engine into a **production-grade weighted multi-signal decision engine** with system design patterns.

**New Files Created (8 modules, ~2,500 lines):**
- `backend/orchestrator/config.py` — Module registry, EngineConfig, skill dimensions, goal-role weight maps
- `backend/orchestrator/models.py` — Pydantic models (Decision, SkillScores, UserState, ModuleScore, etc.)
- `backend/orchestrator/engine.py` — Weighted 5-signal decision engine (core logic)
- `backend/orchestrator/circuit_breaker.py` — Per-service circuit breaker (CLOSED→OPEN→HALF_OPEN FSM)
- `backend/orchestrator/service_registry.py` — Service discovery + background health monitoring
- `backend/orchestrator/metrics.py` — In-memory Counter + Histogram with ring buffer
- `backend/orchestrator/state_manager.py` — Enhanced state lifecycle with decision history
- `backend/orchestrator/main_v2.py` — Standalone FastAPI app (port 8011)

**Updated Files:**
- `backend/orchestrator/__init__.py` — Exports for all new modules
- `backend/api-gateway/main.py` — Major refactor: integrated orchestrator v2 engine directly

**Architecture — 5 Scoring Signals:**

| Signal | Weight | Description |
|--------|--------|-------------|
| Weakness Severity | 40% | How far below threshold are relevant skills? |
| Rate of Change | 15% | Is the user improving or degrading? |
| Recency | 15% | When did user last visit this module? |
| Goal Alignment | 15% | Does module match user's target career role? |
| Pattern Signal | 15% | Memory patterns (repeated struggles, breakthroughs) |

**System Design Patterns Implemented:**

| Pattern | Implementation |
|---------|---------------|
| Circuit Breaker | Per-service 3-state FSM, prevents cascading failures |
| Service Registry | Background health checks with latency tracking |
| Event Sourcing | `orchestrator_decisions` audit trail table |
| Observer Pattern | In-memory metrics (no external deps) |
| Strategy Pattern | Pluggable scoring signals with configurable weights |
| Graceful Degradation | Fallback defaults when DB/LLM/services unavailable |
| Diversity Filter | Prevents N consecutive same-module recommendations |

**New API Endpoints Added:**
- `GET /api/orchestrator/metrics` — Decision latency, module distribution, error rates
- `GET /api/orchestrator/circuit-breakers` — Per-service circuit breaker status
- `GET /api/orchestrator/services` — Service health registry

**Decision Pipeline (7 steps):**
```
1. Fetch User State → 2. Fetch Memory Context → 3. Check Service Health
→ 4. Score All Candidates (5 signals) → 5. LLM Generates Reason
→ 6. Persist Decision → 7. Update Metrics
```

**Commits:**
- `dc8f9ea` — `feat: production orchestrator v2 — weighted multi-signal engine, circuit breakers, health monitoring, metrics`

#### 2. Auth Security Overhaul

**Problem 1: Duplicate email signup** — Supabase returns empty `identities[]` when email exists with email-confirmation enabled. No error thrown, no email sent, but frontend showed "Check your email" toast.

**Problem 2: Dual auth (password:'demo' backdoor)** — `gatewayAuthService.ts` called gateway `/auth/signin` with `password: 'demo'` for every user. Gateway accepted any credentials and issued JWT.

**Problem 3: CORS wildcard** — `allow_origins=["*"]` allowed any origin.

**Problem 4: Google OAuth disabled** — OAuth client disabled in Google Cloud Console (error 401: `disabled_client`).

**Files Changed:**
- `src/hooks/useAuth.ts` — Added `identities[]` length check after signUp; caches Supabase token on SIGNED_IN
- `src/pages/Auth.tsx` — Catches `ACCOUNT_EXISTS` error, switches to login tab, pre-fills email
- `src/api/services/gatewayAuthService.ts` — Complete rewrite: uses Supabase access_token directly (no more `password:'demo'`)
- `backend/api-gateway/main.py` — `verify_token()` validates Supabase JWT first (via `SUPABASE_JWT_SECRET`), legacy fallback second; CORS now uses specific origins; `/auth/signup` returns 410 Gone; `/auth/signin` validates Supabase token

**Commits:**
- `781d0b3` — `fix: auth security overhaul — eliminate dual JWT, detect duplicate signups, fix CORS`

**⚠️ Manual Step Required:**
- Add `SUPABASE_JWT_SECRET` to backend `.env` (from Supabase Dashboard → Settings → API → JWT Secret)
- Re-enable Google OAuth client in Google Cloud Console (if Google sign-in desired)

---

## ✅ Phase 1: Foundation - COMPLETED (Jan 2026)

### What Was Built (Jan 20, 2026)

#### 1. User Onboarding Flow
**Files Created:**
- `src/pages/Onboarding.tsx` - 5-step wizard with custom input support
- `src/hooks/useOnboardingGuard.ts` - Onboarding completion check
- `supabase/migrations/20260120_user_onboarding.sql` - Database table

**Features:**
- ✅ 5 personalization questions (role, focus, experience, hours, learning mode)
- ✅ Custom input option for all questions (user can type their own answers)
- ✅ Progress bar with step indicators
- ✅ Modern UI matching app theme (Electric Indigo primary)
- ✅ Saved to Supabase with RLS policies
- ✅ Global onboarding gate in `ProtectedRoute`
- ✅ Redirects incomplete users to `/onboarding`

#### 2. Orchestrator v0 Integration
**Files Created:**
- `src/components/OrchestratorCard.tsx` - AI recommendation display

**Files Modified:**
- `src/pages/Dashboard.tsx` - Added OrchestratorCard at top
- `src/components/ProtectedRoute.tsx` - Added onboarding gate logic
- `src/App.tsx` - Added `/onboarding` route

**Features:**
- ✅ Dashboard shows "Recommended Next Step" from Orchestrator
- ✅ Calls `localhost:8011` via Gateway (`localhost:8000`)
- ✅ Module-to-route mapping (interview → `/mock-interview`, etc.)
- ✅ Premium UI with loading/error states
- ✅ "Start" button navigates to recommended module

#### 3. Database
- ✅ `user_onboarding` table created with RLS
- ✅ Stores: `target_role`, `primary_focus`, `experience_level`, `hours_per_week`, `learning_mode`, `completed_at`
- ✅ **Migration Status**: File created, **needs to be applied** via `npx supabase db push`

---

## What's Built & Working

### ✅ Frontend (React + TypeScript)
- **Onboarding**: 5-step wizard with custom inputs
- **Auth page**: Supabase authentication ⭐ FIXED (duplicate email detection, no more dual auth)
- **Dashboard**: Layout + OrchestratorCard integration
- **Course Generator**: UI complete, connects to backend
- **Mock Interview**: Full UI with WebSocket support
- **Resume Analyzer**: UI complete
- **DSA Sheet**: Basic listing page

**Location**: `src/pages/`, `src/components/`

### ✅ Backend Services (Python FastAPI)

| Service | Port | Status | Location |
|---------|------|--------|----------|
| **Gateway** | 8000 | ✅ Working (auth fixed) ⭐ | `backend/api-gateway/` |
| **Orchestrator** | 8000 | ✅ **v2 Production** (embedded in gateway) ⭐ | `backend/orchestrator/` |
| **Evaluator** | 8000 | ✅ Working (embedded in gateway) | `backend/evaluator/` |
| **Job Search** | 8000 | ✅ Working (embedded in gateway) | `backend/api-gateway/` |
| Course Generation | 8008 | ✅ Working | `backend/agents/course-generation/` |
| Interview Coach | 8002 | ✅ Working | `backend/agents/interview-coach/` |
| Resume Analyzer | 8003 | ✅ Working | `backend/agents/resume-analyzer/` |
| Profile Service | 8006 | ✅ Working | `backend/agents/profile-service/` |
| DSA Service | 8004 | ⚠️ Uses MongoDB | `backend/agents/dsa-service/` |
| Project Studio | 8012 | ❌ 100% Mock | `backend/agents/project-studio/` |
| Emotion Detection | 5001 | ✅ Optional (Flask) | `backend/agents/emotion-detection/` |

**Orchestrator v2 (Production):**
- Weighted 5-signal scoring engine (weakness severity 40%, rate of change 15%, recency 15%, goal alignment 15%, pattern 15%)
- Circuit breakers per service (CLOSED→OPEN→HALF_OPEN state machine)
- Background health monitoring with latency tracking
- In-memory metrics (Counter + Histogram ring buffer)
- Decision audit trail (`orchestrator_decisions` table)
- LLM-generated human-readable reasons (Groq/Gemini with key rotation)
- Returns `{ next_module, reason, description, confidence, depth, decision_id }`

### ✅ Database (Supabase)
- 27 migrations (26 existing + 1 new `user_onboarding`)
- Tables: users, courses, interviews, user_state, **user_onboarding** ⭐ NEW
- Edge functions deployed

---

## What's NOT Built (Critical Gaps) — See MASTER_PLAN.md for full details

### ✅ Module 1: Agent Orchestrator (95%) — DONE
- **Current**: ✅ Production v2 — weighted 5-signal engine, circuit breakers, health monitoring, metrics, LLM reasoning
- **Remaining**: Minor frontend OrchestratorCard tweaks for new response fields (confidence, depth)

### 🟡 Module 2: Interactive Courses (75%)
- **Current**: Full parallel generation with Gemini works
- **Missing**: "Think First" interactive question before each chapter
- **Needs**: Phase 3 — Add scenario question per chapter (Decision 3)

### 🔴 Module 3: Project Studio (15%)
- **Current**: 100% mock backend (101 lines, hardcoded JSON with time.sleep)
- **Missing**: All 6 real LLM-powered agents
- **Needs**: Phase 3 — Complete rebuild with Groq (Decision 4, 5, 6)

### 🟡 Module 4: Production Interviews (70%)
- **Current**: 3 hardcoded scenarios, 5-stage flow works
- **Missing**: Dynamic scenario generation via Groq, 6-metric alignment
- **Needs**: Phase 3 — Dynamic scenarios + metric update (Decision 8, 9)

### 🟡 Module 5: DSA Mastery (70%)
- **Current**: Full CRUD + AI chatbot works but uses MongoDB
- **Missing**: Supabase migration, seed DSA data into PostgreSQL
- **Needs**: Phase 2 — MongoDB → Supabase migration (Decision 10, 11)

### 🟡 Module 6: Career Tracker (45%)
- **Current**: Basic stats cards, evaluator pipeline works
- **Missing**: Radar chart, line chart, progress bars, history table
- **Needs**: Phase 4 — 5 chart types with Recharts (Decision 12)

### ✅ Security (80%) — MOSTLY DONE
- **Fixed**: ✅ CORS — specific origins only (no more wildcard)
- **Fixed**: ✅ Dual auth eliminated — gateway validates Supabase JWT
- **Fixed**: ✅ Fake sign-in removed — `/auth/signup` returns 410 Gone
- **Fixed**: ✅ Frontend passes Supabase access_token (no more `password:'demo'`)
- **Fixed**: ✅ Duplicate email signup detected (identities[] check)
- **Remaining**: Set `SUPABASE_JWT_SECRET` env var, re-enable Google OAuth client

### 🔴 Deployment (0%)
- **Current**: Localhost only
- **Missing**: Dockerfiles, cloud deployment, production env vars
- **Needs**: Phase 5 — Vercel + Railway deployment

---

## Patterns Available (from ai-engineering-hub)

See `Read_lovable/patterns/` for implementation patterns:
1. `zep_memory_pattern.md` - User memory across sessions
2. `parlant_journey_pattern.md` - Multi-step flows with branching
3. `agentic_rag_pattern.md` - Document + web fallback
4. `database_memory_pattern.md` - Session history in DB
5. `book_writer_flow_pattern.md` - Multi-agent coordination
6. `corrective_rag_pattern.md` - Self-correcting answers
7. `eval_observability_pattern.md` - Behavioral metrics

---

## Architecture Notes

### User Flow (Current)
```
Login/Signup → Supabase Auth (email or Google OAuth)
  ↓ (duplicate email? → "Account exists, please sign in" + auto-switch)
Check Onboarding → /onboarding if incomplete
  ↓ (complete 5 steps + save)
Dashboard → OrchestratorCard → GET /api/next?user_id=UUID
  ↓ (click "Start")
Navigate to module route → Complete activity
  ↓
Evaluator scores → Updates user_state → Memory logs event
  ↓
Next Dashboard visit → Orchestrator re-scores with updated state
```

### Orchestrator v2 Call Chain
```
Dashboard.tsx → GET /api/next?user_id=UUID → Gateway (localhost:8000)
  ↓
Embedded Orchestrator v2 Pipeline:
  1. StateManager.get_user_state() → user_state + onboarding + recent_modules
  2. Memory context → user_memory + user_patterns
  3. Service health → circuit breakers filter unhealthy services
  4. DecisionEngine.decide() → 5-signal weighted scoring
  5. LLM reasoning → Groq/Gemini generates explanation
  6. Persist → orchestrator_decisions audit trail
  7. Metrics → decision_latency, module distribution
  ↓
Returns: { next_module, reason, description, confidence, depth, decision_id }
  ↓
OrchestratorCard displays + navigates
```

### Auth Flow (Current)
```
Frontend (Supabase Auth) → signInWithPassword / signInWithOAuth
  ↓
Supabase returns session (access_token = JWT)
  ↓
useAuth caches token → gatewayAuthService.cacheToken()
  ↓
All API calls send: Authorization: Bearer <supabase_access_token>
  ↓
Gateway verify_token():
  1. Try decode with SUPABASE_JWT_SECRET (audience="authenticated")
  2. Fallback: try decode with JWT_SECRET (legacy)
  3. Extract user_id from "sub" claim
```

---

## Next Actions (Feb 2026 — Remaining Phases)

**✅ COMPLETED — Phase 1 Security + Auth (formerly Days 1-2):**
- ✅ Fixed CORS — specific origins only
- ✅ Removed fake auth — Supabase JWT validation in gateway
- ✅ Eliminated dual auth — `password:'demo'` backdoor removed
- ✅ Frontend sends Supabase access_token
- ✅ Duplicate email signup detection

**✅ COMPLETED — Phase 2 Orchestrator Intelligence (formerly Days 3-5):**
- ✅ Weighted 5-signal decision engine
- ✅ LLM reasoning via Groq/Gemini with key rotation
- ✅ Circuit breakers + health monitoring
- ✅ Decision audit trail + metrics
- ✅ Onboarding data integration (target_role, primary_focus)

**🔴 NEXT — Phase 3 (Make Every Service Real):**
- Build Project Studio 6-agent pipeline (CRITICAL)
- Add dynamic interview scenarios via Groq
- Add "Think First" questions to courses
- Migrate DSA from MongoDB to Supabase
- Update evaluator to 6 metrics

**Phase 4 (Career Tracker + Visuals):**
- Build 5 chart types in Dashboard (Recharts)
- Score trends, radar chart, progress bars

**Phase 5 (Deployment + Polish):**
- Dockerfiles + docker-compose
- Deploy to Vercel (frontend) + Railway (backend)
- End-to-end testing, demo preparation

**Full details**: See `MASTER_PLAN.md` for complete task breakdowns.
