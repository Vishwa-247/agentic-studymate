#!/usr/bin/env python3
"""
Quick service status checker for StudyMate backend
Checks if all required services are running and accessible
"""

import asyncio
import httpx
import sys
from typing import Dict, Tuple

# Service configurations
SERVICES = {
    "API Gateway": {
        "url": "http://localhost:8000",
        "endpoints": ["/health", "/"],
        "expected_ports": [8000]
    },
    "Profile Service": {
        "url": "http://localhost:8006", 
        "endpoints": ["/health", "/"],
        "expected_ports": [8006]
    },
    "Resume Analyzer": {
        "url": "http://localhost:8003",
        "endpoints": ["/health", "/"],
        "expected_ports": [8003]
    }
}

async def check_service_health(name: str, config: Dict) -> Tuple[bool, str]:
    """Check if a service is running and healthy"""
    base_url = config["url"]
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Try health endpoint first
            try:
                health_response = await client.get(f"{base_url}/health")
                if health_response.status_code == 200:
                    health_data = health_response.json()
                    status = health_data.get("status", "unknown")
                    return True, f"✅ Healthy (status: {status})"
            except:
                pass
            
            # Fallback to root endpoint
            root_response = await client.get(base_url)
            if root_response.status_code == 200:
                return True, "✅ Running (health endpoint not available)"
            else:
                return False, f"❌ Responding but unhealthy (status: {root_response.status_code})"
                
    except httpx.ConnectError:
        return False, "❌ Not running (connection refused)"
    except httpx.TimeoutException:
        return False, "❌ Timeout (service may be overloaded)"
    except Exception as e:
        return False, f"❌ Error: {str(e)}"

async def main():
    """Main service checker"""
    print("🔍 StudyMate Backend Service Status Check")
    print("=" * 50)
    
    all_healthy = True
    
    for service_name, config in SERVICES.items():
        print(f"\n📡 Checking {service_name}...")
        print(f"   URL: {config['url']}")
        
        is_healthy, message = await check_service_health(service_name, config)
        print(f"   Status: {message}")
        
        if not is_healthy:
            all_healthy = False
    
    print("\n" + "=" * 50)
    
    if all_healthy:
        print("🎉 All services are running and healthy!")
        print("\nNext steps:")
        print("• Visit http://localhost:8000/docs for API documentation")
        print("• Run 'python test_all_services.py' for comprehensive testing") 
        print("• Start your frontend application")
    else:
        print("⚠️  Some services are not running or unhealthy.")
        print("\nTo start services:")
        print("• Linux/macOS: ./scripts/start-all-services.sh")
        print("• Windows: scripts\\start-all-services.bat")
        print("\nTo debug issues:")
        print("• Check if virtual environment is activated")
        print("• Verify .env file exists with correct API keys")
        print("• Check service logs for error messages")
    
    return 0 if all_healthy else 1

if __name__ == "__main__":
    exit(asyncio.run(main()))