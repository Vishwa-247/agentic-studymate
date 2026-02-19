# Parlant Journey Pattern

> **Use For**: Interview module state machine, Multi-step flows with branching

## What It Does
Parlant enables compliance-driven conversational agents with multi-step journeys, state transitions, and conditional branching.

## Key Pattern: Journey with Branching

```python
import parlant.sdk as p

@p.tool
async def check_eligibility(context: p.ToolContext, score: int) -> p.ToolResult:
    """Tool that determines next path"""
    if score >= 70:
        return p.ToolResult(data={"is_eligible": True})
    else:
        return p.ToolResult(data={"is_eligible": False, "reason": "low score"})

async def create_interview_journey(agent: p.Agent) -> p.Journey:
    journey = await agent.create_journey(
        title="Production Interview",
        description="Multi-step interview with branching based on answers",
        conditions=["User wants to practice interviews"]
    )
    
    # Step 1: Ask clarifying questions
    t0 = await journey.initial_state.transition_to(
        chat_state="Present the problem and wait for user to ask clarifying questions"
    )
    
    # Step 2: Check if user asked clarifications
    t1 = await t0.target.transition_to(tool_state=check_clarification)
    
    # Branch: No clarification → Warning
    t2_no_clarify = await t1.target.transition_to(
        chat_state="Point out they jumped to solution. Ask: What assumptions did you make?",
        condition="User did not ask clarifying questions"
    )
    
    # Branch: Has clarification → Continue
    t2_has_clarify = await t1.target.transition_to(
        chat_state="Good clarification. Now ask for their approach",
        condition="User asked clarifying questions"
    )
    
    # Both paths converge to core answer
    t3_core = await t2_has_clarify.target.transition_to(
        chat_state="Evaluate their approach and ask follow-up: What fails at scale?"
    )
    await t2_no_clarify.target.transition_to(state=t3_core.source)
    
    # Curveball
    t4_curveball = await t3_core.target.transition_to(
        chat_state="Now requirements change: Traffic doubles overnight. How do you adapt?"
    )
    
    # End
    await t4_curveball.target.transition_to(state=p.END_JOURNEY)
    
    return journey
```

## How To Apply in StudyMate

### Interview Flow States
```
INITIAL → CLARIFICATION_CHECK → [BRANCH]
    ├── NO_CLARIFY → WARNING → CORE_ANSWER
    └── HAS_CLARIFY → CORE_ANSWER → FOLLOW_UP → CURVEBALL → REFLECTION → END
```

### Key Concepts
1. **tool_state** - Call a function to determine next path
2. **chat_state** - Just talk to user
3. **condition** - Boolean that determines which transition to take
4. **Guidelines** - Rules that apply across the journey

### Adding Guidelines
```python
await agent.create_guideline(
    condition="User asks for hints",
    action="Provide Socratic questions instead of direct answers"
)

await agent.create_guideline(
    condition="User gets frustrated",
    action="Acknowledge difficulty. Offer to break problem into smaller parts."
)
```

## Without Parlant SDK (Pure Python)

If not using Parlant, implement state machine manually:

```python
# backend/agents/interview-coach/states.py

from enum import Enum

class InterviewState(Enum):
    INITIAL = "initial"
    AWAITING_CLARIFICATION = "awaiting_clarification"
    CORE_ANSWER = "core_answer"
    FOLLOW_UP = "follow_up"
    CURVEBALL = "curveball"
    REFLECTION = "reflection"
    COMPLETE = "complete"

class InterviewStateMachine:
    def __init__(self):
        self.state = InterviewState.INITIAL
        self.clarification_asked = False
    
    def transition(self, user_input: str, analysis: dict):
        if self.state == InterviewState.INITIAL:
            # Present problem
            self.state = InterviewState.AWAITING_CLARIFICATION
            return "Here's your problem: [problem]. What would you like to clarify?"
        
        elif self.state == InterviewState.AWAITING_CLARIFICATION:
            if analysis.get("has_clarification"):
                self.clarification_asked = True
                self.state = InterviewState.CORE_ANSWER
                return "Good questions. Now, how would you approach this?"
            else:
                self.state = InterviewState.CORE_ANSWER
                return "⚠️ You jumped to a solution. What assumptions did you make?"
        
        # ... continue for other states
```

## Source
`D:\ai-engineering-hub\parlant-conversational-agent\loan_approval.py`
