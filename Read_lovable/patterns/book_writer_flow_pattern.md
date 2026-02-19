# Book Writer Flow Pattern

> **Use For**: Project Studio multi-agent system, Content creation workflows

## What It Does
CrewAI Flow orchestrates multiple agents that work together (and can disagree) to produce complex outputs.

## Key Pattern: Multi-Agent with Handoffs

```python
from crewai import Agent, Crew, Process, Task
from crewai.flow import Flow, start, listen

class ProjectStudioFlow(Flow):
    """5 agents that simulate a software company"""
    
    @start()
    def analyze_idea(self):
        """Agent 1: Idea Analyst - Questions the idea"""
        analyst = Agent(
            role="Idea Analyst",
            goal="Challenge weak ideas, extract clear problem statement",
            backstory="Venture capitalist who rejects 99% of pitches."
        )
        
        task = Task(
            description=f"Analyze this project idea: {self.state['idea']}",
            expected_output="APPROVED with clear problem statement, OR REJECTED with reasons",
            agent=analyst
        )
        
        result = Crew(agents=[analyst], tasks=[task]).kickoff()
        self.state['idea_analysis'] = result.raw
        
        if "REJECTED" in result.raw:
            self.state['status'] = 'rejected'
            return "rejected"
        return "approved"
    
    @listen("approved")
    def research_market(self):
        """Agent 2: Research Agent - Finds similar products"""
        researcher = Agent(
            role="Market Researcher",
            goal="Find existing solutions, identify gaps",
            backstory="Product researcher with database of 10,000 products."
        )
        
        task = Task(
            description=f"Research competitors for: {self.state['idea_analysis']}",
            expected_output="List of competitors, what works, what fails, unique angle",
            agent=researcher
        )
        
        result = Crew(agents=[researcher], tasks=[task]).kickoff()
        self.state['research'] = result.raw
        return "researched"
    
    @listen("researched")
    def design_system(self):
        """Agent 3: System Design Agent - Creates architecture"""
        designer = Agent(
            role="System Architect",
            goal="Design scalable, practical architecture",
            backstory="Senior engineer who's built systems for millions of users."
        )
        
        task = Task(
            description=f"""
            Design system for: {self.state['idea_analysis']}
            Research context: {self.state['research']}
            
            Include: Architecture diagram, API design, DB schema, trade-offs
            """,
            expected_output="Technical design document",
            agent=designer
        )
        
        result = Crew(agents=[designer], tasks=[task]).kickoff()
        self.state['system_design'] = result.raw
        return "designed"
```

## How To Apply in StudyMate

### Project Studio Implementation
```python
# backend/agents/project-studio/flow.py

from crewai.flow import Flow, start, listen

class ProjectStudioFlow(Flow):
    
    @start()
    def idea_analyst(self):
        """Questions: Who? What? Why?"""
        # Returns: approved OR rejected with feedback
        pass
    
    @listen("approved")
    def research_agent(self):
        """Finds similar products, trims scope"""
        pass
    
    @listen("researched")
    def system_design_agent(self):
        """Creates architecture, APIs, DB schema"""
        pass
    
    @listen("designed")
    def uiux_agent(self):
        """Defines screens, user flow"""
        pass
    
    @listen("ui_done")
    def execution_planner(self):
        """Creates week-wise milestones"""
        pass

# Run the flow
flow = ProjectStudioFlow()
result = flow.kickoff(inputs={"idea": "Resume-worthy backend project"})
```

### Agent Disagreement
```python
@listen("designed")
def uiux_agent(self):
    """May disagree with system design"""
    
    uiux = Agent(
        role="UI/UX Designer",
        goal="Create user-friendly design, challenge over-engineering",
        backstory="Designer who believes in simplicity over complexity."
    )
    
    task = Task(
        description=f"""
        Review this system design: {self.state['system_design']}
        
        Create UI/UX plan. 
        If you disagree with any technical decision, say so and explain why.
        """,
        agent=uiux
    )
    
    result = Crew(agents=[uiux], tasks=[task]).kickoff()
    
    # Check for disagreement
    if "DISAGREE" in result.raw:
        self.state['conflicts'].append({
            'agent': 'uiux',
            'with': 'system_design',
            'reason': result.raw
        })
    
    self.state['uiux_plan'] = result.raw
```

## Key Benefits
1. **Clear handoffs** - Each agent knows its responsibility
2. **State management** - Flow tracks progress
3. **Disagreement handling** - Agents can challenge each other
4. **Restartable** - Can resume from any checkpoint

## Setup
```bash
pip install crewai
```

## Source
`D:\ai-engineering-hub\book-writer-flow\`
