# STUDYMATE — Agentic Career Platform

## Core Problem

**Reality:**
- Colleges teach theory
- Platforms teach content
- Interviews test decision-making under constraints

**Students fail because they:**
- Jump to solutions
- Ignore scale, cost, failure
- Don't think like real engineers

**Our Solution:**
Build a system that behaves like a real senior engineer/interviewer/team, and forces the user to think before answering.

## Core Idea

An agentic career preparation platform that trains users to think in production by questioning, challenging, and adapting to their decisions.

## System Flow

```
User
  ↓
Agent Orchestrator (Brain)
  ↓
Chooses Module
  ↓
Module QUESTIONS User
  ↓
User Responds
  ↓
System Adapts & Gives Feedback
  ↓
Career State Updates
  ↓
Orchestrator Replans Next Action
```

This loop is the heart of the system.

## Core Modules

### 🧠 Module 1: Agent Orchestrator (The Brain)

**What it does:**
- Stores user goal (role, focus)
- Tracks weaknesses across system
- Decides what user should do next

**Example:**
If user:
- Fails interview trade-offs → push Interview Thinking
- Struggles with recursion → push DSA Visualizer
- Finishes learning fast → skip basics

User does NOT control the flow blindly. System guides them.

### 🎓 Module 2: Interactive Course Generation

**Old Way ❌**
- Generate 10 chapters
- User reads passively

**New Way ✅**
- Course behaves like a mentor

**Example: Load Balancing Lesson**

1. **Scenario First:** "Your backend receives 10x traffic suddenly. What breaks first?"
2. **Why Question:** "Why do you think database breaks first?"
3. **Teaching (Contextual):** System explains when DB becomes bottleneck
4. **Failure Injection:** "Now traffic spikes unevenly. What changes?"
5. **Micro Check:** One small check → result affects next lesson

**Why this is unique:**
- No content dump
- Question → decision → explanation
- Branching based on thinking quality

### 🧪 Module 3: Project Studio (Most Unique)

**Problem:** Students don't know what project to pick or how real projects are designed.

**Solution:** Simulate a real software company workflow using agents.

**Example Flow:**

User says: "I want to build a resume-worthy backend project."

1. **Agent 1: Idea Analyst** - Asks who, what, why. Rejects weak ideas.
2. **Agent 2: Research Agent** - Similar products, what works/fails, scope trimming
3. **Agent 3: System Design Agent** - Architecture, APIs, DB schema, trade-offs
4. **Agent 4: UI/UX Agent** - Screens, user flow, UX logic
5. **Agent 5: Execution Planner** - Week-wise milestones, priorities

Agents may disagree — this is realism.

### 💼 Module 4: Production Thinking Interview

**This is NOT mock Q&A. This is a real interviewer simulation.**

**Example Interview:**

Question: "You have 5000 resumes. Pick top 20."

1. **Clarification:** System asks about PDFs, one-time/continuous, bias constraints
2. **Core Answer:** User explains approach
3. **Follow-up:** "What fails at scale? How do you monitor? How handle bias?"
4. **Curveball:** "Now resumes double overnight."
5. **Reflection:** "What would you improve with more time?"

**Interview Metrics (NOT right/wrong):**
- Clarification Habit
- Structure
- Trade-off Awareness
- Scalability Thinking
- Failure Awareness
- Adaptability

### 🧩 Module 5: DSA Skill Mastery (With Visualizer)

**Core Insight:** Understanding code ≠ understanding algorithm.

**Example: Binary Search**

1. **Visual Run:** User sees pointer movement, mid updates, comparisons
2. **Pause & Predict:** "What happens next?"
3. **Explanation:** System explains step
4. **Pattern Mapping:** Links to similar patterns

No compiler needed. Visualizer + reasoning is enough.

### 📊 Module 6: Career Tracker (Intelligence)

**What it shows:**
- Learning growth
- Interview thinking improvement
- DSA mastery
- Weak areas

**What it does NOT do:**
❌ Predict job in X days

Trends > fake predictions.

## What We Removed

❌ Judge0 / Code execution
❌ Docker sandbox
❌ Live WebRTC
❌ Mobile app
❌ Social features
❌ Notifications
❌ Overengineering infra

## Why This Project Is Strong

This project:
- Teaches how to think, not what to memorize
- Simulates real interviews & teams
- Is agentic (decision + memory + adaptation)
- Is unique in the market
- Is defendable for a 12-credit final year project

## Project Description

StudyMate is an agentic career preparation platform that simulates real-world engineering thinking by questioning users, challenging assumptions, and adapting learning paths based on their decisions. Unlike traditional platforms that focus on static content or mock interviews, StudyMate emphasizes production-grade reasoning through interactive courses, multi-agent project design simulations, production-style interview scenarios, and algorithm visualizations. The system continuously evaluates user thinking patterns and guides them toward industry-ready decision-making skills.

## Tech Stack

**Frontend:**
- React + TypeScript
- Tailwind CSS
- React Router
- Supabase Auth

**Backend:**
- Supabase (Database + Auth)
- Edge Functions
- Real-time subscriptions

**AI:**
- OpenAI GPT-4
- Gemini API
- Custom agent orchestration
