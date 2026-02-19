"""
Integration Test for Evaluator and Orchestrator
Run this from backend directory: python test_integration.py
"""
import asyncio
import httpx

EVALUATOR_URL = "http://localhost:8010"
ORCHESTRATOR_URL = "http://localhost:8011"
TEST_USER_ID = "44444444-4444-4444-4444-444444444444"

async def run_test():
    print("=" * 60)
    print("🧪 StudyMate Integration Test")
    print("=" * 60)
    
    async with httpx.AsyncClient(timeout=30) as client:
        # Test 1: Health checks
        print("\n📋 Step 1: Health Checks")
        
        try:
            r1 = await client.get(f"{EVALUATOR_URL}/health")
            print(f"  Evaluator:    {r1.json()}")
        except Exception as e:
            print(f"  Evaluator:    ❌ FAILED - {e}")
            return
        
        try:
            r2 = await client.get(f"{ORCHESTRATOR_URL}/health")
            print(f"  Orchestrator: {r2.json()}")
        except Exception as e:
            print(f"  Orchestrator: ❌ FAILED - {e}")
            return
        
        # Test 2: Call Evaluator
        print("\n📋 Step 2: POST /evaluate")
        payload = {
            "user_id": TEST_USER_ID,
            "module": "test",
            "question": "What is a hash table?",
            "answer": "A data structure using key-value pairs with O(1) lookup"
        }
        print(f"  Payload: {payload}")
        
        try:
            r3 = await client.post(f"{EVALUATOR_URL}/evaluate", json=payload)
            print(f"  Response: {r3.json()}")
            if r3.json().get("status") == "ok":
                print("  ✅ Evaluator returned OK")
            else:
                print("  ⚠️ Unexpected response")
        except Exception as e:
            print(f"  ❌ FAILED - {e}")
            return
        
        # Test 3: Call Orchestrator
        print("\n📋 Step 3: GET /next")
        try:
            r4 = await client.get(f"{ORCHESTRATOR_URL}/next", params={"user_id": TEST_USER_ID})
            result = r4.json()
            print(f"  Response: {result}")
            print(f"  next_module: {result.get('next_module')}")
            print(f"  reason:      {result.get('reason')}")
            print("  ✅ Orchestrator returned routing decision")
        except Exception as e:
            print(f"  ❌ FAILED - {e}")
            return
        
        # Test 4: Check user state
        print("\n📋 Step 4: GET /state (debug)")
        try:
            r5 = await client.get(f"{ORCHESTRATOR_URL}/state/{TEST_USER_ID}")
            print(f"  User State: {r5.json()}")
            print("  ✅ State retrieved")
        except Exception as e:
            print(f"  ❌ FAILED - {e}")
        
        print("\n" + "=" * 60)
        print("✅ INTEGRATION TEST COMPLETE")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_test())
