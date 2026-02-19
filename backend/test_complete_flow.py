#!/usr/bin/env python3
"""
Complete test script for resume upload flow
Tests the entire pipeline: upload -> extract -> apply -> success
"""

import requests
import json
import sys
import os
import time

def test_complete_resume_flow():
    """Test the complete resume upload and processing flow"""
    
    print("🧪 Testing Complete Resume Upload Flow...")
    print("=" * 60)
    
    # Test configuration
    base_url = "http://localhost:8006"
    test_user_id = "test-user-complete-flow"
    
    # Step 1: Check service health
    print("📋 Step 1: Checking service health...")
    try:
        health_response = requests.get(f"{base_url}/health", timeout=5)
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"✅ Service status: {health_data.get('status', 'unknown')}")
            print(f"📊 Database: {health_data.get('database', 'unknown')}")
            print(f"🤖 AI Status: {health_data.get('ai_status', 'unknown')}")
        else:
            print(f"❌ Health check failed: {health_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Step 2: Test with a sample resume file
    print("\n📋 Step 2: Testing resume upload and extraction...")
    test_file_path = "test_resume.pdf"
    
    if not os.path.exists(test_file_path):
        print(f"⚠️ Test file {test_file_path} not found")
        print("💡 Create a test PDF file or update the path")
        return False
    
    try:
        with open(test_file_path, 'rb') as f:
            files = {'resume': (test_file_path, f, 'application/pdf')}
            data = {'user_id': test_user_id}
            
            print("🚀 Uploading resume and extracting data...")
            response = requests.post(f"{base_url}/extract-profile", files=files, data=data, timeout=60)
            
            print(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Resume extraction successful!")
                print(f"📊 Success: {result.get('success', False)}")
                print(f"📝 Message: {result.get('message', 'No message')}")
                print(f"🎯 Confidence: {result.get('confidence_score', 'N/A')}")
                
                if 'extracted_data' in result:
                    extracted = result['extracted_data']
                    print(f"👤 Personal info: {extracted.get('personalInfo', {})}")
                    print(f"🎓 Education entries: {len(extracted.get('education', []))}")
                    print(f"💼 Experience entries: {len(extracted.get('experience', []))}")
                    print(f"🛠️ Skills: {len(extracted.get('skills', []))}")
                
                # Step 3: Test apply extracted data
                print("\n📋 Step 3: Testing apply extracted data...")
                if result.get('extracted_data'):
                    apply_response = requests.post(
                        f"{base_url}/profile/{test_user_id}/apply-extraction",
                        json=result['extracted_data'],
                        headers={'Content-Type': 'application/json'},
                        timeout=30
                    )
                    
                    print(f"📡 Apply response status: {apply_response.status_code}")
                    
                    if apply_response.status_code == 200:
                        apply_result = apply_response.json()
                        print("✅ Profile data applied successfully!")
                        print(f"📝 Apply message: {apply_result.get('message', 'No message')}")
                    else:
                        print(f"❌ Apply data failed: {apply_response.status_code}")
                        try:
                            error_data = apply_response.json()
                            print(f"📋 Error details: {error_data}")
                        except:
                            print(f"📋 Raw response: {apply_response.text}")
                        return False
                
                return True
            else:
                print(f"❌ Resume extraction failed with status {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"📋 Error details: {error_data}")
                except:
                    print(f"📋 Raw response: {response.text}")
                return False
                
    except requests.exceptions.Timeout:
        print("⏰ Request timed out - AI processing may be slow")
        return False
    except Exception as e:
        print(f"❌ Request error: {e}")
        return False

def test_database_migration():
    """Test if database migration was applied correctly"""
    print("\n📋 Testing Database Migration...")
    
    # This would need to be run in Supabase SQL editor
    print("💡 To test database migration, run this SQL in Supabase:")
    print("""
    -- Check current column definition
    SELECT column_name, data_type, numeric_precision, numeric_scale 
    FROM information_schema.columns 
    WHERE table_name = 'resume_extractions' 
    AND column_name = 'confidence_score';
    
    -- Test inserting a value
    INSERT INTO resume_extractions (user_id, confidence_score, status) 
    VALUES ('test-migration', 0.8888, 'test') 
    ON CONFLICT DO NOTHING;
    
    -- Check if it worked
    SELECT confidence_score FROM resume_extractions 
    WHERE user_id = 'test-migration';
    """)

if __name__ == "__main__":
    print("🔧 Complete Resume Upload Flow Test")
    print("=" * 60)
    
    # Test complete flow
    success = test_complete_resume_flow()
    
    # Show database migration instructions
    test_database_migration()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ All tests passed! Resume upload flow is working correctly.")
        print("\n🎯 Next steps:")
        print("1. Apply the database migration in Supabase SQL editor")
        print("2. Restart the backend service")
        print("3. Test with a real resume file")
    else:
        print("❌ Tests failed - check the logs above")
        print("\n🔧 Troubleshooting:")
        print("1. Ensure backend service is running: python start-services/start_profile_service.py")
        print("2. Check backend/.env file has correct GROQ_API_KEY and SUPABASE credentials")
        print("3. Apply database migration: supabase/migrations/fix_confidence_score_column.sql")
        sys.exit(1)
