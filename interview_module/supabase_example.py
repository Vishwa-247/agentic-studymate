"""
Example: Using Supabase to store interview data
"""

from stress_model import StressEstimator
import time
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Your Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-anon-key-here")

def run_interview_with_supabase():
    # Initialize estimator
    estimator = StressEstimator()
    
    # === PRE-INTERVIEW BASELINE ===
    print("📊 Collecting baseline (casual conversation)...")
    baseline_scores = []
    for i in range(3):
        features = {
            "eyebrow_raise": 0.02,
            "lip_tension": 0.1,
            "head_nod_intensity": 0.1,
            "symmetry_delta": 0.01,
            "blink_rate": 18.0,
            "eye_contact_ratio": 0.7,
            "response_delay": 0.5,
            "speech_pace_variance": 0.1
        }
        score = estimator.predict(features)
        baseline_scores.append(score)
    
    estimator.set_baseline(baseline_scores)
    print(f"✅ Baseline established: {estimator.baseline_stress:.2f}\n")
    
    # Start interview session
    print("🎤 Starting Interview Session...")
    session = estimator.start_session("interview_candidate_20260213")
    print(f"Session ID: {session.session_id}\n")
    
    # === Question 1 ===
    estimator.mark_question("Tell me about yourself")
    print("❓ Question: Tell me about yourself")
    
    for i in range(5):
        features = {
            "eyebrow_raise": 0.03,
            "lip_tension": 0.2,
            "head_nod_intensity": 0.15,
            "symmetry_delta": 0.01,
            "blink_rate": 22.0,
            "eye_contact_ratio": 0.65,
            "response_delay": 1.0,
            "speech_pace_variance": 0.15
        }
        result = estimator.predict(features)
        print(f"  {result.formatted()}")
        time.sleep(0.1)
    
    # === Question 2 (High Stress) ===
    print("\n❓ Question: Describe your most challenging project")
    estimator.mark_question("Describe your most challenging project")
    
    for i in range(5):
        features = {
            "eyebrow_raise": 0.06,
            "lip_tension": 0.7,
            "head_nod_intensity": 0.3,
            "symmetry_delta": 0.04,
            "blink_rate": 38.0,
            "eye_contact_ratio": 0.35,
            "response_delay": 2.8,
            "speech_pace_variance": 0.28
        }
        result = estimator.predict(features)
        print(f"  {result.formatted()}")
        time.sleep(0.1)
    
    # === Question 3 ===
    print("\n❓ Question: Why do you want to work here?")
    estimator.mark_question("Why do you want to work here?")
    
    for i in range(5):
        features = {
            "eyebrow_raise": 0.04,
            "lip_tension": 0.4,
            "head_nod_intensity": 0.2,
            "symmetry_delta": 0.02,
            "blink_rate": 25.0,
            "eye_contact_ratio": 0.6,
            "response_delay": 1.2,
            "speech_pace_variance": 0.18
        }
        result = estimator.predict(features)
        print(f"  {result.formatted()}")
        time.sleep(0.1)
    
    # === Save to Supabase ===
    print("\n" + "="*60)
    print("💾 SAVING TO SUPABASE")
    print("="*60)
    
    success = estimator.save_session_to_supabase(SUPABASE_URL, SUPABASE_KEY)
    
    if success:
        print("\n✅ Interview data saved to Supabase!")
    else:
        print("\n❌ Failed to save to Supabase. Check your credentials.")
        return
    
    # === Load Session from Supabase ===
    print("\n" + "="*60)
    print("📥 LOADING FROM SUPABASE")
    print("="*60)
    
    loaded_data = StressEstimator.load_session_from_supabase(
        session.session_id,
        SUPABASE_URL,
        SUPABASE_KEY
    )
    
    if loaded_data:
        print(f"✅ Loaded session: {loaded_data['session']['session_id']}")
        print(f"   Duration: {loaded_data['session']['duration_seconds']:.1f}s")
        print(f"   Avg Stress: {loaded_data['session']['avg_stress']:.2f}")
        print(f"   Risk: {loaded_data['session']['deception_risk']}")
        print(f"   Recordings: {loaded_data['total_recordings']}")
        print(f"   {loaded_data['session']['recommendation']}")
    
    # === List All Sessions ===
    print("\n" + "="*60)
    print("📋 ALL SESSIONS IN DATABASE")
    print("="*60)
    
    all_sessions = StressEstimator.list_all_sessions(SUPABASE_URL, SUPABASE_KEY, limit=10)
    
    print(f"Total sessions: {len(all_sessions)}")
    for sess in all_sessions[:5]:
        print(f"\n  • {sess['session_id']}")
        print(f"    Date: {sess['start_datetime']}")
        print(f"    Avg Stress: {sess['avg_stress']:.2f}")
        print(f"    Risk: {sess['deception_risk']}")
        print(f"    {sess['recommendation']}")
    
    # === End Session ===
    summary = estimator.end_session()
    print("\n" + "="*60)
    print("✅ Interview Complete!")
    print("="*60)


def demo_load_existing_session():
    """Example: Load an existing session from Supabase"""
    
    session_id = input("Enter session ID to load: ")
    
    data = StressEstimator.load_session_from_supabase(
        session_id,
        SUPABASE_URL,
        SUPABASE_KEY
    )
    
    if data:
        print(f"\n📊 Session: {data['session']['session_id']}")
        print(f"Date: {data['session']['start_datetime']}")
        print(f"Duration: {data['session']['duration_seconds']:.1f}s")
        print(f"Avg Stress: {data['session']['avg_stress']:.2f}")
        print(f"Max Stress: {data['session']['max_stress']:.2f}")
        print(f"Deception Flags: {data['session']['total_deception_flags']}")
        print(f"Risk Level: {data['session']['deception_risk']}")
        print(f"\n{data['session']['recommendation']}")
        
        print(f"\n📝 Questions Asked ({len(data['questions'])}):")
        for q in data['questions']:
            print(f"  [{q['datetime']}] {q['question_text']}")
        
        print(f"\n📈 Significant Recordings ({len(data['recordings'])}):")
        for r in data['recordings'][:5]:
            print(f"  [{r['datetime']}] Stress: {r['stress_score']:.2f} ({r['stress_level']})")
            if r.get('deception_flags'):
                print(f"    🚩 Flags: {', '.join(r['deception_flags'][:2])}")
    else:
        print("❌ Session not found")


if __name__ == "__main__":
    print("="*60)
    print("AI MICRO-EXPRESSION ANALYZER - SUPABASE INTEGRATION")
    print("="*60)
    print()
    
    # Check if credentials are set
    if SUPABASE_URL == "https://your-project.supabase.co" or SUPABASE_KEY == "your-anon-key-here":
        print("⚠️  WARNING: Please set your Supabase credentials!")
        print("   1. Create a .env file in this directory")
        print("   2. Add your credentials:")
        print("      SUPABASE_URL=https://your-project.supabase.co")
        print("      SUPABASE_KEY=your-anon-key-here")
        print()
        input("Press Enter to continue anyway (will fail to save)...")
    
    # Run demo
    run_interview_with_supabase()
    
    # Optionally load existing session
    print("\n" + "="*60)
    load_existing = input("\nWant to load an existing session? (y/n): ")
    if load_existing.lower() == 'y':
        demo_load_existing_session()
