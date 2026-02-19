#!/usr/bin/env python3
"""
Startup script for DSA Service
"""

import os
import subprocess
import sys

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

# Change to DSA service directory
dsa_service_dir = os.path.join(backend_dir, "agents", "dsa-service")
os.chdir(dsa_service_dir)

# Load environment variables
from dotenv import load_dotenv

load_dotenv(os.path.join(backend_dir, ".env"))

print("🚀 Starting StudyMate DSA Service...")
print("✅ Environment loaded")
print(f"✅ Working Directory: {os.getcwd()}")

# Start the DSA Service using uvicorn directly
try:
    import uvicorn
    
    print("🌐 Starting Unified DSA Service on http://localhost:8004")
    print("📖 API Documentation: http://localhost:8004/docs")
    print("❤️  Health Check: http://localhost:8004/health")
    print("🤖 Features: Progress Tracking + AI Feedback + Contextual Chatbot")
    print("\nPress Ctrl+C to stop the server")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8004,
        reload=True,
        reload_dirs=[dsa_service_dir]
    )
    
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("Installing required packages...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    print("✅ Packages installed. Please run this script again.")
    
except Exception as e:
    print(f"❌ Error starting server: {e}")
    print("Please check your configuration and try again.")
    input("Press Enter to exit...")
