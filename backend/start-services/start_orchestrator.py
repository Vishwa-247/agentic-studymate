"""
Start Orchestrator Service
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
print("🧠 Starting StudyMate Orchestrator Service")
print("=" * 50)
print(f"✅ SUPABASE_DB_URL: {'SET' if os.getenv('SUPABASE_DB_URL') else 'NOT SET'}")
print("=" * 50)
print("📋 Routing Rules:")
print("  - clarity_avg < 0.4 → production_interview")
print("  - tradeoff_avg < 0.4 → system_design_learning_blocks")
print("  - adaptability_avg < 0.4 → curveball_scenarios")
print("  - failure_awareness_avg < 0.4 → failure_case_lessons")
print("  - all >= 0.4 → project_studio")
print("=" * 50)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "orchestrator.main:app",
        host="0.0.0.0",
        port=8011,
        reload=True
    )
