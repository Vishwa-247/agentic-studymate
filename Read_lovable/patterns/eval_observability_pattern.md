# Eval & Observability Pattern

> **Use For**: Behavioral metrics tracking, Career Tracker intelligence

## What It Does
End-to-end evaluation of AI outputs with structured metrics, logging, and trend analysis.

## Key Pattern: Metric-Based Evaluation

```python
from opik import Opik, track
from opik.evaluation import evaluate
from opik.evaluation.metrics import Hallucination, AnswerRelevance

# Initialize client
opik = Opik()

# Define custom metrics for interview evaluation
class ClarificationMetric:
    """Did user ask clarifying questions?"""
    
    def score(self, output: str, context: dict) -> float:
        clarification_phrases = [
            "can you clarify", "what do you mean", "is it", "should I assume",
            "what if", "how many", "what's the scale"
        ]
        
        # Check for presence of clarification questions
        has_clarification = any(
            phrase in output.lower() 
            for phrase in clarification_phrases
        )
        
        return 100.0 if has_clarification else 0.0

class StructureMetric:
    """Is the answer well-structured?"""
    
    def score(self, output: str, context: dict) -> float:
        structure_indicators = [
            "first", "second", "third",
            "step 1", "step 2",
            "the main", "then",
            "finally"
        ]
        
        count = sum(1 for ind in structure_indicators if ind in output.lower())
        return min(100.0, count * 20)  # 5+ indicators = 100

class TradeoffMetric:
    """Did user discuss trade-offs?"""
    
    def score(self, output: str, context: dict) -> float:
        tradeoff_phrases = [
            "trade-off", "tradeoff", "on one hand", "however",
            "pros and cons", "downside", "but", "alternatively"
        ]
        
        count = sum(1 for phrase in tradeoff_phrases if phrase in output.lower())
        return min(100.0, count * 25)
```

## How To Apply in StudyMate

### Interview Metrics System
```python
# backend/evaluator/metrics.py

from dataclasses import dataclass
from typing import Dict

@dataclass
class InterviewMetrics:
    clarification_habit: float  # 0-100
    structure: float
    tradeoff_awareness: float
    scalability_thinking: float
    failure_awareness: float
    adaptability: float
    
    def overall_score(self) -> float:
        weights = {
            'clarification_habit': 0.20,
            'structure': 0.15,
            'tradeoff_awareness': 0.20,
            'scalability_thinking': 0.15,
            'failure_awareness': 0.20,
            'adaptability': 0.10
        }
        
        total = 0
        for metric, weight in weights.items():
            total += getattr(self, metric) * weight
        
        return total
    
    def weakness(self) -> str:
        """Return weakest area"""
        metrics = {
            'clarification_habit': self.clarification_habit,
            'structure': self.structure,
            'tradeoff_awareness': self.tradeoff_awareness,
            'scalability_thinking': self.scalability_thinking,
            'failure_awareness': self.failure_awareness,
            'adaptability': self.adaptability
        }
        return min(metrics, key=metrics.get)

def evaluate_answer(question: str, answer: str) -> InterviewMetrics:
    """Evaluate an interview answer on all metrics"""
    
    return InterviewMetrics(
        clarification_habit=ClarificationMetric().score(answer, {'question': question}),
        structure=StructureMetric().score(answer, {}),
        tradeoff_awareness=TradeoffMetric().score(answer, {}),
        scalability_thinking=evaluate_scalability(answer),
        failure_awareness=evaluate_failure_awareness(answer),
        adaptability=0  # Evaluated after follow-up
    )
```

### Trend Tracking
```python
# backend/evaluator/trends.py

class MetricsTrend:
    def __init__(self, supabase, user_id: str):
        self.supabase = supabase
        self.user_id = user_id
    
    def record(self, metrics: InterviewMetrics, interview_id: str):
        """Store metrics for trend analysis"""
        self.supabase.table("interview_metrics").insert({
            "user_id": self.user_id,
            "interview_id": interview_id,
            "clarification_habit": metrics.clarification_habit,
            "structure": metrics.structure,
            "tradeoff_awareness": metrics.tradeoff_awareness,
            "scalability_thinking": metrics.scalability_thinking,
            "failure_awareness": metrics.failure_awareness,
            "adaptability": metrics.adaptability,
            "overall_score": metrics.overall_score(),
            "created_at": "now()"
        }).execute()
    
    def get_trend(self, metric: str, days: int = 30) -> list:
        """Get metric trend over time"""
        result = self.supabase.table("interview_metrics") \
            .select(f"created_at, {metric}") \
            .eq("user_id", self.user_id) \
            .gte("created_at", f"now() - interval '{days} days'") \
            .order("created_at") \
            .execute()
        
        return result.data
    
    def get_insights(self) -> dict:
        """Generate insights from trends"""
        metrics = ["clarification_habit", "structure", "tradeoff_awareness", 
                   "scalability_thinking", "failure_awareness", "adaptability"]
        
        insights = {}
        for metric in metrics:
            trend = self.get_trend(metric)
            if len(trend) >= 3:
                recent = sum(t[metric] for t in trend[-3:]) / 3
                older = sum(t[metric] for t in trend[:3]) / 3
                
                if recent > older + 10:
                    insights[metric] = "improving"
                elif recent < older - 10:
                    insights[metric] = "declining"
                else:
                    insights[metric] = "stable"
        
        return insights
```

### Database Schema
```sql
CREATE TABLE interview_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    interview_id UUID REFERENCES interviews NOT NULL,
    clarification_habit FLOAT NOT NULL,
    structure FLOAT NOT NULL,
    tradeoff_awareness FLOAT NOT NULL,
    scalability_thinking FLOAT NOT NULL,
    failure_awareness FLOAT NOT NULL,
    adaptability FLOAT NOT NULL,
    overall_score FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_user ON interview_metrics(user_id);
```

## Key Benefits
1. **Quantified** - Numbers, not just "good job"
2. **Trend-aware** - Shows improvement over time
3. **Actionable** - Points to specific weaknesses
4. **Persistent** - Historical data for insights

## Source
`D:\ai-engineering-hub\eval-and-observability\`
