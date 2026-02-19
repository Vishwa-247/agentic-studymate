"""
Evaluator Service - Prompts
Contains the scoring prompt template for LLM evaluation.
"""

SCORING_PROMPT_TEMPLATE = """You are evaluating a user's answer to a technical reasoning question.
Your job is to judge the user's thinking quality, not correctness.

Question:
{question}

User Answer:
{answer}

Evaluate the answer across the following five dimensions.
Each score must be between 0.0 and 1.0 with two decimals.

Definitions:

1. clarity:
    - Did the answer show clear, structured communication?
    - Was it understandable without guessing?

2. tradeoffs:
    - Did the answer demonstrate awareness of alternatives and consequences?
    - Did the user compare approaches instead of committing blindly?

3. adaptability:
    - Did the user show ability to adjust when conditions change?
    - Did they reason about dynamic scenarios rather than static ones?

4. failure_awareness:
    - Did the user consider edge cases, failure modes, or real-world constraints?

5. dsa_predict:
    - Reserved for algorithm reasoning modules.
    - If irrelevant, return null.

Output JSON only. No explanation, no additional text.

Example JSON output format:

{{
  "clarity": 0.00,
  "tradeoffs": 0.00,
  "adaptability": 0.00,
  "failure_awareness": 0.00,
  "dsa_predict": null
}}"""


def build_scoring_prompt(question: str, answer: str) -> str:
    """Build the scoring prompt with question and answer context."""
    return SCORING_PROMPT_TEMPLATE.format(
        question=question,
        answer=answer
    )
