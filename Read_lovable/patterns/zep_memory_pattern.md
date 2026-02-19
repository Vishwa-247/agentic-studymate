# Zep Memory Pattern

> **Use For**: Orchestrator memory, Career state tracking, User weakness evolution

## What It Does
Zep provides human-like memory for AI agents - extracting facts from conversations and retrieving relevant context.

## Key Pattern: ZepConversableAgent

```python
from zep_cloud.client import Zep
from zep_cloud import Message, Memory

class ZepConversableAgent:
    def __init__(self, name, system_message, zep_session_id, zep_client, min_fact_rating):
        self.zep_session_id = zep_session_id
        self.zep_client = zep_client
        self.min_fact_rating = min_fact_rating
        self.original_system_message = system_message
    
    def _zep_persist_message(self, content, role_type, role_name):
        """Store message in Zep memory"""
        zep_message = Message(
            role_type=role_type,  # "user" or "assistant"
            role=role_name,
            content=content
        )
        self.zep_client.memory.add(
            session_id=self.zep_session_id,
            messages=[zep_message]
        )
    
    def _zep_fetch_and_update_context(self):
        """Fetch relevant facts and update system message"""
        memory: Memory = self.zep_client.memory.get(
            self.zep_session_id,
            min_rating=self.min_fact_rating  # Only high-confidence facts
        )
        context = memory.context or "No specific facts recalled."
        
        # Inject facts into system message
        return self.original_system_message + f"\n\nRelevant facts:\n{context}"
```

## How To Apply in StudyMate

### Orchestrator Integration
```python
# backend/orchestrator/memory.py

from zep_cloud.client import Zep

class UserMemory:
    def __init__(self, user_id: str):
        self.zep = Zep(api_key=os.getenv("ZEP_API_KEY"))
        self.session_id = f"studymate_{user_id}"
    
    def record_weakness(self, module: str, metric: str, score: float):
        """Record a weakness observation"""
        self.zep.memory.add(
            session_id=self.session_id,
            messages=[Message(
                role_type="system",
                role="orchestrator",
                content=f"User showed weakness in {module}: {metric}={score}"
            )]
        )
    
    def get_weakness_pattern(self) -> str:
        """Retrieve patterns of weakness over time"""
        memory = self.zep.memory.get(self.session_id, min_rating=0.5)
        return memory.context
```

### Benefits
1. **Persistent memory** - Survives sessions
2. **Fact extraction** - Zep extracts key facts automatically
3. **Relevance scoring** - Only retrieve high-confidence info
4. **No RAG needed** - Built-in context management

## Setup
```bash
pip install zep-cloud
```

```env
ZEP_API_KEY=your_key_here
```

## Source
`D:\ai-engineering-hub\zep-memory-assistant\agent.py`
