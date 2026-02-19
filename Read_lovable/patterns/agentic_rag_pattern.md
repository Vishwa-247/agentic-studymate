# Agentic RAG Pattern

> **Use For**: Interactive Course Generation, Document-backed teaching

## What It Does
CrewAI agents with document search + web fallback. If document doesn't have answer, search the web.

## Key Pattern: Retriever + Synthesizer Agents

```python
from crewai import Agent, Crew, Process, Task
from crewai_tools import SerperDevTool

def create_learning_agents(pdf_tool):
    """Two-agent system: retrieve info, then synthesize response"""
    web_search_tool = SerperDevTool()
    
    # Agent 1: Information Retriever
    retriever_agent = Agent(
        role="Retrieve relevant information for: {topic}",
        goal=(
            "Find the most relevant information from course materials first. "
            "If not found, search the web for current best practices."
        ),
        backstory="Expert at finding precise information from multiple sources.",
        verbose=True,
        tools=[pdf_tool, web_search_tool] if pdf_tool else [web_search_tool]
    )
    
    # Agent 2: Teaching Synthesizer
    synthesizer_agent = Agent(
        role="Teaching assistant for: {topic}",
        goal=(
            "Turn retrieved information into a teaching moment. "
            "Include examples, counter-examples, and check understanding."
        ),
        backstory="Experienced educator who uses Socratic method.",
        verbose=True
    )
    
    # Tasks
    retrieval_task = Task(
        description="Find information about: {topic}",
        expected_output="Relevant content from sources with citations",
        agent=retriever_agent
    )
    
    teaching_task = Task(
        description="Create a learning interaction about: {topic}",
        expected_output="Teaching content with: scenario, question to user, key points",
        agent=synthesizer_agent
    )
    
    return Crew(
        agents=[retriever_agent, synthesizer_agent],
        tasks=[retrieval_task, teaching_task],
        process=Process.sequential,
        verbose=True
    )
```

## How To Apply in StudyMate

### Interactive Course Flow
```python
# backend/agents/course-generation/interactive.py

async def generate_interactive_lesson(topic: str, user_level: str):
    """Generate lesson that questions user, not dumps content"""
    
    crew = create_learning_agents(course_pdf_tool)
    
    # Step 1: Get context
    context = crew.kickoff(inputs={"topic": topic})
    
    # Step 2: Generate scenario question
    scenario_prompt = f"""
    Based on this context: {context}
    
    Create a scenario that tests understanding of {topic}.
    Format:
    - SCENARIO: [Real-world situation]
    - OPTIONS: [4 options, one correct, others are common misconceptions]
    - WHY_QUESTION: [Follow-up to ask after they answer]
    """
    
    return await call_gemini(scenario_prompt)
```

### Document Search Tool
```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

class CourseDocumentTool:
    """Search course materials"""
    
    def __init__(self, course_folder: str):
        documents = SimpleDirectoryReader(course_folder).load_data()
        self.index = VectorStoreIndex.from_documents(documents)
        self.query_engine = self.index.as_query_engine()
    
    def search(self, query: str) -> str:
        response = self.query_engine.query(query)
        return str(response)
```

## Key Benefits
1. **Grounded answers** - Uses actual documents, not just LLM knowledge
2. **Fallback** - Web search if document doesn't have answer
3. **Citations** - Can track where info came from
4. **Current** - Web search gets latest best practices

## Setup
```bash
pip install crewai crewai-tools llama-index
```

```env
SERPER_API_KEY=your_key  # For web search
```

## Source
`D:\ai-engineering-hub\agentic_rag\app.py`
