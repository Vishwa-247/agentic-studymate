# StudyMate - Current State

> **For Any AI Agent**: This file is updated after each implementation phase. For the FULL context (bugs, decisions, implementation plan), read `MASTER_PLAN.md` first.

**Last Updated**: 2026-02-16  
**Updated By**: Copilot (Full Codebase Audit)  
**Phase**: Pre-Phase 1 — Full audit complete, 5-phase plan locked, ready to begin implementation  
**Overall Completion**: ~55%

---

## ⚠️ IMPORTANT: Read MASTER_PLAN.md

The comprehensive document `Read_lovable/MASTER_PLAN.md` contains:
- All 10 critical bugs found
- All 7 architectural flaws
- All 15 design decisions (locked)
- Full 5-phase implementation plan with day-by-day tasks
- Complete module-by-module audit with % completion
- File map with line counts
- Environment variables needed
- Metric mapping (old → new)

**Read that file for the complete picture. This file is a quick status snapshot.**

---

## Quick Status Snapshot (Feb 2026)

| Module | Completion | Key Gap |
|--------|-----------|---------|
| 1. Orchestrator | 65% | No LLM reasoning, no weighted scoring |
| 2. Course Gen | 75% | No "Think First" questions |
| 3. Project Studio | 15% | 100% mock — needs complete rebuild |
| 4. Interview | 70% | Hardcoded scenarios, wrong metrics |
| 5. DSA | 70% | MongoDB dependency, needs migration |
| 6. Career Tracker | 45% | No charts, metric mismatch |
| Security/Config | 30% | CORS, dual auth, no auth tokens |
| Deployment | 0% | Localhost only |

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
- **Onboarding**: 5-step wizard with custom inputs ⭐ NEW
- **Auth page**: Supabase authentication working
- **Dashboard**: Layout + OrchestratorCard integration ⭐ UPDATED
- **Course Generator**: UI complete, connects to backend
- **Mock Interview**: Full UI with WebSocket support
- **Resume Analyzer**: UI complete
- **DSA Sheet**: Basic listing page

**Location**: `src/pages/`, `src/components/`

### ✅ Backend Services (Python FastAPI)

| Service | Port | Status | Location |
|---------|------|--------|----------|
| **Gateway** | 8000 | ✅ Working (security issues) | `backend/api-gateway/` |
| **Orchestrator** | 8011 | ✅ v0 (Rules only) | `backend/orchestrator/` |
| **Evaluator** | 8010 | ✅ Working (wrong metrics) | `backend/evaluator/` |
| Course Generation | 8008 | ✅ Working | `backend/agents/course-generation/` |
| Interview Coach | 8002 | ✅ Working | `backend/agents/interview-coach/` |
| Resume Analyzer | 8003 | ✅ Working | `backend/agents/resume-analyzer/` |
| Profile Service | 8006 | ✅ Working | `backend/agents/profile-service/` |
| DSA Service | 8004 | ⚠️ Uses MongoDB | `backend/agents/dsa-service/` |
| Project Studio | 8012 | ❌ 100% Mock | `backend/agents/project-studio/` |
| Job Search | 8013 | ✅ Working | `backend/agents/job-search/` |
| Emotion Detection | 5001 | ✅ Optional (Flask) | `backend/agents/emotion-detection/` |

**Orchestrator v0:**
- Uses deterministic rules from `user_state` table
- Returns `{ next_module, reason, description }`
- No memory/LLM yet (Phase 2)

### ✅ Database (Supabase)
- 27 migrations (26 existing + 1 new `user_onboarding`)
- Tables: users, courses, interviews, user_state, **user_onboarding** ⭐ NEW
- Edge functions deployed

---

## What's NOT Built (Critical Gaps) — See MASTER_PLAN.md for full details

### 🟡 Module 1: Agent Orchestrator (65%)
- **Current**: ✅ Rules-based v0 integrated into Dashboard
- **Missing**: LLM reasoning via Groq, weighted scoring with decay, onboarding data integration
- **Needs**: Phase 2 — Hybrid rules+LLM approach (Decision 2)

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

### 🔴 Security (30%)
- **Current**: CORS wildcard, dual auth, fake sign-in, no auth tokens
- **Missing**: Single auth system, protected endpoints, proper CORS
- **Needs**: Phase 1 — Security foundation (Bugs 1-5, 7-8)

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

### User Flow (Phase 1)
```
Login → Check Onboarding → /onboarding if incomplete
  ↓ (complete 5 steps + save)
Dashboard → OrchestratorCard → Fetch next_module
  ↓ (click "Start")
Navigate to module route
```

### Orchestrator Call Chain
```
Dashboard.tsx → getNextModule(userId) → Gateway (localhost:8000/api/next)
  ↓
Orchestrator (localhost:8011) → rules.py → user_state table
  ↓
Returns: { next_module, reason, description }
  ↓
OrchestratorCard displays + navigates
```

---

## Next Actions (Feb 2026 — 5-Phase Plan)

**Phase 1 (Days 1-2)**: Security + Configuration Foundation
- Fix CORS, remove fake auth, validate Supabase JWT in gateway
- Centralize config, create .env.example, protect all endpoints
- Fix frontend auth token sending, clean dead code

**Phase 2 (Days 3-5)**: Database + Orchestrator Intelligence
- Migrate DSA from MongoDB to Supabase PostgreSQL
- Update evaluator to 6 metrics with recency decay
- Upgrade orchestrator with LLM reasoning via Groq
- Build evaluator → orchestrator feedback loop

**Phase 3 (Days 6-9)**: Make Every Service Real
- Build Project Studio 6-agent pipeline (CRITICAL)
- Add dynamic interview scenarios via Groq
- Add "Think First" questions to courses
- Verify all other services end-to-end

**Phase 4 (Days 10-11)**: Career Tracker + Resilience
- Build 5 chart types in Dashboard
- Add circuit breakers, retries, health checks

**Phase 5 (Days 12-14)**: Deployment + Polish
- Dockerfiles + docker-compose
- Deploy to Vercel (frontend) + Railway (backend)
- End-to-end testing, demo preparation

**Work Style**: File-by-file approval — show changes, get confirmation, proceed.

**Full details**: See `MASTER_PLAN.md` for complete task breakdowns.
