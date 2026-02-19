# Database Memory Pattern

> **Use For**: Session history, Course branching based on answers, Conversation context

## What It Does
Store chat history in database, retrieve session context, make decisions based on history.

## Key Pattern: Tool Selection with History

```python
from config import openai_client, OPENAI_MODEL

def tool_selector(user_input: str, session_history: list = None) -> tuple:
    """Select tool based on user input AND conversation history"""
    
    messages = [
        {
            "role": "system",
            "content": (
                "Select appropriate action based on full conversation context.\n\n"
                "Options:\n"
                "- question_user: Ask for clarification\n"
                "- teach_concept: Explain something\n"
                "- inject_failure: Challenge their assumption\n"
                "- evaluate_answer: Score their response\n\n"
                "Return JSON: {\"action\": \"...\", \"reasoning\": \"...\"}"
            )
        }
    ]
    
    # Add conversation history
    if session_history:
        messages.extend(session_history)
    
    messages.append({"role": "user", "content": user_input})
    
    response = openai_client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages
    ).choices[0].message.content
    
    return eval(response)  # {"action": "...", "reasoning": "..."}
```

## How To Apply in StudyMate

### Session History Storage
```python
# backend/shared/memory.py

from supabase import Client

class SessionMemory:
    def __init__(self, supabase: Client, session_id: str):
        self.supabase = supabase
        self.session_id = session_id
    
    def store_message(self, role: str, content: str, metadata: dict = None):
        """Store a message in session history"""
        self.supabase.table("chat_history").insert({
            "session_id": self.session_id,
            "role": role,
            "content": content,
            "metadata": metadata or {},
            "created_at": "now()"
        }).execute()
    
    def retrieve_history(self, limit: int = 20) -> list:
        """Get recent messages for context"""
        result = self.supabase.table("chat_history") \
            .select("*") \
            .eq("session_id", self.session_id) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        
        # Convert to OpenAI message format
        return [
            {"role": m["role"], "content": m["content"]}
            for m in reversed(result.data)
        ]
```

### Course Branching Based on History
```python
# backend/agents/course-generation/branching.py

async def decide_next_lesson(user_id: str, current_topic: str):
    """Decide next lesson based on user's answer quality"""
    
    memory = SessionMemory(supabase, f"course_{user_id}")
    history = memory.retrieve_history(limit=10)
    
    # Analyze their answers
    analysis_prompt = f"""
    Given this conversation history about {current_topic}:
    {history}
    
    Determine:
    1. Did user understand the core concept? (0-100)
    2. What misconceptions do they have?
    3. Should we: ADVANCE / REINFORCE / SIMPLIFY?
    
    Return JSON.
    """
    
    decision = await call_gemini(analysis_prompt)
    
    if decision["action"] == "ADVANCE":
        return get_next_topic(current_topic)
    elif decision["action"] == "REINFORCE":
        return generate_practice_problem(current_topic, decision["misconceptions"])
    else:
        return simplify_explanation(current_topic)
```

## Database Schema
```sql
CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,  -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_history_session ON chat_history(session_id);
```

## Key Benefits
1. **Persistent** - Survives page refreshes
2. **Queryable** - Can analyze patterns over time
3. **Lightweight** - No external service needed (uses Supabase)
4. **Auditable** - Full conversation log

## Source
`D:\ai-engineering-hub\database-memory-agent\planning.py`
