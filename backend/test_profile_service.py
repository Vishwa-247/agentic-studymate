#!/usr/bin/env python3
"""
Test script for Profile Service backend
Tests the extract-profile endpoint independently
"""

import json
import os
import sys

import requests


def test_profile_service():
    """Test the Profile Service extract-profile endpoint"""
    
    # Test configuration
    base_url = "http://localhost:8006"
    endpoint = f"{base_url}/extract-profile"
    
    print("🧪 Testing Profile Service...")
    print(f"📍 Endpoint: {endpoint}")
    
    # Check if service is running
    try:
        health_response = requests.get(f"{base_url}/health", timeout=5)
        if health_response.status_code == 200:
            print("✅ Profile Service is running")
            health_data = health_response.json()
            print(f"📊 Service status: {health_data.get('status', 'unknown')}")
        else:
            print(f"⚠️ Health check failed: {health_response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Profile Service is not running!")
        print("💡 Start it with: python start-services/start_profile_service.py")
        return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test with a sample resume file
    test_file_path = "test_resume.pdf"
    
    if not os.path.exists(test_file_path):
        print(f"⚠️ Test file {test_file_path} not found")
        print("💡 Create a test PDF file or update the path")
        return False
    
    print(f"📁 Using test file: {test_file_path}")
    
    try:
        # Prepare test data
        with open(test_file_path, 'rb') as f:
            files = {'resume': (test_file_path, f, 'application/pdf')}
            data = {'user_id': 'test-user-123'}
            
            print("🚀 Sending extract-profile request...")
            response = requests.post(endpoint, files=files, data=data, timeout=30)
            
            print(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Profile extraction successful!")
                print(f"📊 Success: {result.get('success', False)}")
                print(f"📝 Message: {result.get('message', 'No message')}")
                
                if 'extracted_data' in result:
                    extracted = result['extracted_data']
                    print(f"👤 Personal info: {extracted.get('personalInfo', {})}")
                    print(f"🎓 Education entries: {len(extracted.get('education', []))}")
                    print(f"💼 Experience entries: {len(extracted.get('experience', []))}")
                    print(f"🛠️ Skills: {len(extracted.get('skills', []))}")
                
                return True
            else:
                print(f"❌ Request failed with status {response.status_code}")
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

def test_health_endpoint():
    """Test the health endpoint specifically"""
    try:
        response = requests.get("http://localhost:8006/health", timeout=5)
        print(f"🏥 Health endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Database: {data.get('database', 'unknown')}")
            print(f"🤖 AI Status: {data.get('ai_status', 'unknown')}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Profile Service Test Script")
    print("=" * 50)
    
    # Test health first
    if not test_health_endpoint():
        print("\n❌ Service health check failed - cannot proceed")
        sys.exit(1)
    
    # Test profile extraction
    success = test_profile_service()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed!")
    else:
        print("❌ Tests failed - check the logs above")
        sys.exit(1)
