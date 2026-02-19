"""
Service Registry & Health Monitor
===================================
Tracks the health status and latency of all downstream agent services.
Background task pings each service's /health endpoint periodically.
Integrates with circuit breakers for failure-aware routing.

Design Pattern: Service Discovery + Health Check Pattern
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import httpx

from .circuit_breaker import CircuitBreakerRegistry, CBState
from .config import MODULES, EngineConfig

logger = logging.getLogger(__name__)


@dataclass
class ServiceHealth:
    """Health snapshot for a single service."""
    name: str
    status: str = "unknown"        # healthy | degraded | unhealthy | unknown
    is_embedded: bool = False      # True for evaluator/orchestrator/job-search
    url: Optional[str] = None
    port: Optional[int] = None
    last_check_time: Optional[float] = None
    last_response_time_ms: Optional[float] = None  # Latency
    last_error: Optional[str] = None
    consecutive_failures: int = 0
    uptime_checks: int = 0
    healthy_checks: int = 0

    @property
    def availability_pct(self) -> float:
        if self.uptime_checks == 0:
            return 100.0
        return round((self.healthy_checks / self.uptime_checks) * 100, 1)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "status": self.status,
            "is_embedded": self.is_embedded,
            "url": self.url,
            "port": self.port,
            "latency_ms": self.last_response_time_ms,
            "availability_pct": self.availability_pct,
            "consecutive_failures": self.consecutive_failures,
            "last_error": self.last_error,
        }


class ServiceRegistry:
    """
    Central registry of all services with background health monitoring.

    Architecture:
    ┌─────────────────┐     ┌──────────────┐     ┌──────────────────┐
    │  ServiceRegistry │────►│ HealthMonitor│────►│ CircuitBreakers  │
    │  (discovery)     │     │ (background) │     │ (per-service)    │
    └─────────────────┘     └──────────────┘     └──────────────────┘
    """

    def __init__(
        self,
        config: EngineConfig,
        circuit_breakers: CircuitBreakerRegistry,
    ):
        self.config = config
        self.circuit_breakers = circuit_breakers
        self._services: Dict[str, ServiceHealth] = {}
        self._monitor_task: Optional[asyncio.Task] = None
        self._running = False

        # Register all known services from config
        self._register_module_services()
        self._register_embedded_services()

    def _register_module_services(self):
        """Register services from module definitions."""
        for mod_name, mod_def in MODULES.items():
            if mod_def.base_url:
                self._services[mod_name] = ServiceHealth(
                    name=mod_name,
                    url=mod_def.base_url,
                    port=mod_def.port,
                    is_embedded=False,
                )

    def _register_embedded_services(self):
        """Register embedded services (always healthy)."""
        for name in ["evaluator", "orchestrator", "job-search"]:
            self._services[name] = ServiceHealth(
                name=name,
                is_embedded=True,
                status="healthy",
            )

    def register(self, name: str, url: str, port: Optional[int] = None):
        """Dynamically register a service."""
        self._services[name] = ServiceHealth(
            name=name, url=url, port=port, is_embedded=False,
        )
        logger.info(f"📋 Registered service: {name} → {url}")

    def get(self, name: str) -> Optional[ServiceHealth]:
        return self._services.get(name)

    def is_healthy(self, name: str) -> bool:
        """Check if a service is healthy (considers circuit breaker)."""
        svc = self._services.get(name)
        if not svc:
            return False
        if svc.is_embedded:
            return True

        cb = self.circuit_breakers.get(name)
        return cb.state != CBState.OPEN

    def get_healthy_services(self) -> List[str]:
        """Return names of all healthy services."""
        return [
            name for name, svc in self._services.items()
            if svc.is_embedded or self.is_healthy(name)
        ]

    def all_status(self) -> Dict[str, dict]:
        """Full status dashboard."""
        result = {}
        for name, svc in self._services.items():
            status = svc.to_dict()
            if not svc.is_embedded:
                cb = self.circuit_breakers.get(name)
                status["circuit_breaker"] = cb.state.value
            result[name] = status
        return result

    # ── Background Health Monitor ─────────────────────────────────

    async def start_monitoring(self):
        """Start the background health check loop."""
        if self._running:
            return
        self._running = True
        self._monitor_task = asyncio.create_task(self._health_check_loop())
        logger.info(
            f"🏥 Health monitor started (interval={self.config.health_check_interval_s}s)"
        )

    async def stop_monitoring(self):
        """Stop the background health check loop."""
        self._running = False
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
            self._monitor_task = None
        logger.info("🏥 Health monitor stopped")

    async def _health_check_loop(self):
        """Periodically check health of all non-embedded services."""
        while self._running:
            try:
                await self._check_all_services()
                await asyncio.sleep(self.config.health_check_interval_s)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health check loop error: {e}")
                await asyncio.sleep(5)

    async def _check_all_services(self):
        """Check all non-embedded services concurrently."""
        tasks = []
        for name, svc in self._services.items():
            if not svc.is_embedded and svc.url:
                tasks.append(self._check_service(name, svc))

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def _check_service(self, name: str, svc: ServiceHealth):
        """Check a single service's health endpoint."""
        url = f"{svc.url}/health"
        cb = self.circuit_breakers.get(name)

        start = time.monotonic()
        try:
            async with httpx.AsyncClient(
                timeout=self.config.health_check_timeout_s
            ) as client:
                resp = await client.get(url)
                elapsed_ms = (time.monotonic() - start) * 1000

                svc.uptime_checks += 1
                svc.last_check_time = time.monotonic()
                svc.last_response_time_ms = round(elapsed_ms, 1)

                if resp.status_code == 200:
                    svc.status = "healthy"
                    svc.consecutive_failures = 0
                    svc.healthy_checks += 1
                    svc.last_error = None
                    cb.record_success()
                else:
                    svc.status = "degraded"
                    svc.consecutive_failures += 1
                    svc.last_error = f"HTTP {resp.status_code}"
                    cb.record_failure()

        except httpx.TimeoutException:
            svc.uptime_checks += 1
            svc.status = "unhealthy"
            svc.consecutive_failures += 1
            svc.last_error = "Timeout"
            svc.last_response_time_ms = None
            cb.record_failure()

        except Exception as e:
            svc.uptime_checks += 1
            svc.status = "unhealthy"
            svc.consecutive_failures += 1
            svc.last_error = str(e)[:100]
            svc.last_response_time_ms = None
            cb.record_failure()
