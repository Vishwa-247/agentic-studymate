"""
Context Engine for StudyMate
=============================
Adapted from context-engineering-pipeline (ai-engineering-hub).

Assembles multi-source context with token budgets for LLM consumption:
  - Short-term memory (recent events)
  - Long-term memory (weakness patterns)
  - Tool output (RAG results, scores)
  - User profile data

Key function: build_context_prompt() assembles all sources into a
single prompt with per-block token budgets to prevent overflow.
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def count_tokens(text: str) -> int:
    """Approximate token count (4 chars ≈ 1 token)."""
    return len(text) // 4


def maybe_summarize_block(text: str, block_name: str, max_tokens: int = 800) -> str:
    """
    Truncate a text block to fit within token budget.
    Adapted from context-engineering-pipeline's maybe_summarize_block().
    
    For production, use an LLM to summarize instead of truncating.
    """
    current_tokens = count_tokens(text)
    if current_tokens <= max_tokens:
        return text

    # Truncate to budget (keep first portion + note)
    char_budget = max_tokens * 4
    truncated = text[:char_budget]
    truncated += f"\n\n[...{block_name} truncated from {current_tokens} to ~{max_tokens} tokens]"
    logger.debug(f"Truncated {block_name}: {current_tokens} → ~{max_tokens} tokens")
    return truncated


def build_context_prompt(
    user_id: str,
    weakness_summary: str = "",
    recent_events: List[Dict] = None,
    patterns: List[Dict] = None,
    stats: Dict = None,
    tool_output: str = "",
    user_profile: Dict = None,
    # Token budgets per block (inspired by context-engineering-pipeline)
    weakness_budget: int = 600,
    events_budget: int = 400,
    patterns_budget: int = 300,
    tool_budget: int = 800,
    profile_budget: int = 200,
) -> str:
    """
    Assemble multi-source context into a single prompt with token budgets.
    
    Adapted from context-engineering-pipeline's build_context_prompt_with_summarization().
    Each block is independently budget-limited to prevent prompt overflow.
    """
    sections = []

    # 1. User profile
    if user_profile:
        profile_text = f"Name: {user_profile.get('name', 'Unknown')}\n"
        profile_text += f"Focus: {user_profile.get('primary_focus', 'general')}\n"
        profile_text += f"Experience: {user_profile.get('experience_level', 'unknown')}\n"
        if user_profile.get('skills'):
            profile_text += f"Skills: {', '.join(user_profile['skills'][:10])}\n"
        sections.append(
            f"--- User Profile ---\n{maybe_summarize_block(profile_text, 'profile', profile_budget)}"
        )

    # 2. Weakness summary (most important for orchestrator)
    if weakness_summary and weakness_summary != "Memory system unavailable.":
        sections.append(
            f"--- Weakness Analysis ---\n{maybe_summarize_block(weakness_summary, 'weaknesses', weakness_budget)}"
        )

    # 3. Recent activity
    if recent_events:
        events_text = ""
        for ev in recent_events[:15]:
            module = ev.get("module", "?")
            obs = ev.get("observation", "")[:120]
            metric = f" ({ev['metric_name']}: {ev['metric_value']:.2f})" if ev.get("metric_value") is not None else ""
            events_text += f"- [{module}] {obs}{metric}\n"
        sections.append(
            f"--- Recent Activity ({len(recent_events)} events) ---\n"
            f"{maybe_summarize_block(events_text, 'events', events_budget)}"
        )

    # 4. Detected patterns
    if patterns:
        patterns_text = ""
        for p in patterns[:8]:
            ptype = p.get("pattern_type", "?")
            desc = p.get("description", "")
            conf = p.get("confidence", 0)
            count = p.get("occurrence_count", 0)
            patterns_text += f"- {ptype}: {desc} (confidence: {conf:.0%}, occurrences: {count})\n"
        sections.append(
            f"--- Detected Patterns ---\n"
            f"{maybe_summarize_block(patterns_text, 'patterns', patterns_budget)}"
        )

    # 5. Tool output (RAG results, external data)
    if tool_output:
        sections.append(
            f"--- Retrieved Context ---\n{maybe_summarize_block(tool_output, 'tool_output', tool_budget)}"
        )

    # 6. Stats summary
    if stats:
        event_counts = stats.get("event_counts", {})
        avg_scores = stats.get("avg_scores", {})
        stats_text = f"Total events (30d): {stats.get('total_events_30d', 0)}\n"
        if event_counts:
            stats_text += "Event distribution: " + ", ".join(
                f"{k}: {v}" for k, v in sorted(event_counts.items(), key=lambda x: -x[1])[:5]
            ) + "\n"
        if avg_scores:
            stats_text += "Average scores: " + ", ".join(
                f"{k}: {v:.2f}" for k, v in sorted(avg_scores.items())[:8]
            ) + "\n"
        sections.append(f"--- Statistics ---\n{stats_text}")

    # Assemble
    header = f"=== USER CONTEXT FOR {user_id[:8]}... ==="
    assembled = header + "\n\n" + "\n\n".join(sections)

    total_tokens = count_tokens(assembled)
    logger.info(f"Assembled context: {total_tokens} tokens, {len(sections)} sections")

    return assembled


def build_orchestrator_prompt(user_context: str, module_descriptions: Dict[str, str]) -> str:
    """
    Build the prompt for orchestrator LLM reasoning.
    Combines user context with module descriptions.
    """
    modules_text = "\n".join(f"- {k}: {v}" for k, v in module_descriptions.items())

    return f"""Based on the following user context, recommend the next learning module.

{user_context}

--- Available Modules ---
{modules_text}

Consider:
1. Which weaknesses need the most attention?
2. What has the user been doing recently (avoid repetition)?
3. What would give the highest learning ROI right now?

Respond with:
MODULE: <module_key>
REASON: <1-2 sentence explanation>"""
