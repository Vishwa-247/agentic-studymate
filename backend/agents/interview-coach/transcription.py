import os
import uuid
import tempfile
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)


async def transcribe_audio_deepgram(audio_blob: bytes, content_type: str = "audio/webm") -> str:
    """Transcribe audio using Deepgram API (primary)."""
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        raise ValueError("DEEPGRAM_API_KEY not configured")

    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": content_type,
    }
    params = {
        "model": "nova-2",
        "smart_format": "true",
        "punctuate": "true",
        "language": "en",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post("https://api.deepgram.com/v1/listen", headers=headers, params=params, content=audio_blob)
        resp.raise_for_status()
        data = resp.json()
        transcript = data.get("results", {}).get("channels", [{}])[0].get("alternatives", [{}])[0].get("transcript", "")
        if transcript:
            logger.debug(f"Deepgram transcript: {transcript[:80]}...")
        return transcript


async def transcribe_audio_groq(audio_blob: bytes, content_type: str = "audio/webm") -> str:
    """Transcribe audio using Groq Whisper (fallback)."""
    from groq import Groq  # lazy import

    api_key = os.getenv("GROQ_WHISPER_KEY") or os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_WHISPER_KEY / GROQ_API_KEY not configured")

    client = Groq(api_key=api_key)
    # Use tempfile for cross-platform compatibility (Windows + Linux)
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".webm")
    try:
        with os.fdopen(tmp_fd, "wb") as f:
            f.write(audio_blob)
        with open(tmp_path, "rb") as fh:
            transcription = client.audio.transcriptions.create(
                file=fh,
                model="whisper-large-v3",
                response_format="text",
                language="en",
            )
        if transcription:
            logger.debug(f"Groq transcript: {str(transcription)[:80]}...")
        return str(transcription) if transcription else ""
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


async def transcribe_audio(audio_blob: bytes, content_type: Optional[str] = None) -> str:
    """Try Deepgram, then fallback to Groq Whisper."""
    if len(audio_blob) < 1000:
        logger.debug("Audio too short to transcribe, skipping")
        return ""
    try:
        result = await transcribe_audio_deepgram(audio_blob, content_type or "audio/webm")
        if result:
            return result
        logger.debug("Deepgram returned empty, trying Groq fallback")
    except Exception as e:
        logger.warning(f"Deepgram failed ({e}), trying Groq fallback")
    try:
        return await transcribe_audio_groq(audio_blob, content_type or "audio/webm")
    except Exception as e:
        logger.error(f"Both transcription backends failed: {e}")
        return ""
