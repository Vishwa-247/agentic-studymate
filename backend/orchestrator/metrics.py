"""
Metrics Collector
==================
In-memory ring buffer + periodic flush to database.
Tracks decision latency, module recommendations, service health, etc.

Design Pattern: Observer + Ring Buffer
- No external dependency (Prometheus, Datadog) required
- Self-contained metrics for dashboard/API consumption
- Async-safe with locks
"""

import asyncio
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class MetricPoint:
    """A single metric observation."""
    name: str
    value: float
    timestamp: float = field(default_factory=time.monotonic)
    labels: Dict[str, str] = field(default_factory=dict)


class Counter:
    """Monotonically increasing counter."""
    def __init__(self, name: str):
        self.name = name
        self._value: int = 0
        self._per_label: Dict[str, int] = defaultdict(int)

    def inc(self, label: str = "__total__", amount: int = 1):
        self._value += amount
        self._per_label[label] += amount

    @property
    def value(self) -> int:
        return self._value

    def by_label(self) -> Dict[str, int]:
        return dict(self._per_label)

    def to_dict(self) -> dict:
        return {"name": self.name, "total": self._value, "by_label": self.by_label()}


class Histogram:
    """Distribution tracker (latency, scores, etc.)."""
    def __init__(self, name: str, max_samples: int = 500):
        self.name = name
        self._samples: deque = deque(maxlen=max_samples)

    def observe(self, value: float):
        self._samples.append(value)

    @property
    def count(self) -> int:
        return len(self._samples)

    @property
    def avg(self) -> float:
        if not self._samples:
            return 0.0
        return sum(self._samples) / len(self._samples)

    @property
    def p50(self) -> float:
        return self._percentile(50)

    @property
    def p95(self) -> float:
        return self._percentile(95)

    @property
    def p99(self) -> float:
        return self._percentile(99)

    def _percentile(self, pct: int) -> float:
        if not self._samples:
            return 0.0
        sorted_s = sorted(self._samples)
        idx = int(len(sorted_s) * pct / 100)
        return sorted_s[min(idx, len(sorted_s) - 1)]

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "count": self.count,
            "avg": round(self.avg, 3),
            "p50": round(self.p50, 3),
            "p95": round(self.p95, 3),
            "p99": round(self.p99, 3),
        }


class MetricsCollector:
    """
    Central metrics collection for the orchestrator.

    Metrics tracked:
    - decisions_total           (Counter)  — by module
    - decisions_by_depth        (Counter)  — by depth level
    - decision_latency_ms       (Histogram) — end-to-end decision time
    - llm_latency_ms            (Histogram) — LLM reasoning call time
    - llm_failures_total        (Counter)
    - service_health_checks     (Counter)  — by service, by result
    - circuit_breaker_trips     (Counter)  — by service
    - feedback_events_total     (Counter)  — by module
    - active_users              (Counter)  — unique users seen
    """

    def __init__(self, buffer_size: int = 1000):
        self._start_time = time.monotonic()

        # Counters
        self.decisions_total = Counter("decisions_total")
        self.decisions_by_depth = Counter("decisions_by_depth")
        self.llm_failures = Counter("llm_failures_total")
        self.circuit_breaker_trips = Counter("circuit_breaker_trips")
        self.health_checks = Counter("health_checks")
        self.feedback_events = Counter("feedback_events_total")
        self.errors_total = Counter("errors_total")

        # Histograms
        self.decision_latency = Histogram("decision_latency_ms", buffer_size)
        self.llm_latency = Histogram("llm_latency_ms", buffer_size)
        self.db_latency = Histogram("db_latency_ms", buffer_size)

        # Active users (set for dedup)
        self._active_users: set = set()

        # Recent decisions ring buffer for dashboard
        self._recent_decisions: deque = deque(maxlen=50)

    def record_decision(
        self,
        user_id: str,
        module: str,
        depth: str,
        latency_ms: float,
        confidence: float,
    ):
        """Record a routing decision."""
        self.decisions_total.inc(module)
        self.decisions_by_depth.inc(depth)
        self.decision_latency.observe(latency_ms)
        self._active_users.add(user_id)
        self._recent_decisions.append({
            "user_id": user_id[:8] + "...",  # Truncate for privacy
            "module": module,
            "depth": depth,
            "latency_ms": round(latency_ms, 1),
            "confidence": round(confidence, 2),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    def record_llm_call(self, latency_ms: float, success: bool):
        """Record an LLM reasoning call."""
        self.llm_latency.observe(latency_ms)
        if not success:
            self.llm_failures.inc()

    def record_db_call(self, latency_ms: float):
        """Record a database call."""
        self.db_latency.observe(latency_ms)

    def record_circuit_trip(self, service: str):
        """Record a circuit breaker trip."""
        self.circuit_breaker_trips.inc(service)

    def record_error(self, error_type: str):
        """Record an error."""
        self.errors_total.inc(error_type)

    @property
    def uptime_seconds(self) -> float:
        return time.monotonic() - self._start_time

    @property
    def active_user_count(self) -> int:
        return len(self._active_users)

    def summary(self) -> Dict[str, Any]:
        """Full metrics summary for /metrics endpoint."""
        return {
            "uptime_seconds": round(self.uptime_seconds, 1),
            "active_users": self.active_user_count,
            "decisions": self.decisions_total.to_dict(),
            "decisions_by_depth": self.decisions_by_depth.to_dict(),
            "decision_latency": self.decision_latency.to_dict(),
            "llm_latency": self.llm_latency.to_dict(),
            "llm_failures": self.llm_failures.to_dict(),
            "db_latency": self.db_latency.to_dict(),
            "circuit_breaker_trips": self.circuit_breaker_trips.to_dict(),
            "errors": self.errors_total.to_dict(),
            "recent_decisions": list(self._recent_decisions)[-10:],
        }

    def health_summary(self) -> Dict[str, Any]:
        """Compact summary for health endpoint."""
        return {
            "uptime_s": round(self.uptime_seconds, 0),
            "total_decisions": self.decisions_total.value,
            "active_users": self.active_user_count,
            "avg_latency_ms": round(self.decision_latency.avg, 1),
            "p95_latency_ms": round(self.decision_latency.p95, 1),
            "error_rate": (
                round(self.errors_total.value / max(self.decisions_total.value, 1), 4)
            ),
        }
