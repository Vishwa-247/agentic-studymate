"""
Project Studio — 6-Agent Pipeline
===================================
Each agent is a async function that calls Groq LLM with a specific role/goal.
Inspired by CrewAI Flow pattern from book-writer-flow, adapted to use Groq directly.

Agents:
1. Idea Analyst — Validates & breaks down the project idea
2. Market Researcher — Finds competitors, gaps, opportunities
3. System Architect — Designs tech stack & architecture
4. UX Advisor — Plans screens, user flows, wireframe suggestions
5. Project Planner — Creates milestones, sprints, tasks
6. Critic — Reviews all outputs, finds gaps, suggests improvements
"""

import asyncio
import logging
import os
from typing import Any, Dict, List

import httpx

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


async def _call_groq(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    """Call Groq LLM and return the text response."""
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not set")

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": temperature,
                "max_tokens": 2048,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


# ─────────────── Agent 1: Idea Analyst ───────────────

async def idea_analyst(idea: str, context: str = "") -> Dict[str, Any]:
    """Validate and break down the project idea."""
    system = (
        "You are an expert startup idea analyst. Your job is to validate a project idea, "
        "identify the core problem it solves, the target audience, key value propositions, "
        "and give a feasibility score (0-100). Be specific and actionable.\n"
        "Respond in this JSON-like structured format:\n"
        "SUMMARY: ...\nTARGET_AUDIENCE: ...\nCORE_PROBLEM: ...\nVALUE_PROPOSITIONS:\n- ...\n"
        "FEASIBILITY_SCORE: X/100\nRISKS:\n- ...\nRECOMMENDATION: ..."
    )
    user = f"Project idea: {idea}"
    if context:
        user += f"\n\nAdditional context: {context}"

    output = await _call_groq(system, user, temperature=0.5)
    return {"agent": "Idea Analyst", "status": "completed", "output": output}


# ─────────────── Agent 2: Market Researcher ───────────────

async def market_researcher(idea: str, idea_analysis: str = "") -> Dict[str, Any]:
    """Research the market, competitors, and opportunities."""
    system = (
        "You are a senior market research analyst. Given a project idea and its analysis, "
        "identify top competitors, market gaps, unique selling points, and potential "
        "monetization strategies. Be specific with competitor names and features.\n"
        "Format:\nCOMPETITORS:\n- Name: ... | Strengths: ... | Weaknesses: ...\n"
        "MARKET_GAPS:\n- ...\nUNIQUE_ANGLES:\n- ...\nMONETIZATION:\n- ...\n"
        "MARKET_SIZE_ESTIMATE: ..."
    )
    user = f"Project idea: {idea}\n\nIdea analysis:\n{idea_analysis}"
    output = await _call_groq(system, user, temperature=0.6)
    return {"agent": "Market Researcher", "status": "completed", "output": output}


# ─────────────── Agent 3: System Architect ───────────────

async def system_architect(idea: str, idea_analysis: str = "", market_research: str = "") -> Dict[str, Any]:
    """Design the technical architecture and tech stack."""
    system = (
        "You are a senior software architect. Design the technical architecture for the project. "
        "Include: recommended tech stack (frontend, backend, database, AI/ML, infra), "
        "system architecture diagram description, API design overview, "
        "database schema suggestions, and scalability considerations.\n"
        "Format:\nTECH_STACK:\n  Frontend: ...\n  Backend: ...\n  Database: ...\n  AI/ML: ...\n  Infra: ...\n"
        "ARCHITECTURE: ...\nAPI_DESIGN:\n- ...\nDATABASE_SCHEMA:\n- ...\nSCALABILITY: ..."
    )
    user = (
        f"Project idea: {idea}\n\n"
        f"Idea analysis:\n{idea_analysis}\n\n"
        f"Market research:\n{market_research}"
    )
    output = await _call_groq(system, user, temperature=0.5)
    return {"agent": "System Architect", "status": "completed", "output": output}


# ─────────────── Agent 4: UX Advisor ───────────────

async def ux_advisor(idea: str, idea_analysis: str = "", architecture: str = "") -> Dict[str, Any]:
    """Plan user experience, screens, and user flows."""
    system = (
        "You are a senior UX/UI designer. Plan the user experience for the project. "
        "Include: core screens list, user flow descriptions, key UI components, "
        "accessibility considerations, and mobile responsiveness strategy.\n"
        "Format:\nCORE_SCREENS:\n1. Screen Name — Purpose — Key Elements\n...\n"
        "USER_FLOWS:\n1. Flow Name: Step → Step → ...\n...\n"
        "KEY_COMPONENTS:\n- ...\nACCESSIBILITY: ...\nMOBILE_STRATEGY: ..."
    )
    user = (
        f"Project idea: {idea}\n\n"
        f"Idea analysis:\n{idea_analysis}\n\n"
        f"Architecture:\n{architecture}"
    )
    output = await _call_groq(system, user, temperature=0.7)
    return {"agent": "UX Advisor", "status": "completed", "output": output}


# ─────────────── Agent 5: Project Planner ───────────────

async def project_planner(
    idea: str,
    idea_analysis: str = "",
    architecture: str = "",
    ux_plan: str = "",
) -> Dict[str, Any]:
    """Create project milestones, sprints, and task breakdown."""
    system = (
        "You are a senior project manager / scrum master. Create a detailed project plan "
        "with milestones, sprint breakdown (2-week sprints), and specific tasks. "
        "Include time estimates and dependencies.\n"
        "Format:\nMILESTONES:\n1. Milestone Name (Week X-Y): ...\n...\n"
        "SPRINT_PLAN:\nSprint 1 (Week 1-2):\n- Task: ... | Estimate: ...h | Depends on: ...\n...\n"
        "CRITICAL_PATH: ...\nTOTAL_ESTIMATE: ... weeks"
    )
    user = (
        f"Project idea: {idea}\n\n"
        f"Idea analysis:\n{idea_analysis}\n\n"
        f"Architecture:\n{architecture}\n\n"
        f"UX plan:\n{ux_plan}"
    )
    output = await _call_groq(system, user, temperature=0.5)
    return {"agent": "Project Planner", "status": "completed", "output": output}


# ─────────────── Agent 6: Critic ───────────────

async def critic(
    idea: str,
    idea_analysis: str = "",
    market_research: str = "",
    architecture: str = "",
    ux_plan: str = "",
    project_plan: str = "",
) -> Dict[str, Any]:
    """Review all agent outputs and provide constructive criticism."""
    system = (
        "You are a harsh but constructive tech startup critic and CTO advisor. "
        "Review ALL the analysis from the other agents. Find gaps, contradictions, "
        "over-optimistic estimates, missing considerations, and suggest improvements. "
        "Be specific and actionable. Rate overall readiness (0-100).\n"
        "Format:\nSTRENGTHS:\n- ...\nWEAKNESSES:\n- ...\nMISSING:\n- ...\n"
        "CONTRADICTIONS:\n- ...\nIMPROVEMENTS:\n- ...\nREADINESS_SCORE: X/100\n"
        "VERDICT: ..."
    )
    user = (
        f"Project idea: {idea}\n\n"
        f"=== IDEA ANALYSIS ===\n{idea_analysis}\n\n"
        f"=== MARKET RESEARCH ===\n{market_research}\n\n"
        f"=== ARCHITECTURE ===\n{architecture}\n\n"
        f"=== UX PLAN ===\n{ux_plan}\n\n"
        f"=== PROJECT PLAN ===\n{project_plan}"
    )
    output = await _call_groq(system, user, temperature=0.6)
    return {"agent": "Critic", "status": "completed", "output": output}


# ─────────────── Agent 7: Web Researcher ───────────────

BRAVE_SEARCH_API_KEY = os.getenv("BRAVE_SEARCH_API_KEY")
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")


async def _brave_search(query: str, count: int = 5) -> list:
    """Search the web using Brave Search API."""
    if not BRAVE_SEARCH_API_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://api.search.brave.com/res/v1/web/search",
                headers={
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip",
                    "X-Subscription-Token": BRAVE_SEARCH_API_KEY,
                },
                params={"q": query, "count": count, "freshness": "py"},
            )
            resp.raise_for_status()
            data = resp.json()
            results = []
            for item in data.get("web", {}).get("results", [])[:count]:
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "description": item.get("description", ""),
                })
            return results
    except Exception as e:
        logger.warning(f"Brave search failed: {e}")
        return []


async def _firecrawl_scrape(url: str) -> str:
    """Scrape a single URL using Firecrawl for deeper content."""
    if not FIRECRAWL_API_KEY:
        return ""
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                "https://api.firecrawl.dev/v1/scrape",
                headers={
                    "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "url": url,
                    "formats": ["markdown"],
                    "onlyMainContent": True,
                    "waitFor": 2000,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                md = data.get("data", {}).get("markdown", "")
                # Truncate to avoid token overflow
                return md[:2000] if md else ""
    except Exception as e:
        logger.warning(f"Firecrawl scrape failed for {url}: {e}")
    return ""


async def web_researcher(idea: str, idea_analysis: str = "") -> Dict[str, Any]:
    """
    Search the web for the latest resources, tools, competitors, and trends
    related to the project idea. Uses Brave Search + optional Firecrawl deep-scrape.
    """
    # Generate smart search queries from the idea
    query_prompt = (
        "Given this project idea, generate 3 short search queries to find: "
        "(1) Latest similar tools/products launched in 2025-2026, "
        "(2) Best open-source frameworks or APIs relevant to building this, "
        "(3) Market trends and user needs related to this idea. "
        "Return ONLY 3 queries, one per line, no numbering."
    )
    queries_raw = await _call_groq(query_prompt, f"Idea: {idea}", temperature=0.3)
    queries = [q.strip() for q in queries_raw.strip().split("\n") if q.strip()][:3]

    # Run all searches in parallel
    all_results = []
    search_tasks = [_brave_search(q, count=4) for q in queries]
    search_sets = await asyncio.gather(*search_tasks)
    for results in search_sets:
        all_results.extend(results)

    # Deduplicate by URL
    seen_urls = set()
    unique_results = []
    for r in all_results:
        if r["url"] not in seen_urls:
            seen_urls.add(r["url"])
            unique_results.append(r)

    # Deep-scrape the top 2 most relevant results for richer context
    deep_content = ""
    if unique_results[:2]:
        scrape_tasks = [_firecrawl_scrape(r["url"]) for r in unique_results[:2]]
        scraped = await asyncio.gather(*scrape_tasks)
        for i, content in enumerate(scraped):
            if content:
                deep_content += f"\n--- Deep content from {unique_results[i]['title']} ---\n{content}\n"

    # Format search results
    search_summary = ""
    for i, r in enumerate(unique_results):
        search_summary += f"{i+1}. **{r['title']}**\n   {r['url']}\n   {r['description']}\n\n"

    # Now synthesize with LLM
    system = (
        "You are a senior technology researcher. You've been given live web search results "
        "about a project idea. Synthesize findings into:\n"
        "LATEST_TOOLS: Tools, APIs, or products launched in 2024-2026 relevant to this idea\n"
        "OPEN_SOURCE: Best open-source repos, frameworks, or libraries to use\n"
        "TRENDS: Current market trends and user behavioral patterns\n"
        "KEY_INSIGHTS: Non-obvious insights from the research\n"
        "RESOURCES: Top links with brief descriptions\n"
        "RECOMMENDATION: What to build with, and what to avoid\n\n"
        "Be specific — include real names, real URLs, real version numbers."
    )
    user = (
        f"Project idea: {idea}\n\n"
        f"Idea analysis:\n{idea_analysis}\n\n"
        f"=== LIVE WEB SEARCH RESULTS ===\n{search_summary}\n"
    )
    if deep_content:
        user += f"\n=== DEEP-SCRAPED CONTENT ===\n{deep_content}\n"

    output = await _call_groq(system, user, temperature=0.4)

    # Append the raw sources at the bottom
    output += "\n\n---\n📎 **Sources searched:**\n"
    for q in queries:
        output += f"- 🔍 \"{q}\"\n"
    for r in unique_results[:8]:
        output += f"- [{r['title']}]({r['url']})\n"

    return {"agent": "Web Researcher", "status": "completed", "output": output}
