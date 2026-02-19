#!/usr/bin/env python3
"""
Install all dependencies for the StudyMate backend services
"""

import os
import subprocess
import sys


def install_requirements(requirements_file):
    """Install requirements from a file"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", requirements_file])
        print(f"✅ Successfully installed requirements from {requirements_file}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements from {requirements_file}: {e}")
        return False

def main():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"📦 Installing dependencies for StudyMate backend...")
    print(f"📂 Working directory: {backend_dir}")
    
    # Install main backend requirements
    main_reqs = os.path.join(backend_dir, "requirements.txt")
    if os.path.exists(main_reqs):
        print(f"\n🔧 Installing main backend requirements...")
        install_requirements(main_reqs)
    
    # Install requirements for each service
    services = [
        "agents/profile-service/requirements.txt",
        "agents/resume-analyzer/requirements.txt",
        "agents/course-service/requirements.txt",
        "agents/dsa-service/requirements.txt",
        "api-gateway/requirements.txt"
    ]
    
    for service_req in services:
        req_path = os.path.join(backend_dir, service_req)
        if os.path.exists(req_path):
            print(f"\n🔧 Installing requirements for {service_req}...")
            install_requirements(req_path)
    
    print(f"\n✅ All dependencies installation process completed!")
    print("💡 Note: Some services may have overlapping dependencies, which is normal.")

if __name__ == "__main__":
    main()
