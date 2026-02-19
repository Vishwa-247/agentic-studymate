#!/usr/bin/env python3
"""
Project Studio — Multi-Agent Pipeline Service
==============================================
Real 6-agent pipeline inspired by CrewAI Flow pattern (book-writer-flow).

Flow:
  @start  → Idea Analyst (validates idea)
  @listen → Market Researcher + System Architect + UX Advisor (parallel)
  @listen → Project Planner (needs all above)
  @listen → Critic (reviews everything)

Port: 8012
"""

import asyncio
import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# Load env from backend root
backend_root = Path(__file__).parent.parent.parent
load_dotenv(dotenv_path=backend_root / ".env")

from agents import (
    idea_analyst,
    market_researcher,
    system_architect,
    ux_advisor,
    project_planner,
    critic,
    web_researcher,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Project Studio Service",
    description="Multi-Agent Pipeline for End-to-End Project Analysis",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────── Models ───────────────

class DocumentInput(BaseModel):
    filename: str
    content: str


class ProjectRequest(BaseModel):
    user_id: str
    description: str
    context: Optional[str] = ""
    documents: Optional[List[DocumentInput]] = []


class AgentStatus(BaseModel):
    agent: str
    status: str  # pending | running | completed | error
    output: Optional[str] = None
    elapsed_ms: Optional[int] = None
    error: Optional[str] = None


class PipelineState(BaseModel):
    """Tracks the full pipeline state (like CrewAI Flow[BookState])."""
    session_id: str
    idea: str
    context: str = ""
    status: str = "running"  # running | completed | error
    started_at: str = ""
    completed_at: Optional[str] = None
    agents: Dict[str, AgentStatus] = {}
    documents: str = ""  # Concatenated document contents
    # Agent outputs (raw text)
    idea_analysis: str = ""
    market_research: str = ""
    web_research: str = ""
    architecture: str = ""
    ux_plan: str = ""
    project_plan: str = ""
    critique: str = ""


# In-memory session store
sessions: Dict[str, PipelineState] = {}


# ─────────────── Pipeline Execution ───────────────

async def _run_agent(state: PipelineState, agent_name: str, agent_fn, **kwargs) -> str:
    """Run a single agent, update state, return output text."""
    state.agents[agent_name] = AgentStatus(agent=agent_name, status="running")
    t0 = time.time()
    try:
        result = await agent_fn(**kwargs)
        elapsed = int((time.time() - t0) * 1000)
        output = result.get("output", "")
        state.agents[agent_name] = AgentStatus(
            agent=agent_name, status="completed", output=output, elapsed_ms=elapsed
        )
        logger.info(f"  {agent_name} completed in {elapsed}ms")
        return output
    except Exception as e:
        elapsed = int((time.time() - t0) * 1000)
        state.agents[agent_name] = AgentStatus(
            agent=agent_name, status="error", error=str(e), elapsed_ms=elapsed
        )
        logger.error(f"  {agent_name} failed: {e}")
        return f"[ERROR] {agent_name}: {e}"


async def run_pipeline(state: PipelineState):
    """
    Execute the 6-agent pipeline.

    Flow (inspired by CrewAI @start/@listen):
      1. Idea Analyst (sequential — must finish first)
      2. Market Researcher + System Architect + UX Advisor (parallel)
      3. Project Planner (needs architecture + UX)
      4. Critic (reviews everything)
    """
    idea = state.idea
    ctx = state.context
    if state.documents:
        ctx += "\n\n=== UPLOADED DOCUMENTS ===\n" + state.documents

    try:
        # Step 1: @start — Idea Analyst
        state.idea_analysis = await _run_agent(
            state, "Idea Analyst", idea_analyst,
            idea=idea, context=ctx
        )

        # Step 2: @listen(idea_analyst) — Parallel agents (including web research)
        market_task = _run_agent(
            state, "Market Researcher", market_researcher,
            idea=idea, idea_analysis=state.idea_analysis
        )
        arch_task = _run_agent(
            state, "System Architect", system_architect,
            idea=idea, idea_analysis=state.idea_analysis
        )
        ux_task = _run_agent(
            state, "UX Advisor", ux_advisor,
            idea=idea, idea_analysis=state.idea_analysis
        )
        web_task = _run_agent(
            state, "Web Researcher", web_researcher,
            idea=idea, idea_analysis=state.idea_analysis
        )

        results = await asyncio.gather(market_task, arch_task, ux_task, web_task)
        state.market_research = results[0]
        state.architecture = results[1]
        state.ux_plan = results[2]
        state.web_research = results[3]

        # Step 3: @listen(parallel_agents) — Project Planner
        state.project_plan = await _run_agent(
            state, "Project Planner", project_planner,
            idea=idea,
            idea_analysis=state.idea_analysis,
            architecture=state.architecture,
            ux_plan=state.ux_plan,
        )

        # Step 4: @listen(project_planner) — Critic
        state.critique = await _run_agent(
            state, "Critic", critic,
            idea=idea,
            idea_analysis=state.idea_analysis,
            market_research=state.market_research,
            architecture=state.architecture,
            ux_plan=state.ux_plan,
            project_plan=state.project_plan,
        )

        state.status = "completed"
        state.completed_at = datetime.now(timezone.utc).isoformat()
        logger.info(f"Pipeline completed for session {state.session_id}")

    except Exception as e:
        state.status = "error"
        logger.error(f"Pipeline error: {e}")


# ─────────────── SSE Streaming ───────────────

async def stream_pipeline(state: PipelineState):
    """Stream agent progress via Server-Sent Events."""
    agent_order = [
        "Idea Analyst", "Web Researcher", "Market Researcher", "System Architect",
        "UX Advisor", "Project Planner", "Critic"
    ]

    yield f"data: {json.dumps({'type': 'start', 'session_id': state.session_id, 'idea': state.idea})}\n\n"

    seen_completed = set()
    while state.status == "running":
        for name in agent_order:
            if name in state.agents and name not in seen_completed:
                a = state.agents[name]
                if a.status in ("completed", "error"):
                    seen_completed.add(name)
                    yield f"data: {json.dumps({'type': 'agent_done', 'agent': name, 'status': a.status, 'output': a.output, 'elapsed_ms': a.elapsed_ms, 'error': a.error})}\n\n"
                elif a.status == "running" and name not in seen_completed:
                    yield f"data: {json.dumps({'type': 'agent_running', 'agent': name})}\n\n"
        await asyncio.sleep(0.5)

    # Final flush
    for name in agent_order:
        if name not in seen_completed and name in state.agents:
            a = state.agents[name]
            seen_completed.add(name)
            yield f"data: {json.dumps({'type': 'agent_done', 'agent': name, 'status': a.status, 'output': a.output, 'elapsed_ms': a.elapsed_ms, 'error': a.error})}\n\n"

    yield f"data: {json.dumps({'type': 'complete', 'session_id': state.session_id, 'status': state.status})}\n\n"


# ─────────────── Endpoints ───────────────

@app.get("/")
async def root():
    return {"service": "Project Studio", "status": "running", "mode": "multi_agent_pipeline", "version": "2.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "project-studio", "agents": 7}


@app.post("/analyze")
async def analyze_project(request: ProjectRequest):
    """
    Start the full 7-agent pipeline analysis.
    Returns complete results (waits for all agents to finish).
    """
    session_id = str(uuid.uuid4())
    # Concatenate uploaded document contents
    doc_text = ""
    if request.documents:
        for doc in request.documents:
            doc_text += f"\n--- {doc.filename} ---\n{doc.content}\n"
    state = PipelineState(
        session_id=session_id,
        idea=request.description,
        context=request.context or "",
        documents=doc_text,
        started_at=datetime.now(timezone.utc).isoformat(),
    )
    sessions[session_id] = state

    await run_pipeline(state)

    return {
        "session_id": session_id,
        "status": state.status,
        "started_at": state.started_at,
        "completed_at": state.completed_at,
        "agents": {
            name: {
                "status": a.status,
                "output": a.output,
                "elapsed_ms": a.elapsed_ms,
                "error": a.error,
            }
            for name, a in state.agents.items()
        },
    }


@app.post("/analyze/stream")
async def analyze_project_stream(request: ProjectRequest):
    """
    Start the pipeline and stream progress via SSE.
    Each agent completion is sent as a server-sent event.
    """
    session_id = str(uuid.uuid4())
    doc_text = ""
    if request.documents:
        for doc in request.documents:
            doc_text += f"\n--- {doc.filename} ---\n{doc.content}\n"
    state = PipelineState(
        session_id=session_id,
        idea=request.description,
        context=request.context or "",
        documents=doc_text,
        started_at=datetime.now(timezone.utc).isoformat(),
    )
    sessions[session_id] = state

    asyncio.create_task(run_pipeline(state))

    return StreamingResponse(
        stream_pipeline(state),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get the current state of a pipeline session."""
    state = sessions.get(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": state.session_id,
        "status": state.status,
        "started_at": state.started_at,
        "completed_at": state.completed_at,
        "agents": {
            name: {
                "status": a.status,
                "output": a.output,
                "elapsed_ms": a.elapsed_ms,
                "error": a.error,
            }
            for name, a in state.agents.items()
        },
    }


# Legacy mock endpoints (backward compatible)

@app.post("/agent/idea-analyst")
async def legacy_idea_analyst(request: ProjectRequest):
    result = await idea_analyst(request.description, request.context or "")
    return result


@app.post("/agent/researcher")
async def legacy_researcher(request: ProjectRequest):
    result = await market_researcher(request.description)
    return result


@app.post("/agent/planner")
async def legacy_planner(request: ProjectRequest):
    result = await project_planner(request.description)
    return result


if __name__ == "__main__":
    host = os.getenv("SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("SERVICE_PORT", "8012"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
