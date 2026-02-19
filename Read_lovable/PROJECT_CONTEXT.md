# StudyMate - Project Context

> **For Any AI Agent**: Read this file to understand what this project is. Then read `MASTER_PLAN.md` for the full implementation plan, bugs, decisions, and audit results.

## What Is StudyMate?

An **agentic career preparation platform** that trains users to think in production by questioning, challenging, and adapting to their decisions.

**NOT** a course platform. **NOT** a mock interview app. A **thinking simulator** for real-world engineering & interviews.

## Core Problem We Solve

| Reality | Our Solution |
|---------|--------------|
| Colleges teach theory | System behaves like senior engineer |
| Platforms teach content | Forces user to think before answering |
| Interviews test decision-making | Adapts based on user decisions |
| Students jump to solutions | Questions and challenges assumptions |

## The 6 Modules

### 1. Agent Orchestrator (Brain)
- Stores user goal (role, focus)
- Tracks weaknesses across system
- Decides what user should do next
- **Key**: User does NOT control flow blindly

### 2. Interactive Course Generation
- Course behaves like a mentor
- Flow: Scenario → Why Question → Teaching → Failure Injection → Micro Check
- Branching based on thinking quality

### 3. Project Studio (Most Unique)
- 6 AI agents simulate software company workflow (updated from original 5)
- Agents: Idea Validator → Market Researcher → System Architect → UI/UX Advisor → Execution Planner → Devil's Advocate
- Devil's Advocate challenges the plan (replaces agent disagreement)
- **Status**: 100% mock — needs complete rebuild with Groq LLM

### 4. Production Thinking Interview
- NOT mock Q&A, real interviewer simulation
- Steps: Clarification → Core Answer → Follow-ups → Curveball → Reflection
- Metrics: Clarification Habit, Structure, Trade-off Awareness, Scalability, Failure Awareness, Adaptability

### 5. DSA Skill Mastery (Visualizer)
- Understanding code ≠ understanding algorithm
- Visual Run → Pause & Predict → Explanation → Pattern Mapping
- No compiler needed

### 6. Career Tracker
- Learning growth, Interview improvement, DSA mastery
- Trends > fake predictions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL (migrating MongoDB DSA service) |
| Backend | Python FastAPI microservices (11 services) |
| AI (Primary) | Groq (free tier, llama-3.3-70b-versatile) |
| AI (Courses) | Google Gemini (dedicated key pools) |
| AI (Fallback) | OpenRouter |
| Edge Functions | Supabase Deno (6 functions) |
| Connectors | Firecrawl, ElevenLabs, Brave Search |

## Key Documents

| Document | Purpose |
|----------|---------|
| `Read_lovable/MASTER_PLAN.md` | **THE master doc** — bugs, decisions, plan, audit |
| `Read_lovable/CURRENT_STATE.md` | Quick status snapshot |
| `Read_lovable/IMPLEMENTATION_LOG.md` | Changelog of all work done |
| `Read_lovable/API_CONTRACT.md` | API endpoint specs |
| `PROJECT.md` | Original project vision (6 modules) |

## What We Explicitly Removed

❌ Judge0 / Code execution  
❌ Docker sandbox  
❌ Live WebRTC  
❌ Mobile app  
❌ Social features  
❌ Notifications  
❌ Overengineering infra

## System Flow

```
User → Agent Orchestrator → Chooses Module → Module QUESTIONS User
→ User Responds → System Adapts & Gives Feedback → Career State Updates
→ Orchestrator Replans Next Action
```

This loop is the heart of the system.
