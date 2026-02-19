# Corrective RAG Pattern

> **Use For**: Interview answer evaluation, Self-correcting feedback

## What It Does
Check answer quality, detect issues, retry with corrections if quality is poor.

## Key Pattern: Quality Check + Correction Loop

```python
from langgraph.graph import StateGraph, END

class CorrectionState(TypedDict):
    question: str
    answer: str
    quality_score: float
    issues: list
    corrected_feedback: str
    iteration: int

def check_answer_quality(state: CorrectionState) -> CorrectionState:
    """Evaluate answer against expected criteria"""
    
    evaluation_prompt = f"""
    Question: {state['question']}
    Answer: {state['answer']}
    
    Evaluate on these criteria:
    1. Clarification asked? (Did they ask questions first?)
    2. Structure clear? (Organized approach)
    3. Trade-offs mentioned? (Pros/cons discussed)
    4. Scale considered? (Beyond small scale)
    5. Failures considered? (What could break)
    
    Return JSON:
    {{
        "score": 0-100,
        "issues": ["issue1", "issue2"],
        "strengths": ["strength1"]
    }}
    """
    
    result = call_llm(evaluation_prompt)
    state['quality_score'] = result['score']
    state['issues'] = result['issues']
    return state

def should_correct(state: CorrectionState) -> str:
    """Decide if we need to ask for more info"""
    if state['quality_score'] < 60 and state['iteration'] < 3:
        return "needs_correction"
    return "accept"

def generate_follow_up(state: CorrectionState) -> CorrectionState:
    """Generate targeted follow-up based on issues"""
    
    follow_up_prompt = f"""
    The user's answer had these issues: {state['issues']}
    
    Generate a follow-up question that helps them address the biggest issue.
    Be Socratic - don't give the answer, guide them to it.
    """
    
    state['corrected_feedback'] = call_llm(follow_up_prompt)
    state['iteration'] += 1
    return state

# Build the graph
workflow = StateGraph(CorrectionState)
workflow.add_node("check_quality", check_answer_quality)
workflow.add_node("generate_followup", generate_follow_up)

workflow.add_edge("check_quality", "should_correct")
workflow.add_conditional_edges(
    "should_correct",
    should_correct,
    {
        "needs_correction": "generate_followup",
        "accept": END
    }
)
workflow.add_edge("generate_followup", "check_quality")  # Loop back

graph = workflow.compile()
```

## How To Apply in StudyMate

### Interview Answer Correction
```python
# backend/agents/interview-coach/corrective.py

async def evaluate_with_correction(question: dict, answer: str) -> dict:
    """Evaluate answer and generate corrective follow-up if needed"""
    
    # Initial evaluation
    eval_result = await evaluate_answer(question, answer)
    
    # Check key metrics
    issues = []
    
    if not eval_result.get('has_clarification'):
        issues.append("jumped_to_solution")
    
    if eval_result.get('scalability_score', 0) < 50:
        issues.append("ignored_scale")
    
    if eval_result.get('failure_score', 0) < 50:
        issues.append("ignored_failures")
    
    # Generate corrective follow-up
    if issues:
        follow_up = await generate_corrective_question(issues, question, answer)
        return {
            "score": eval_result['score'],
            "issues": issues,
            "follow_up": follow_up,
            "feedback": eval_result['feedback']
        }
    
    return {
        "score": eval_result['score'],
        "issues": [],
        "follow_up": None,
        "feedback": eval_result['feedback']
    }

async def generate_corrective_question(issues: list, question: dict, answer: str) -> str:
    """Generate Socratic follow-up based on issues"""
    
    issue_prompts = {
        "jumped_to_solution": "What assumptions did you make? What could you have asked first?",
        "ignored_scale": "What happens when this goes from 100 to 1 million users?",
        "ignored_failures": "What could go wrong? What's your plan B?"
    }
    
    # Pick the most critical issue
    primary_issue = issues[0]
    
    return f"""
    Interesting approach. But let me push back:
    
    {issue_prompts[primary_issue]}
    
    Think about it and update your answer.
    """
```

### Iteration Tracking
```python
class InterviewSession:
    def __init__(self):
        self.corrections = []
    
    def add_correction(self, question_id: str, issue: str, follow_up: str):
        self.corrections.append({
            "question_id": question_id,
            "issue": issue,
            "follow_up": follow_up,
            "timestamp": datetime.now()
        })
    
    def get_weakness_pattern(self) -> dict:
        """Analyze correction patterns to find systemic weaknesses"""
        issue_counts = {}
        for c in self.corrections:
            issue_counts[c['issue']] = issue_counts.get(c['issue'], 0) + 1
        return issue_counts
```

## Key Benefits
1. **Not binary** - Doesn't just say right/wrong
2. **Socratic** - Guides user to better answer
3. **Pattern detection** - Tracks repeated issues
4. **Bounded** - Max iterations prevent infinite loops

## Source
`D:\ai-engineering-hub\corrective-rag\workflow.py`
