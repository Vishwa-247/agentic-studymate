#!/usr/bin/env python
"""
Simple startup script for Profile Service
"""

import os
import subprocess
import sys

if __name__ == '__main__':
    # Add backend directory to Python path
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, backend_dir)

    # Change to backend directory
    os.chdir(backend_dir)

    # Load environment variables
    from dotenv import load_dotenv

    load_dotenv()

    print("🚀 Starting StudyMate Profile Service...")
    print("✅ Environment loaded")
    print(f"✅ GROQ API Key: {'Configured' if os.getenv('GROQ_API_KEY', '').startswith('gsk_') else 'NOT SET'}")
    print(f"✅ Working Directory: {os.getcwd()}")

    # Start the Profile Service using uvicorn directly
    try:
        import uvicorn

        # Import handled by uvicorn string reference
        
        print("🌐 Starting Profile Service on http://localhost:8006")
        print("📖 API Documentation: http://localhost:8006/docs")
        print("❤️  Health Check: http://localhost:8006/health")
        print("\nPress Ctrl+C to stop the server")
        
        uvicorn.run(
            "agents.profile-service.main:app",
            host="0.0.0.0",
            port=8006,
            reload=True,
            reload_dirs=[backend_dir]
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
