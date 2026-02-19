"""
Voice Agent for Interview Coach
================================
Adapted from real-time-voicebot pattern (ai-engineering-hub).
Provides STT (AssemblyAI) → LLM (Groq) → TTS (ElevenLabs) loop.

This module adds WebSocket-based voice interview capability.
The frontend can stream audio, get transcripts, and receive AI responses.
"""

import asyncio
import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel


class VoiceInterviewAgent:
    """
    Voice-based interview agent.
    
    Flow (from real-time-voicebot):
      1. User speaks → STT transcribes
      2. Transcript → LLM generates response
      3. Response → TTS generates audio
      4. Audio sent back to user
    """

    def __init__(self, interview_type: str = "technical", job_role: str = "Software Engineer"):
        self.interview_type = interview_type
        self.job_role = job_role
        self.conversation: list[dict] = []
        self._init_system_prompt()

    def _init_system_prompt(self):
        """Set up the interview coach system prompt."""
        self.system_prompt = f"""You are an expert {self.interview_type} interview coach conducting a mock interview for a {self.job_role} position.

Guidelines:
- Ask one question at a time
- Listen to the candidate's answer and provide brief, constructive feedback
- After feedback, ask the next question
- Be encouraging but honest about areas for improvement
- Keep responses concise (2-3 sentences for feedback, then the next question)
- Cover different aspects: problem-solving, communication, technical depth
- If the candidate struggles, offer hints but note it in your feedback

Start by introducing yourself and asking the first question."""

        self.conversation = [
            {"role": "system", "content": self.system_prompt}
        ]

    async def process_transcript(self, transcript: str) -> str:
        """Process a user's spoken transcript and generate AI response."""
        self.conversation.append({"role": "user", "content": transcript})

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": self.conversation,
                    "temperature": 0.7,
                    "max_tokens": 512,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            ai_response = data["choices"][0]["message"]["content"]

        self.conversation.append({"role": "assistant", "content": ai_response})
        return ai_response

    async def generate_tts_audio(self, text: str) -> Optional[bytes]:
        """Generate speech audio from text using ElevenLabs."""
        if not ELEVENLABS_API_KEY:
            logger.warning("ElevenLabs API key not configured — TTS unavailable")
            return None

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
                    headers={
                        "xi-api-key": ELEVENLABS_API_KEY,
                        "Content-Type": "application/json",
                    },
                    json={
                        "text": text,
                        "model_id": "eleven_monolingual_v1",
                        "voice_settings": {
                            "stability": 0.5,
                            "similarity_boost": 0.75,
                        },
                    },
                )
                resp.raise_for_status()
                return resp.content
        except Exception as e:
            logger.error(f"TTS generation failed: {e}")
            return None

    async def get_greeting(self) -> str:
        """Get the initial greeting from the AI interviewer."""
        return await self.process_transcript(
            "[The candidate has just joined the interview. Please introduce yourself and ask the first question.]"
        )

    def get_conversation_history(self) -> list[dict]:
        """Return conversation history (excluding system prompt)."""
        return [msg for msg in self.conversation if msg["role"] != "system"]

    def get_summary(self) -> dict:
        """Get a summary of the interview session."""
        user_messages = [m for m in self.conversation if m["role"] == "user"]
        ai_messages = [m for m in self.conversation if m["role"] == "assistant"]
        return {
            "interview_type": self.interview_type,
            "job_role": self.job_role,
            "total_exchanges": len(user_messages),
            "total_responses": len(ai_messages),
        }


# Factory
def create_voice_agent(interview_type: str = "technical", job_role: str = "Software Engineer") -> VoiceInterviewAgent:
    return VoiceInterviewAgent(interview_type=interview_type, job_role=job_role)
