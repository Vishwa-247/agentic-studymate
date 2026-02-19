"""
Evaluator Service - Scorer
Handles LLM calls for scoring user answers.
Uses Groq primary with OpenRouter fallback.
JSON+Extract parsing strategy for robustness.
"""

import json
import logging
import os
import re
from typing import Any, Dict, Optional

import httpx

from prompts import build_scoring_prompt

logger = logging.getLogger(__name__)

# LLM Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

# Scoring fields
SCORE_FIELDS = ["clarity", "tradeoffs", "adaptability", "failure_awareness", "dsa_predict"]


def _extract_json_block(text: str) -> Optional[str]:
    """Extract JSON block from text using regex (fallback strategy)."""
    # Try to find JSON object pattern
    patterns = [
        r'\{[^{}]*"clarity"[^{}]*\}',  # Simple object with clarity
        r'\{[\s\S]*?\}',  # Any JSON object
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(0)
    return None


def _parse_scores(content: str) -> Dict[str, Optional[float]]:
    """
    Parse LLM response into scores dict.
    Uses JSON+Extract strategy: try direct parse, then regex extract.
    """
    scores = {field: None for field in SCORE_FIELDS}
    
    # Strategy 1: Direct JSON parse
    try:
        data = json.loads(content.strip())
        for field in SCORE_FIELDS:
            if field in data:
                val = data[field]
                if val is not None:
                    scores[field] = float(val)
        return scores
    except (json.JSONDecodeError, ValueError):
        pass
    
    # Strategy 2: Extract JSON block from text
    json_block = _extract_json_block(content)
    if json_block:
        try:
            data = json.loads(json_block)
            for field in SCORE_FIELDS:
                if field in data:
                    val = data[field]
                    if val is not None:
                        scores[field] = float(val)
            return scores
        except (json.JSONDecodeError, ValueError):
            pass
    
    # Both failed - return nulls
    logger.warning(f"Failed to parse scores from LLM response: {content[:200]}")
    return scores


async def _call_groq(prompt: str) -> Optional[str]:
    """Call Groq API for scoring."""
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set")
        return None
    
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": 500
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Groq API error: {response.status_code} - {response.text[:200]}")
                return None
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    except Exception as e:
        logger.error(f"Groq API exception: {e}")
        return None


async def _call_openrouter(prompt: str) -> Optional[str]:
    """Call OpenRouter API as fallback."""
    if not OPENROUTER_API_KEY:
        logger.warning("OPENROUTER_API_KEY not set")
        return None
    
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": f"meta-llama/{MODEL}",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": 500
                }
            )
            
            if response.status_code != 200:
                logger.error(f"OpenRouter API error: {response.status_code} - {response.text[:200]}")
                return None
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    except Exception as e:
        logger.error(f"OpenRouter API exception: {e}")
        return None


async def score(question: str, answer: str) -> Dict[str, Optional[float]]:
    """
    Score a user's answer using LLM.
    Returns dict with 5 fields (null if scoring failed).
    
    Flow:
    1. Build prompt with question + answer
    2. Try Groq primary
    3. On failure, try OpenRouter fallback
    4. Parse JSON (with extract fallback)
    5. Return scores dict
    """
    prompt = build_scoring_prompt(question, answer)
    
    # Try Groq first
    content = await _call_groq(prompt)
    
    # Fallback to OpenRouter
    if content is None:
        logger.info("Groq failed, trying OpenRouter fallback")
        content = await _call_openrouter(prompt)
    
    # Both failed - return nulls
    if content is None:
        logger.error("Both LLM providers failed, returning null scores")
        return {field: None for field in SCORE_FIELDS}
    
    # Parse scores
    return _parse_scores(content)
