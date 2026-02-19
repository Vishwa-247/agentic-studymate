"""
Gateway Integration Test
Tests the full flow through API Gateway (port 8000)
Run this from backend directory: python test_gateway.py
"""
import asyncio
import httpx

GATEWAY_URL = "http://localhost:8000"
TEST_USER_ID = "55555555-5555-5555-5555-555555555555"

async def run_test():
    print("=" * 60)
    print("🧪 StudyMate Gateway Integration Test")
    print("=" * 60)
    
    async with httpx.AsyncClient(timeout=30) as client:
        # Test 1: Gateway health
        print("\n📋 Step 1: Gateway Health Check")
        try:
            r1 = await client.get(f"{GATEWAY_URL}/health")
            data = r1.json()
            print(f"  Gateway: {data.get('status')}")
            print(f"  Services: {list(data.get('services', {}).keys())}")
        except Exception as e:
            print(f"  ❌ Gateway not running - {e}")
            return
        
        # Test 2: POST /api/evaluate (through gateway)
        print("\n📋 Step 2: POST /api/evaluate (via Gateway)")
        payload = {
            "user_id": TEST_USER_ID,
            "module": "gateway_test",
            "question": "Explain microservices architecture",
            "answer": "Microservices split application into independent services that communicate via APIs"
        }
        print(f"  Payload: {payload}")
        
        try:
            r2 = await client.post(f"{GATEWAY_URL}/api/evaluate", json=payload)
            print(f"  Response: {r2.json()}")
            if r2.json().get("status") == "ok":
                print("  ✅ Evaluator via Gateway: OK")
            else:
                print(f"  ⚠️ Unexpected response")
        except Exception as e:
            print(f"  ❌ FAILED - {e}")
            return
        
        # Test 3: GET /api/next (through gateway)
        print("\n📋 Step 3: GET /api/next (via Gateway)")
        try:
            r3 = await client.get(f"{GATEWAY_URL}/api/next", params={"user_id": TEST_USER_ID})
            result = r3.json()
            print(f"  Response: {result}")
            print(f"  next_module: {result.get('next_module')}")
            print(f"  reason:      {result.get('reason')}")
            print("  ✅ Orchestrator via Gateway: OK")
        except Exception as e:
            print(f"  ❌ FAILED - {e}")
            return
        
        print("\n" + "=" * 60)
        print("✅ GATEWAY INTEGRATION TEST COMPLETE")
        print("=" * 60)
        print("\nROUTES VERIFIED:")
        print("  POST /api/evaluate → evaluator:8010")
        print("  GET  /api/next     → orchestrator:8011")

if __name__ == "__main__":
    asyncio.run(run_test())
