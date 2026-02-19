"""
Decision Engine — Weighted Multi-Signal Routing
=================================================
Production-grade replacement for the simple threshold rule engine.

Architecture:
┌────────────────────────────────────────────────────────────────┐
│                      Decision Engine                           │
│                                                                │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Signal       │  │ Candidate    │  │ Final Selection       │ │
│  │ Extraction   │──►│ Scoring      │──►│ + Diversity Filter   │ │
│  │              │  │              │  │ + Cooldown Check      │ │
│  └─────────────┘  └──────────────┘  └───────────────────────┘ │
│       ▲                                        │               │
│       │                                        ▼               │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ User     │  │ Memory   │  │ Goal      │  │ LLM Reason   │  │
│  │ State    │  │ Patterns │  │ Alignment │  │ Generator    │  │
│  └─────────┘  └──────────┘  └───────────┘  └──────────────┘  │
└────────────────────────────────────────────────────────────────┘

Signals:
1. Weakness Severity  (40%) — How far below threshold is each skill?
2. Rate of Change     (15%) — Is the user improving or degrading?
3. Recency            (15%) — When did the user last visit this module?
4. Goal Alignment     (15%) — Does the module match the user's target role?
5. Pattern Signal     (15%) — Memory patterns (repeated struggles, breakthroughs)

The engine scores ALL candidate modules, ranks them, applies cooldown/diversity
filters, and picks the top result. Full scoring breakdown is returned for
explainability.
"""

import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from .config import (
    MODULES,
    SKILL_DIMENSIONS,
    GOAL_SKILL_WEIGHTS,
    EngineConfig,
    ModuleDefinition,
)
from .models import (
    Decision,
    DecisionDepth,
    ModuleScore,
    SkillScores,
    UserState,
)

logger = logging.getLogger(__name__)


class DecisionEngine:
    """
    Weighted multi-signal decision engine.

    Usage:
        engine = DecisionEngine(config)
        decision = engine.decide(user_state, memory_context)
    """

    def __init__(self, config: EngineConfig):
        self.config = config

    def decide(
        self,
        state: UserState,
        memory_context: Optional[Dict[str, Any]] = None,
        service_health: Optional[Dict[str, bool]] = None,
    ) -> Decision:
        """
        Core routing decision.

        Args:
            state: Current user state with scores and history.
            memory_context: Optional memory patterns and stats.
            service_health: Optional map of service_name → is_healthy.

        Returns:
            Decision with next_module, reason, and full scoring breakdown.
        """
        memory_context = memory_context or {}
        service_health = service_health or {}

        # Step 1: Determine decision depth (urgency level)
        depth = self._determine_depth(state)

        # Step 2: Get candidate modules (exclude unavailable services)
        candidates = self._get_candidates(state, service_health)

        if not candidates:
            # Fallback — should never happen
            return Decision(
                next_module="project_studio",
                reason="All modules are available. Apply your skills freely!",
                rule_reason="No candidates matched — fallback",
                description=MODULES["project_studio"].description,
                depth=depth,
                scores=state.scores.to_dict(),
                confidence=0.5,
            )

        # Step 3: Score each candidate across all signals
        scored = []
        for mod_name in candidates:
            score = self._score_candidate(
                mod_name, state, memory_context, service_health
            )
            scored.append(score)

        # Step 4: Sort by total_score descending
        scored.sort(key=lambda s: s.total_score, reverse=True)

        # Step 5: Apply diversity filter (avoid consecutive repeats)
        winner = self._apply_diversity_filter(scored, state)

        # Step 6: Build result
        mod_def = MODULES.get(winner.module, MODULES["project_studio"])
        weakness_trigger = state.scores.weakest_dimension(self.config.weakness_threshold)

        rule_reason = self._build_rule_reason(winner, state, weakness_trigger)

        return Decision(
            next_module=winner.module,
            reason=rule_reason,  # Will be replaced by LLM reason later
            rule_reason=rule_reason,
            description=mod_def.description,
            depth=depth,
            weakness_trigger=weakness_trigger,
            scores=state.scores.to_dict(),
            confidence=self._calculate_confidence(scored),
            candidate_scores=scored[:5],  # Top 5 for transparency
        )

    # ── Step 1: Decision Depth ────────────────────────────────────

    def _determine_depth(self, state: UserState) -> DecisionDepth:
        """Classify urgency of the routing decision."""
        scores = state.scores.to_dict()

        # Check if any score is critically low
        for dim, val in scores.items():
            if val < self.config.critical_threshold:
                return DecisionDepth.CRITICAL

        # Check if any score needs remediation
        for dim, val in scores.items():
            if val < self.config.weakness_threshold:
                return DecisionDepth.REMEDIATION

        # Check if user is brand new (all defaults)
        if all(v >= 0.99 for v in scores.values()) and not state.recent_modules:
            return DecisionDepth.ONBOARDING

        return DecisionDepth.NORMAL

    # ── Step 2: Candidate Selection ───────────────────────────────

    def _get_candidates(
        self,
        state: UserState,
        service_health: Dict[str, bool],
    ) -> List[str]:
        """Get modules that are eligible for recommendation."""
        candidates = []

        for mod_name, mod_def in MODULES.items():
            # Skip if the service is unhealthy (circuit breaker OPEN)
            if mod_def.base_url and service_health.get(mod_name) is False:
                logger.debug(f"Skipping {mod_name} — service unhealthy")
                continue

            # Skip onboarding if user already has history
            if mod_name == "onboarding" and state.recent_modules:
                continue

            candidates.append(mod_name)

        return candidates

    # ── Step 3: Multi-Signal Scoring ──────────────────────────────

    def _score_candidate(
        self,
        mod_name: str,
        state: UserState,
        memory_context: Dict[str, Any],
        service_health: Dict[str, bool],
    ) -> ModuleScore:
        """Score a single candidate module across all signals."""
        mod_def = MODULES[mod_name]
        ms = ModuleScore(module=mod_name)

        # Signal 1: Weakness Severity (how much does this module help?)
        ms.weakness_severity_score = self._calc_weakness_severity(mod_def, state)

        # Signal 2: Rate of Change
        ms.rate_of_change_score = self._calc_rate_of_change(mod_def, state, memory_context)

        # Signal 3: Recency (time since last visit)
        ms.recency_score = self._calc_recency_score(mod_name, state)

        # Signal 4: Goal Alignment
        ms.goal_alignment_score = self._calc_goal_alignment(mod_def, state)

        # Signal 5: Pattern Signal
        ms.pattern_score = self._calc_pattern_signal(mod_name, memory_context)

        # Cooldown Penalty
        ms.cooldown_penalty = self._calc_cooldown_penalty(mod_name, state, mod_def)

        # Diversity Bonus (boost modules not recently visited)
        ms.diversity_bonus = self._calc_diversity_bonus(mod_name, state)

        # Weighted total
        cfg = self.config
        ms.total_score = (
            ms.weakness_severity_score * cfg.weakness_severity_weight
            + ms.rate_of_change_score * cfg.rate_of_change_weight
            + ms.recency_score * cfg.recency_weight
            + ms.goal_alignment_score * cfg.goal_alignment_weight
            + ms.pattern_score * cfg.pattern_weight
            + ms.diversity_bonus * 0.05
            - ms.cooldown_penalty
        ) * mod_def.weight  # Module base weight multiplier

        return ms

    def _calc_weakness_severity(
        self, mod_def: ModuleDefinition, state: UserState
    ) -> float:
        """
        How much does this module address the user's weakest skills?
        Higher score = module's remediation skills overlap with user's weaknesses.
        """
        if not mod_def.remediation_skills:
            # Non-remediation modules (resume_builder, project_studio) get a base score
            if state.scores.all_healthy(self.config.weakness_threshold):
                return 0.6  # When healthy, non-remediation modules are attractive
            return 0.1  # When weak, prioritize remediation

        scores = state.scores.to_dict()
        severities = []

        for skill in mod_def.remediation_skills:
            val = scores.get(skill, 1.0)
            if val < self.config.critical_threshold:
                severities.append(1.0)  # Critical weakness
            elif val < self.config.weakness_threshold:
                # Linear scale: 0.4 → 0.0 maps to severity 1.0 → 0.4
                severity = 1.0 - (val / self.config.weakness_threshold)
                severities.append(max(0.4, severity))
            else:
                severities.append(0.0)  # Healthy — no severity

        return max(severities) if severities else 0.0

    def _calc_rate_of_change(
        self,
        mod_def: ModuleDefinition,
        state: UserState,
        memory_context: Dict[str, Any],
    ) -> float:
        """
        Is the user improving or degrading in the skills this module addresses?
        Degrading → higher score (needs intervention).
        """
        stats = memory_context.get("stats", {})
        if not stats:
            return 0.5  # No data — neutral

        # Look at recent event trend for relevant skills
        recent_events = memory_context.get("recent_events", [])
        if not recent_events:
            return 0.5

        # Count weakness vs strength events for this module's skills
        weakness_count = 0
        strength_count = 0
        for event in recent_events:
            if isinstance(event, dict):
                evt_type = event.get("event_type", "")
                evt_module = event.get("module", "")
                if "weakness" in evt_type:
                    weakness_count += 1
                elif "strength" in evt_type:
                    strength_count += 1

        total = weakness_count + strength_count
        if total == 0:
            return 0.5

        # More weaknesses → higher need for this module
        degradation_ratio = weakness_count / total
        return degradation_ratio

    def _calc_recency_score(self, mod_name: str, state: UserState) -> float:
        """
        How long since the user last visited this module?
        Longer ago → higher score (user should revisit).
        """
        if not state.recent_modules:
            return 0.5  # No history — neutral

        try:
            # Position in recent history (0 = most recent)
            idx = state.recent_modules.index(mod_name)
            # Normalize: further back → higher score
            return min(1.0, idx / max(len(state.recent_modules), 1))
        except ValueError:
            # Module never visited — high recency score
            return 0.8

    def _calc_goal_alignment(
        self, mod_def: ModuleDefinition, state: UserState
    ) -> float:
        """
        How well does this module align with the user's career goals?
        Uses goal-specific skill weights from config.
        """
        if not state.target_role or not mod_def.remediation_skills:
            return 0.5  # No target role or non-remediation module — neutral

        # Normalize target_role to a key
        role_key = state.target_role.lower().replace(" ", "_").replace("-", "_")

        # Find matching weight profile
        weights = GOAL_SKILL_WEIGHTS.get(role_key, GOAL_SKILL_WEIGHTS["default"])

        # Average the goal weights for this module's remediation skills
        alignment_values = []
        for skill in mod_def.remediation_skills:
            w = weights.get(skill, 1.0)
            alignment_values.append(w)

        if not alignment_values:
            return 0.5

        # Normalize: weights are 0.7–1.5 range → map to 0.0–1.0
        avg = sum(alignment_values) / len(alignment_values)
        return min(1.0, max(0.0, (avg - 0.7) / 0.8))

    def _calc_pattern_signal(
        self, mod_name: str, memory_context: Dict[str, Any]
    ) -> float:
        """
        Do memory patterns suggest this module is needed?
        Uses pattern data from UserMemory.
        """
        patterns = memory_context.get("patterns", [])
        if not patterns:
            return 0.5  # Default neutral

        mod_def = MODULES.get(mod_name)
        if not mod_def or not mod_def.remediation_skills:
            return 0.3

        # Check if any pattern mentions skills this module addresses
        relevant_patterns = 0
        for pattern in patterns:
            if isinstance(pattern, dict):
                desc = (pattern.get("description", "") or "").lower()
                p_type = (pattern.get("pattern_type", "") or "").lower()
                for skill in mod_def.remediation_skills:
                    skill_label = SKILL_DIMENSIONS.get(skill, {}).get("label", "").lower()
                    if skill_label and skill_label in desc:
                        confidence = pattern.get("confidence", 0.5)
                        relevant_patterns += confidence

        return min(1.0, relevant_patterns)

    def _calc_cooldown_penalty(
        self, mod_name: str, state: UserState, mod_def: ModuleDefinition
    ) -> float:
        """Apply penalty if module was just recommended (prevent hammering)."""
        if not state.recent_modules:
            return 0.0

        if state.recent_modules and state.recent_modules[0] == mod_name:
            # Was literally the last recommendation
            return 0.3

        # Check if in recent history (within min_modules_before_repeat)
        recent_window = state.recent_modules[: self.config.min_modules_before_repeat + 1]
        if mod_name in recent_window:
            return 0.15

        return 0.0

    def _calc_diversity_bonus(self, mod_name: str, state: UserState) -> float:
        """Bonus for modules the user hasn't tried much yet."""
        visit_count = state.module_visit_counts.get(mod_name, 0)
        total_visits = sum(state.module_visit_counts.values()) or 1

        # Less visited relative to others → higher bonus
        visit_ratio = visit_count / total_visits
        return max(0.0, 1.0 - visit_ratio * 3)  # Scale down quickly

    # ── Step 5: Diversity Filter ──────────────────────────────────

    def _apply_diversity_filter(
        self, scored: List[ModuleScore], state: UserState
    ) -> ModuleScore:
        """
        Ensure we don't recommend the same module too many times in a row.
        Returns the winning ModuleScore.
        """
        if not state.recent_modules:
            return scored[0]

        # Count consecutive same-module recommendations
        last_module = state.recent_modules[0] if state.recent_modules else None
        consecutive = 0
        for m in state.recent_modules:
            if m == last_module:
                consecutive += 1
            else:
                break

        # If same module recommended too many times, pick the second-best
        if (
            consecutive >= self.config.max_consecutive_same_module
            and scored[0].module == last_module
            and len(scored) > 1
        ):
            logger.info(
                f"Diversity filter: {last_module} recommended {consecutive}x "
                f"in a row → switching to {scored[1].module}"
            )
            return scored[1]

        return scored[0]

    # ── Helpers ───────────────────────────────────────────────────

    def _calculate_confidence(self, scored: List[ModuleScore]) -> float:
        """
        How confident are we in the top choice?
        High gap between #1 and #2 → high confidence.
        """
        if len(scored) < 2:
            return 1.0

        top = scored[0].total_score
        second = scored[1].total_score

        if top <= 0:
            return 0.5

        gap_ratio = (top - second) / top
        return min(1.0, max(0.3, 0.5 + gap_ratio))

    def _build_rule_reason(
        self,
        winner: ModuleScore,
        state: UserState,
        weakness_trigger: Optional[str],
    ) -> str:
        """Build a deterministic rule-based reason string."""
        mod_def = MODULES.get(winner.module)
        scores = state.scores.to_dict()

        if weakness_trigger:
            val = scores.get(weakness_trigger, 1.0)
            dim_info = SKILL_DIMENSIONS.get(weakness_trigger, {})
            dim_label = dim_info.get("label", weakness_trigger)

            if val < self.config.critical_threshold:
                return (
                    f"Your {dim_label} score ({val:.2f}) is critically low. "
                    f"Urgent practice in {mod_def.label} is recommended."
                )
            return (
                f"Your {dim_label} score ({val:.2f}) is below {self.config.weakness_threshold}. "
                f"{mod_def.label} will help you improve through targeted practice."
            )

        if state.scores.all_healthy(self.config.weakness_threshold):
            return (
                f"All your skills are healthy (≥ {self.config.weakness_threshold}). "
                f"{mod_def.label} is recommended to apply and reinforce your knowledge."
            )

        return f"{mod_def.label} is your best next step based on your current skill profile."


# ── Legacy Compatibility Layer ────────────────────────────────────
# Drop-in replacement for the old _decide() function.

_default_engine: Optional[DecisionEngine] = None


def get_engine(config: Optional[EngineConfig] = None) -> DecisionEngine:
    """Get or create the singleton decision engine."""
    global _default_engine
    if _default_engine is None:
        _default_engine = DecisionEngine(config or EngineConfig())
    return _default_engine


def decide_legacy(state: dict) -> Tuple[str, str]:
    """
    Legacy-compatible wrapper that matches the old _decide(state) → (module, reason) API.
    Used for backward compatibility with existing gateway code.
    """
    engine = get_engine()

    # Convert dict state to UserState
    scores = SkillScores(
        clarity_avg=state.get("clarity_avg", 1.0) or 1.0,
        tradeoff_avg=state.get("tradeoff_avg", 1.0) or 1.0,
        adaptability_avg=state.get("adaptability_avg", 1.0) or 1.0,
        failure_awareness_avg=state.get("failure_awareness_avg", 1.0) or 1.0,
        dsa_predict_skill=state.get("dsa_predict_skill", 1.0) or 1.0,
    )
    user_state = UserState(
        user_id=state.get("user_id", "unknown"),
        scores=scores,
        next_module=state.get("next_module"),
    )

    decision = engine.decide(user_state)
    return decision.next_module, decision.rule_reason
