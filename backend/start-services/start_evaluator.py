"""
Start Evaluator Service
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root))

# Load environment variables
from dotenv import load_dotenv
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

# Print status
print("=" * 50)
print("🧠 Starting StudyMate Evaluator Service")
print("=" * 50)
print(f"✅ SUPABASE_DB_URL: {'SET' if os.getenv('SUPABASE_DB_URL') else 'NOT SET'}")
print(f"✅ GROQ_API_KEY: {'SET' if os.getenv('GROQ_API_KEY') else 'NOT SET'}")
print(f"✅ OPENROUTER_API_KEY: {'SET' if os.getenv('OPENROUTER_API_KEY') else 'NOT SET'}")
print("=" * 50)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "evaluator.main:app",
        host="0.0.0.0",
        port=8010,
        reload=True
    )
