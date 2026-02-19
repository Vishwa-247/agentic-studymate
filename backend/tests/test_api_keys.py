#!/usr/bin/env python3
"""
API Keys Test Script
====================
Tests all API keys to verify they're working correctly.
Run: python backend/tests/test_api_keys.py
"""

import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv
import httpx

# Load .env from backend root
backend_root = Path(__file__).parent.parent
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

# Test results
results = {
    "passed": [],
    "failed": [],
    "skipped": []
}

def print_result(name: str, status: str, message: str = ""):
    """Print test result with color coding"""
    status_icons = {
        "✅ PASS": "✅",
        "❌ FAIL": "❌",
        "⚠️ SKIP": "⚠️"
    }
    icon = status_icons.get(status, "•")
    print(f"{icon} {name}: {status}")
    if message:
        print(f"   {message}")
    
    if status == "✅ PASS":
        results["passed"].append(name)
    elif status == "❌ FAIL":
        results["failed"].append(name)
    else:
        results["skipped"].append(name)

async def test_gemini_key(api_key: str, key_name: str) -> bool:
    """Test a Gemini API key"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={api_key}",
                json={
                    "contents": [{
                        "parts": [{"text": "Say 'Hello' in one word"}]
                    }]
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return True
            elif response.status_code == 429:
                print_result(key_name, "⚠️ SKIP", "Rate limited (this is OK - key is valid)")
                return True  # Rate limit means key is valid
            elif response.status_code == 400:
                print_result(key_name, "❌ FAIL", "Invalid API key format")
                return False
            elif response.status_code == 403:
                print_result(key_name, "❌ FAIL", "API key not authorized or invalid")
                return False
            else:
                print_result(key_name, "❌ FAIL", f"HTTP {response.status_code}: {response.text[:100]}")
                return False
    except Exception as e:
        print_result(key_name, "❌ FAIL", f"Error: {str(e)[:100]}")
        return False

async def test_elevenlabs_key(api_key: str) -> bool:
    """Test ElevenLabs API key"""
    try:
        # Check if key starts with 'sk_' (ElevenLabs format)
        if not api_key.startswith('sk_'):
            print_result("ElevenLabs API", "❌ FAIL", f"Invalid key format. Should start with 'sk_'. Got: {api_key[:10]}...")
            return False
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.elevenlabs.io/v1/user",
                headers={"xi-api-key": api_key}
            )
            
            if response.status_code == 200:
                data = response.json()
                subscription = data.get("subscription", {})
                print_result("ElevenLabs API", "✅ PASS", f"Key valid. Subscription: {subscription.get('tier', 'unknown')}")
                return True
            elif response.status_code == 401:
                print_result("ElevenLabs API", "❌ FAIL", f"Invalid API key (401 Unauthorized). Check if key is correct.")
                return False
            elif response.status_code == 429:
                print_result("ElevenLabs API", "⚠️ SKIP", "Rate limited (key is valid but hit limit)")
                return True  # Rate limit means key is valid
            else:
                print_result("ElevenLabs API", "❌ FAIL", f"HTTP {response.status_code}: {response.text[:100]}")
                return False
    except Exception as e:
        print_result("ElevenLabs API", "❌ FAIL", f"Error: {str(e)[:100]}")
        return False

async def test_brave_key(api_key: str) -> bool:
    """Test Brave Search API key"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.search.brave.com/res/v1/web/search?q=test",
                headers={"X-Subscription-Token": api_key}
            )
            
            if response.status_code == 200:
                return True
            elif response.status_code == 401:
                print_result("Brave Search API", "❌ FAIL", "Invalid API key")
                return False
            else:
                print_result("Brave Search API", "❌ FAIL", f"HTTP {response.status_code}")
                return False
    except Exception as e:
        print_result("Brave Search API", "❌ FAIL", f"Error: {str(e)[:100]}")
        return False

async def test_supabase_connection(url: str, key: str) -> bool:
    """Test Supabase connection"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{url}/rest/v1/",
                headers={
                    "apikey": key,
                    "Authorization": f"Bearer {key}"
                }
            )
            
            if response.status_code in [200, 301, 302]:
                return True
            else:
                print_result("Supabase Connection", "❌ FAIL", f"HTTP {response.status_code}")
                return False
    except Exception as e:
        print_result("Supabase Connection", "❌ FAIL", f"Error: {str(e)[:100]}")
        return False

async def run_all_tests():
    """Run all API key tests"""
    print("=" * 60)
    print("🔍 API Keys Test Suite")
    print("=" * 60)
    print()
    
    # Test Supabase
    print("📊 Testing Supabase...")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
    
    if supabase_url and supabase_key:
        if await test_supabase_connection(supabase_url, supabase_key):
            print_result("Supabase Connection", "✅ PASS", f"Connected to {supabase_url}")
        else:
            print_result("Supabase Connection", "❌ FAIL")
    else:
        print_result("Supabase Connection", "❌ FAIL", "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    
    print()
    
    # Test Gemini Keys
    print("🤖 Testing Gemini API Keys...")
    gemini_keys = []
    
    # Check for numbered keys first
    for i in range(1, 11):  # Check GEMINI_API_KEY_1 through GEMINI_API_KEY_10
        key = os.getenv(f"GEMINI_API_KEY_{i}")
        if key:
            gemini_keys.append((f"GEMINI_API_KEY_{i}", key))
    
    # Check for single key
    single_key = os.getenv("GEMINI_API_KEY")
    if single_key and not any("GEMINI_API_KEY_1" in name for name, _ in gemini_keys):
        gemini_keys.append(("GEMINI_API_KEY", single_key))
    
    if not gemini_keys:
        print_result("Gemini API Keys", "❌ FAIL", "No Gemini API keys found in .env")
    else:
        print(f"Found {len(gemini_keys)} Gemini API key(s)")
        for key_name, key_value in gemini_keys:
            if await test_gemini_key(key_value, key_name):
                print_result(key_name, "✅ PASS", "Key is valid and working")
            await asyncio.sleep(1)  # Rate limit protection
    
    print()
    
    # Test ElevenLabs
    print("🎙️ Testing ElevenLabs API...")
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    if elevenlabs_key:
        if await test_elevenlabs_key(elevenlabs_key):
            print_result("ElevenLabs API", "✅ PASS", "Key is valid and working")
    else:
        print_result("ElevenLabs API", "⚠️ SKIP", "Not configured (optional)")
    
    print()
    
    # Test Brave Search
    print("🔍 Testing Brave Search API...")
    brave_key = os.getenv("BRAVE_SEARCH_API_KEY") or os.getenv("BRAVE_API_KEY")
    if brave_key:
        if await test_brave_key(brave_key):
            print_result("Brave Search API", "✅ PASS", "Key is valid and working")
        else:
            print_result("Brave Search API", "❌ FAIL")
    else:
        print_result("Brave Search API", "⚠️ SKIP", "Not configured (optional)")
    
    print()
    
    # Summary
    print("=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    print(f"✅ Passed: {len(results['passed'])}")
    print(f"❌ Failed: {len(results['failed'])}")
    print(f"⚠️ Skipped: {len(results['skipped'])}")
    print()
    
    if results['failed']:
        print("❌ Failed Tests:")
        for name in results['failed']:
            print(f"   - {name}")
        print()
        return False
    
    if results['passed']:
        print("✅ All critical tests passed!")
        return True
    else:
        print("⚠️ No tests passed")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(run_all_tests())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test suite error: {e}")
        sys.exit(1)
