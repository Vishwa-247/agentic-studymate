#!/usr/bin/env python3
"""Test ElevenLabs API Key for TTS Generation (what we actually need)"""
import asyncio
import httpx
from pathlib import Path
from dotenv import load_dotenv
import os

# Load .env
backend_root = Path(__file__).parent.parent
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

async def test_tts():
    key = os.getenv("ELEVENLABS_API_KEY")
    
    if not key:
        print("❌ ELEVENLABS_API_KEY not found in .env")
        return
    
    print(f"🔑 Testing key: {key[:10]}...{key[-10:]}")
    print()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("🎙️ Testing TTS generation (what we actually need)...")
            
            # Test with a simple TTS request (what course generation uses)
            response = await client.post(
                "https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x",
                headers={
                    "xi-api-key": key,
                    "Content-Type": "application/json"
                },
                json={
                    "text": "Hello, this is a test.",
                    "model_id": "eleven_turbo_v2_5",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                }
            )
            
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                print("✅ SUCCESS! Key can generate TTS audio")
                print(f"   Audio data length: {len(response.content)} bytes")
                print("   ✅ This key will work for course generation!")
            elif response.status_code == 401:
                error_data = response.json() if response.headers.get("content-type") == "application/json" else {}
                print("❌ FAILED: 401 Unauthorized")
                print(f"   Error: {error_data.get('detail', {}).get('message', response.text[:200])}")
                print()
                print("   💡 Solution:")
                print("   1. Go to: https://elevenlabs.io/app/settings/api-keys")
                print("   2. Create a NEW API key with full permissions")
                print("   3. Or check if your account has TTS generation enabled")
            elif response.status_code == 429:
                print("⚠️ Rate limited (but key is valid!)")
                print("   ✅ This key will work for course generation!")
            else:
                print(f"❌ Unexpected status: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_tts())
