#!/usr/bin/env python3
"""
Quick verification script to check if backend services are ready for course generation.
Run this before testing the "Create Course" button.
"""

import os
import sys
import httpx
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Load .env
backend_root = Path(__file__).parent
env_path = backend_root / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print("✅ Found .env file")
else:
    print("❌ .env file not found! Please create it in the backend/ directory")

print("\n" + "="*60)
print("🔍 Backend Setup Verification")
print("="*60 + "\n")

# Check environment variables
print("📋 Environment Variables:")
required_vars = {
    "GEMINI_API_KEY": "Required for course generation",
    "SUPABASE_URL": "Required for database",
    "SUPABASE_SERVICE_ROLE_KEY": "Required for database access"
}
optional_vars = {
    "ELEVENLABS_API_KEY": "Optional: For audio generation",
    "BRAVE_SEARCH_API_KEY": "Optional: For web search",
    "GROQ_API_KEY": "Optional: For enhanced AI features"
}

missing_required = []
for var, desc in required_vars.items():
    value = os.getenv(var)
    if value:
        print(f"  ✅ {var}: {'*' * min(20, len(value))} ({desc})")
    else:
        print(f"  ❌ {var}: NOT SET ({desc})")
        missing_required.append(var)

for var, desc in optional_vars.items():
    value = os.getenv(var)
    if value:
        print(f"  ✅ {var}: {'*' * min(20, len(value))} ({desc})")
    else:
        print(f"  ⚠️  {var}: NOT SET ({desc})")

print()

# Check service endpoints
print("🌐 Service Health Checks:")

services = {
    "API Gateway": "http://localhost:8000",
    "Course Generation": "http://localhost:8008"
}

async def check_service(name, url):
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"{url}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ {name} ({url}): Running - {data.get('status', 'unknown')}")
                return True
            else:
                print(f"  ❌ {name} ({url}): Responded with status {response.status_code}")
                return False
    except httpx.ConnectError:
        print(f"  ❌ {name} ({url}): NOT RUNNING (Connection refused)")
        return False
    except Exception as e:
        print(f"  ❌ {name} ({url}): Error - {str(e)[:50]}")
        return False

async def check_all():
    results = []
    for name, url in services.items():
        result = await check_service(name, url)
        results.append(result)
    return all(results)

print()
all_services_running = asyncio.run(check_all())

print()
print("="*60)
print("📊 Summary")
print("="*60)

if missing_required:
    print(f"\n❌ Missing required environment variables: {', '.join(missing_required)}")
    print("   → Add these to backend/.env file")
else:
    print("\n✅ All required environment variables are set")

if all_services_running:
    print("✅ All services are running")
    print("\n🎉 Ready to test course generation!")
    print("   → Go to http://localhost:5173/course-generator")
    print("   → Enter a topic and click 'Create Course'")
else:
    print("\n❌ Some services are not running")
    print("   → Start services with: backend\\start.bat")
    print("   → Or manually start:")
    print("     1. API Gateway: cd backend\\api-gateway && python main.py")
    print("     2. Course Generation: cd backend\\agents\\course-generation && python main.py")

print()

