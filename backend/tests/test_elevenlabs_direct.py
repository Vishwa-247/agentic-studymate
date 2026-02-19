#!/usr/bin/env python3
"""Direct ElevenLabs API Key Test"""
import asyncio
import httpx
from pathlib import Path
from dotenv import load_dotenv
import os

# Load .env
backend_root = Path(__file__).parent.parent
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

async def test_key():
    key = os.getenv("ELEVENLABS_API_KEY")
    
    if not key:
        print("❌ ELEVENLABS_API_KEY not found in .env")
        return
    
    print(f"🔑 Testing key: {key[:10]}...{key[-10:]}")
    print(f"📏 Key length: {len(key)} characters")
    print(f"✅ Format check: {'PASS' if key.startswith('sk_') else 'FAIL'}")
    print()
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            print("🌐 Calling ElevenLabs API...")
            response = await client.get(
                "https://api.elevenlabs.io/v1/user",
                headers={"xi-api-key": key}
            )
            
            print(f"📊 Status Code: {response.status_code}")
            print(f"📄 Response: {response.text[:200]}")
            print()
            
            if response.status_code == 200:
                data = response.json()
                print("✅ SUCCESS! Key is valid")
                print(f"   Subscription: {data.get('subscription', {}).get('tier', 'unknown')}")
                print(f"   Character count: {data.get('subscription', {}).get('character_count', 'unknown')}")
            elif response.status_code == 401:
                print("❌ FAILED: 401 Unauthorized")
                print("   Possible reasons:")
                print("   - Key is expired or revoked")
                print("   - Key doesn't have required permissions")
                print("   - Account associated with key has issues")
                print("   - Check your ElevenLabs dashboard: https://elevenlabs.io/app/settings/api-keys")
            elif response.status_code == 429:
                print("⚠️ Rate limited (but key is valid!)")
            else:
                print(f"❌ Unexpected status: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_key())
