"""
Circuit Breaker Pattern
========================
Prevents cascading failures when downstream services are unhealthy.

State Machine:
  CLOSED  ──[failure_count >= threshold]──►  OPEN
  OPEN    ──[recovery_timeout elapsed]────►  HALF_OPEN
  HALF_OPEN ──[success]──────────────────►  CLOSED
  HALF_OPEN ──[failure]──────────────────►  OPEN

Each downstream service gets its own circuit breaker instance.
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Coroutine, Dict, Optional, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CBState(str, Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreakerStats:
    """Observable stats for monitoring."""
    total_calls: int = 0
    total_successes: int = 0
    total_failures: int = 0
    total_rejections: int = 0       # Calls rejected while OPEN
    consecutive_failures: int = 0
    consecutive_successes: int = 0
    last_failure_time: Optional[float] = None
    last_success_time: Optional[float] = None
    state_changes: int = 0
    last_state_change_time: Optional[float] = None

    def to_dict(self) -> dict:
        return {
            "total_calls": self.total_calls,
            "total_successes": self.total_successes,
            "total_failures": self.total_failures,
            "total_rejections": self.total_rejections,
            "consecutive_failures": self.consecutive_failures,
            "success_rate": (
                round(self.total_successes / self.total_calls, 3)
                if self.total_calls > 0 else 1.0
            ),
        }


class CircuitBreaker:
    """
    Per-service circuit breaker.

    Usage:
        cb = CircuitBreaker("interview-coach", failure_threshold=5)
        result = await cb.call(some_async_fn, arg1, arg2)
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout_s: int = 60,
        half_open_max_calls: int = 2,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_s = recovery_timeout_s
        self.half_open_max_calls = half_open_max_calls

        self._state = CBState.CLOSED
        self._stats = CircuitBreakerStats()
        self._half_open_calls = 0
        self._lock = asyncio.Lock()

    @property
    def state(self) -> CBState:
        # Auto-transition from OPEN → HALF_OPEN on timeout
        if self._state == CBState.OPEN and self._stats.last_failure_time:
            elapsed = time.monotonic() - self._stats.last_failure_time
            if elapsed >= self.recovery_timeout_s:
                self._transition(CBState.HALF_OPEN)
        return self._state

    @property
    def stats(self) -> CircuitBreakerStats:
        return self._stats

    @property
    def is_available(self) -> bool:
        """Can we send a request through this breaker?"""
        s = self.state  # Triggers auto-transition check
        if s == CBState.CLOSED:
            return True
        if s == CBState.HALF_OPEN:
            return self._half_open_calls < self.half_open_max_calls
        return False  # OPEN

    def _transition(self, new_state: CBState):
        old = self._state
        self._state = new_state
        self._stats.state_changes += 1
        self._stats.last_state_change_time = time.monotonic()

        if new_state == CBState.HALF_OPEN:
            self._half_open_calls = 0

        if new_state == CBState.CLOSED:
            self._stats.consecutive_failures = 0

        logger.info(
            f"🔌 Circuit breaker [{self.name}]: {old.value} → {new_state.value} "
            f"(failures={self._stats.consecutive_failures})"
        )

    def record_success(self):
        """Record a successful call."""
        self._stats.total_calls += 1
        self._stats.total_successes += 1
        self._stats.consecutive_successes += 1
        self._stats.consecutive_failures = 0
        self._stats.last_success_time = time.monotonic()

        if self._state == CBState.HALF_OPEN:
            self._half_open_calls += 1
            if self._stats.consecutive_successes >= self.half_open_max_calls:
                self._transition(CBState.CLOSED)

    def record_failure(self):
        """Record a failed call."""
        self._stats.total_calls += 1
        self._stats.total_failures += 1
        self._stats.consecutive_failures += 1
        self._stats.consecutive_successes = 0
        self._stats.last_failure_time = time.monotonic()

        if self._state == CBState.HALF_OPEN:
            self._transition(CBState.OPEN)
        elif self._stats.consecutive_failures >= self.failure_threshold:
            self._transition(CBState.OPEN)

    async def call(self, fn: Callable[..., Coroutine], *args, **kwargs) -> Any:
        """
        Execute an async function through the circuit breaker.
        Raises CircuitOpenError if the circuit is OPEN.
        """
        if not self.is_available:
            self._stats.total_rejections += 1
            raise CircuitOpenError(
                f"Circuit breaker [{self.name}] is OPEN — "
                f"{self._stats.consecutive_failures} consecutive failures, "
                f"recovery in {self._time_until_recovery():.0f}s"
            )

        try:
            result = await fn(*args, **kwargs)
            self.record_success()
            return result
        except Exception as e:
            self.record_failure()
            raise

    def _time_until_recovery(self) -> float:
        if self._stats.last_failure_time is None:
            return 0.0
        elapsed = time.monotonic() - self._stats.last_failure_time
        return max(0, self.recovery_timeout_s - elapsed)

    def reset(self):
        """Manual reset (admin action)."""
        self._transition(CBState.CLOSED)
        self._stats.consecutive_failures = 0
        self._stats.consecutive_successes = 0
        logger.info(f"🔄 Circuit breaker [{self.name}] manually reset")

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "state": self.state.value,
            "is_available": self.is_available,
            "stats": self._stats.to_dict(),
            "config": {
                "failure_threshold": self.failure_threshold,
                "recovery_timeout_s": self.recovery_timeout_s,
                "half_open_max_calls": self.half_open_max_calls,
            },
        }


class CircuitOpenError(Exception):
    """Raised when trying to call through an OPEN circuit breaker."""
    pass


class CircuitBreakerRegistry:
    """
    Manages circuit breakers for all downstream services.
    Thread-safe, creates breakers on first access.
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout_s: int = 60,
        half_open_max_calls: int = 2,
    ):
        self._breakers: Dict[str, CircuitBreaker] = {}
        self._failure_threshold = failure_threshold
        self._recovery_timeout_s = recovery_timeout_s
        self._half_open_max_calls = half_open_max_calls

    def get(self, service_name: str) -> CircuitBreaker:
        """Get or create a circuit breaker for a service."""
        if service_name not in self._breakers:
            self._breakers[service_name] = CircuitBreaker(
                name=service_name,
                failure_threshold=self._failure_threshold,
                recovery_timeout_s=self._recovery_timeout_s,
                half_open_max_calls=self._half_open_max_calls,
            )
        return self._breakers[service_name]

    def all_status(self) -> Dict[str, dict]:
        """Get status of all circuit breakers."""
        return {name: cb.to_dict() for name, cb in self._breakers.items()}

    def reset_all(self):
        """Reset all circuit breakers."""
        for cb in self._breakers.values():
            cb.reset()
