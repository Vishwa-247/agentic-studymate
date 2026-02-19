# AI Agent Workflow for StudyMate

> This document explains how any AI agent should work on StudyMate.

## First Steps for ANY New Chat Session

1. **Read `Read_lovable/MASTER_PLAN.md`** — contains ALL context: bugs, decisions, plan, audit, file map
2. **Read `Read_lovable/CURRENT_STATE.md`** — quick status snapshot
3. **Read `Read_lovable/IMPLEMENTATION_LOG.md`** — what's been done recently
4. **Proceed with implementation** based on the 5-phase plan in MASTER_PLAN.md

## Work Style

- **File-by-file approval**: Show changes, get user confirmation, then proceed
- **Update docs after each session**: CURRENT_STATE.md + IMPLEMENTATION_LOG.md
- **One feature at a time**: Don't bundle multiple features

## File Responsibilities

| File | Who Updates | When |
|------|-------------|------|
| `MASTER_PLAN.md` | AI Agent | When decisions change or major progress made |
| `CURRENT_STATE.md` | AI Agent | After each implementation phase |
| `IMPLEMENTATION_LOG.md` | AI Agent | After each implementation session |
| `PROJECT_CONTEXT.md` | Manual (rare) | Only if project vision changes |
| `API_CONTRACT.md` | AI Agent | When API endpoints change |

## Example Workflow

### Step 1: User asks Lovable
```
"What should I build next for StudyMate?"
```

### Step 2: Lovable reads context, suggests
```markdown
## Feature: Interview Clarification Detection

### Priority: HIGH
### Module: Interview

### Problem Being Solved
Users jump to solutions without clarification. Need to detect and penalize.

### Files to Modify
...
```

### Step 3: User pastes to Antigravity
```
"Implement this: [paste Lovable's suggestion]"
```

### Step 4: Antigravity implements
- Writes code
- Runs tests
- Updates `CURRENT_STATE.md`:
  ```markdown
  ### 🟡 Module 4: Production Interviews
  - **Current**: Q&A with clarification detection ✅ NEW
  - **Missing**: Follow-ups, curveballs
  ```
- Updates `IMPLEMENTATION_LOG.md`
- Commits: `feat(interview): add clarification detection`

### Step 5: Lovable sees Git sync, reads updates, suggests next

## Folder Structure

```
D:\Agenntic-Studymate\
├── Read_lovable/
│   ├── PROJECT_CONTEXT.md      # What StudyMate IS
│   ├── CURRENT_STATE.md        # What's built NOW
│   ├── IMPLEMENTATION_LOG.md   # Changelog
│   ├── SUGGESTION_TEMPLATE.md  # Format for suggestions
│   ├── WORKFLOW.md             # This file
│   └── patterns/
│       ├── zep_memory_pattern.md
│       ├── parlant_journey_pattern.md
│       ├── agentic_rag_pattern.md
│       ├── database_memory_pattern.md
│       ├── book_writer_flow_pattern.md
│       ├── corrective_rag_pattern.md
│       └── eval_observability_pattern.md
└── ... (rest of project)
```

## Troubleshooting

### Lovable doesn't see new changes
- Trigger manual sync in Lovable settings
- Or ask: "Check the latest Git commits"

### Antigravity doesn't follow suggestion
- Ensure suggestion uses `SUGGESTION_TEMPLATE.md` format
- Be specific about file paths

### Context drift (tools see different realities)
- Always update `CURRENT_STATE.md` before committing
- Keep log entries in `IMPLEMENTATION_LOG.md` detailed
