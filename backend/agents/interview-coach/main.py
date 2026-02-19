#!/usr/bin/env python3
"""
Interview Coach Service - AI-Powered Interview Preparation
=========================================================

This service provides AI-powered interview coaching with question generation,
answer analysis, and personalized feedback.

Features:
- Technical and behavioral interview questions
- Real-time answer analysis and feedback
- Interview session management
- Progress tracking and improvement suggestions

Author: StudyMate Platform
Version: 1.0.0
"""

import json
import logging
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field

from journey import JourneyStartRequest, JourneyStepRequest, create_session, step_session

# Facial & body-language analysis router
try:
    from facial_analysis_service import router as analysis_router
    _ANALYSIS_AVAILABLE = True
except ImportError as _imp_err:
    _ANALYSIS_AVAILABLE = False
    logging.getLogger(__name__).warning(f"Facial analysis service unavailable: {_imp_err}")

# Load environment variables from backend root
backend_root = Path(__file__).parent.parent.parent
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Interview Coach Service",
    description="AI-Powered Interview Preparation Service",
    version="1.0.0"
)

# CORS middleware
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000",
    ).split(",")
    if o.strip()
]
ALLOWED_ORIGIN_REGEX = os.getenv("ALLOWED_ORIGIN_REGEX", r"^https://.*\\.lovable\\.app$")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint for Showcase dashboard"""
    return {
        "status": "healthy",
        "service": "interview-coach",
        "timestamp": datetime.now().isoformat()
    }

# Auth (used by API gateway)
security = HTTPBearer(auto_error=False)
JWT_SECRET = os.getenv("JWT_SECRET")  # API gateway token
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")  # Supabase JWT secret (optional)

def verify_request_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    token = credentials.credentials

    if JWT_SECRET:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("uid") or payload.get("sub")
            if user_id:
                return str(user_id)
        except JWTError:
            pass

    if SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_aud": True},
            )
            user_id = payload.get("sub")
            if user_id:
                return str(user_id)
        except JWTError:
            pass

    raise HTTPException(status_code=401, detail="Invalid token")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_KEY_TECHNICAL = os.getenv("GROQ_API_KEY_TECHNICAL") or os.getenv("GROQ_API_KEY")
GROQ_API_KEY_APTITUDE = os.getenv("GROQ_API_KEY_APTITUDE") or os.getenv("GROQ_APTITUDE_API_KEY") or os.getenv("GROQ_API_KEY")
GROQ_API_KEY_HR = os.getenv("GROQ_API_KEY_HR") or os.getenv("GROQ_HR_API_KEY") or os.getenv("GROQ_API_KEY")

# Optional Supabase client
try:
    from supabase import Client, create_client  # type: ignore
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
except Exception:
    supabase = None

# Pydantic models
class InterviewStartRequest(BaseModel):
    user_id: str = Field(..., description="User UUID")
    interview_type: str = Field(..., description="technical, behavioral, system_design, coding")
    job_role: str = Field(..., description="Target job role")
    difficulty: str = Field("medium", description="easy, medium, hard")
    duration: int = Field(30, description="Interview duration in minutes")
    topics: Optional[List[str]] = Field([], description="Specific topics to focus on")

class QuestionResponse(BaseModel):
    question_id: str
    answer: str
    thinking_time: Optional[int] = None  # seconds

class InterviewSession(BaseModel):
    id: str
    user_id: str
    interview_type: str
    job_role: str
    difficulty: str
    status: str  # active, completed, paused
    questions: List[Dict[str, Any]]
    current_question: int
    start_time: str
    duration: int

# In-memory storage for demo
interview_sessions = {}
question_bank = {
    "aptitude": {
        "easy": [
            {"question": "If A is taller than B, and B is taller than C, who is the shortest?", "category": "logical_reasoning", "difficulty": "easy", "expected_points": ["Logic", "Comparison"]},
            {"question": "A train travels 60 km in 1 hour. How far will it travel in 3 hours at the same speed?", "category": "quantitative", "difficulty": "easy", "expected_points": ["Speed calculation", "Basic math"]},
            {"question": "Complete the series: 2, 4, 8, 16, __", "category": "pattern", "difficulty": "easy", "expected_points": ["Pattern recognition", "Multiplication"]},
        ],
        "medium": [
            {"question": "In a group of 50 people, 30 like tea, 25 like coffee, and 10 like both. How many like neither?", "category": "logical_reasoning", "difficulty": "medium", "expected_points": ["Set theory", "Venn diagram"]},
            {"question": "A person buys 5 pens for Rs. 25 and sells them for Rs. 30. What is the profit percentage?", "category": "quantitative", "difficulty": "medium", "expected_points": ["Profit calculation", "Percentage"]},
        ],
        "hard": [
            {"question": "Five people (A, B, C, D, E) are sitting in a row. A is to the left of B but to the right of E. C is to the right of B but to the left of D. Who is in the middle?", "category": "logical_reasoning", "difficulty": "hard", "expected_points": ["Complex logic", "Arrangement"]},
        ]
    },
    "hr": {
        "easy": [
            {"question": "Tell me about yourself.", "category": "behavioral", "difficulty": "easy", "expected_points": ["Background", "Experience", "Goals"]},
            {"question": "Why do you want to work for our company?", "category": "motivation", "difficulty": "easy", "expected_points": ["Research", "Company knowledge", "Career goals"]},
            {"question": "What are your strengths and weaknesses?", "category": "self_assessment", "difficulty": "easy", "expected_points": ["Self-awareness", "Honesty", "Growth mindset"]},
        ],
        "medium": [
            {"question": "Describe a challenging situation you faced and how you handled it.", "category": "behavioral", "difficulty": "medium", "expected_points": ["STAR method", "Problem-solving", "Learning"]},
            {"question": "Where do you see yourself in 5 years?", "category": "career_goals", "difficulty": "medium", "expected_points": ["Career planning", "Ambition", "Alignment"]},
        ],
        "hard": [
            {"question": "How do you handle conflict with a team member?", "category": "behavioral", "difficulty": "hard", "expected_points": ["Conflict resolution", "Communication", "Leadership"]},
        ]
    },
    "technical": {
        "easy": [
            {
                "id": "tech_001",
                "question": "What is the difference between == and === in JavaScript?",
                "category": "JavaScript",
                "expected_points": ["Type coercion", "Strict equality", "Performance"]
            },
            {
                "id": "tech_002", 
                "question": "Explain what a REST API is and its key principles.",
                "category": "Web Development",
                "expected_points": ["HTTP methods", "Stateless", "Resource-based URLs"]
            }
        ],
        "medium": [
            {
                "id": "tech_003",
                "question": "How would you optimize a slow database query?",
                "category": "Database",
                "expected_points": ["Indexing", "Query optimization", "Caching"]
            },
            {
                "id": "tech_004",
                "question": "Explain the concept of closures in JavaScript with an example.",
                "category": "JavaScript",
                "expected_points": ["Lexical scoping", "Function context", "Memory management"]
            }
        ],
        "hard": [
            {
                "id": "tech_005",
                "question": "Design a distributed caching system like Redis.",
                "category": "System Design",
                "expected_points": ["Consistency", "Partitioning", "Replication"]
            }
        ]
    },
    "behavioral": {
        "easy": [
            {
                "id": "behav_001",
                "question": "Tell me about a time when you had to work with a difficult team member.",
                "category": "Teamwork",
                "expected_points": ["Conflict resolution", "Communication", "Outcome"]
            }
        ],
        "medium": [
            {
                "id": "behav_002",
                "question": "Describe a situation where you had to learn a new technology quickly.",
                "category": "Learning",
                "expected_points": ["Learning approach", "Challenges", "Application"]
            }
        ]
    }
}

@app.get("/")
async def root():
    return {
        "service": "Interview Coach Service",
        "version": "1.0.0",
        "status": "running",
        "features": ["question_generation", "answer_analysis", "feedback", "progress_tracking"]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "interview-coach-service",
        "timestamp": datetime.utcnow().isoformat(),
        "active_interviews": len(interview_sessions),
        "question_bank_size": sum(len(questions) for category in question_bank.values() for questions in category.values())
    }


# ============================================
# Interview Journey (Milestone 2)
# ============================================


@app.post("/api/interview/start")
async def start_interview_journey(payload: JourneyStartRequest, user_id: str = Depends(verify_request_user_id)):
    """Start a deterministic production-thinking interview journey."""
    try:
        session_id, state, prompt = create_session(supabase=supabase, user_id=user_id, payload=payload)
        return {"session_id": session_id, "state": state, "prompt": prompt}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"journey start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/interview/step")
async def step_interview_journey(payload: JourneyStepRequest, user_id: str = Depends(verify_request_user_id)):
    """Advance the journey state machine by one user message."""
    try:
        res = step_session(supabase=supabase, user_id=user_id, payload=payload)
        return res.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"journey step error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/start")
async def start_interview(request: InterviewStartRequest):
    """Start a new interview session."""
    try:
        logger.info(f"🎤 Starting interview for user {request.user_id}")
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Get questions for the interview
        questions = generate_questions(request.interview_type, request.difficulty, request.topics)
        
        # Create interview session
        session = InterviewSession(
            id=session_id,
            user_id=request.user_id,
            interview_type=request.interview_type,
            job_role=request.job_role,
            difficulty=request.difficulty,
            status="active",
            questions=questions,
            current_question=0,
            start_time=datetime.utcnow().isoformat(),
            duration=request.duration
        )
        
        # Store session
        interview_sessions[session_id] = session.dict()
        
        logger.info(f"✅ Interview session created: {session_id}")
        
        return {
            "success": True,
            "session_id": session_id,
            "interview": session.dict(),
            "first_question": questions[0] if questions else None,
            "total_questions": len(questions)
        }
        
    except Exception as e:
        logger.error(f"💥 Error starting interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/interviews")
async def get_interviews(user_id: str):
    """Get all interviews for a user."""
    try:
        user_interviews = [
            session for session in interview_sessions.values()
            if session["user_id"] == user_id
        ]
        
        return {
            "success": True,
            "interviews": user_interviews
        }
        
    except Exception as e:
        logger.error(f"💥 Error fetching interviews: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/interviews/{interview_id}")
async def get_interview(interview_id: str):
    """Get interview from DATABASE, not memory."""
    try:
        if supabase:
            # Get from Supabase
            result = supabase.table("interview_sessions").select("*").eq("id", interview_id).execute()
            if not result.data:
                raise HTTPException(status_code=404, detail="Interview not found")
            
            session = result.data[0]
            
            # Get responses
            responses = supabase.table("interview_responses")\
                .select("*")\
                .eq("session_id", interview_id)\
                .order("question_index")\
                .execute()
            
            return {
                "success": True,
                "interview": {
                    **session,
                    "responses": responses.data if responses.data else []
                }
            }
        else:
            # Fallback to memory
            if interview_id not in interview_sessions:
                raise HTTPException(status_code=404, detail="Interview not found")
            return {"success": True, "interview": interview_sessions[interview_id]}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error fetching interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/interviews/{interview_id}/answer")
async def submit_answer(
    interview_id: str,
    request: Request,
    # multipart fields (optional)
    audio: UploadFile | None = None,
    question_id: Optional[int] = None,
    # json fallback
    response: Optional[QuestionResponse] = None,
):
    """Submit an answer with FULL database persistence."""
    try:
        # Get session from SUPABASE first (not memory)
        session = None
        if supabase:
            session_data = supabase.table("interview_sessions").select("*").eq("id", interview_id).execute()
            if not session_data.data:
                raise HTTPException(status_code=404, detail="Interview not found")
            session = session_data.data[0]
        else:
            # Fallback to memory
            if interview_id not in interview_sessions:
                raise HTTPException(status_code=404, detail="Interview not found")
            session = interview_sessions[interview_id]
        
        # Get questions from session
        questions = session.get("questions_data", {}).get("questions", [])
        if not questions:
            # Fallback to memory format
            questions = session.get("questions", [])
        
        user_answer_text = None
        audio_duration = 0

        content_type = request.headers.get("content-type", "")
        if "multipart/form-data" in content_type and audio is not None:
            # Transcribe audio
            try:
                from transcription import transcribe_audio
                audio_bytes = await audio.read()
                audio_duration = len(audio_bytes) / 16000  # approximate duration
                user_answer_text = await transcribe_audio(audio_bytes, audio.content_type)
            except Exception as e:
                logger.warning(f"Transcription failed: {e}")
                user_answer_text = ""
        elif response is not None:
            user_answer_text = response.answer
        else:
            # Try parse JSON body if provided
            try:
                data = await request.json()
                user_answer_text = data.get("answer", "")
            except Exception:
                user_answer_text = ""

        if user_answer_text is None:
            user_answer_text = ""

        current_idx = session.get("current_question_index", 0) if question_id is None else int(question_id)
        
        if current_idx >= len(questions):
            raise HTTPException(status_code=400, detail="No more questions")
        
        current_question = questions[current_idx]

        # Analyze communication (speech pattern analysis)
        from speech_analyzer import SpeechAnalyzer
        analyzer = SpeechAnalyzer()
        communication_analysis = analyzer.analyze_communication(user_answer_text, audio_duration)
        
        # Analyze the answer using AI
        feedback = await analyze_answer(current_question, user_answer_text)
        
        # Get facial data from request if available
        facial_data = None
        try:
            form_data = await request.form()
            facial_data_str = form_data.get('facial_data')
            if facial_data_str:
                try:
                    facial_data = json.loads(facial_data_str)
                except:
                    pass
        except:
            pass
        
        # DEMO: Short-circuit with dummy response for presentations
        if os.getenv("DEMO_MODE", "false").lower() == "true":
            # Build a demo analysis payload using available facial_data when present
            demo_confident = (facial_data or {}).get("confident", 0.78)
            demo_stressed = (facial_data or {}).get("stressed", 0.18)
            demo_nervous = (facial_data or {}).get("nervous", 0.15)
            demo_blinks = (facial_data or {}).get("blink_count", 12)
            demo_looking = (facial_data or {}).get("looking_at_camera", False)
            return {
                "success": True,
                "response_text": user_answer_text or "This is a sample answer about my experience with Python and JavaScript.",
                "analysis": {
                    "filler_word_count": 3,
                    "words_per_minute": 145,
                    "clarity_score": 88,
                    "overall_score": 88,
                    "strengths": [
                        "Clear articulation and good pacing",
                        "Demonstrated technical knowledge effectively",
                        "Used specific examples to support points"
                    ],
                    "improvements": [
                        "Reduce filler words",
                        "Add quantifiable achievements",
                        "Use clearer structure (STAR)"
                    ],
                    "overall_feedback": "Strong answer with good technical depth. Reduce filler words for even more professional delivery."
                },
                "facial_analysis": {
                    "confidence_score": int(demo_confident * 100),
                    "stress_level": int(demo_stressed * 100),
                    "nervousness_level": int(demo_nervous * 100),
                    "blink_count": demo_blinks,
                    "gaze_status": "Focused" if (str(demo_looking).lower() in ["true", "1"]) else "Distracted"
                }
            }

        # Move to next question
        next_idx = current_idx + 1
        is_complete = next_idx >= len(questions)
        
        # **CRITICAL: Store response in database IMMEDIATELY**
        if supabase:
            try:
                response_data = {
                    "session_id": interview_id,
                    "user_id": session.get("user_id"),
                    "question_index": current_idx,
                    "question_text": current_question.get("text") or current_question.get("question"),
                    "response_text": user_answer_text,
                    "response_time_seconds": int(audio_duration),
                    "ai_analysis": {
                        "score": feedback.get("score", 0),
                        "word_count": feedback.get("word_count", 0),
                        "strengths": feedback.get("strengths", []),
                        "improvements": feedback.get("improvements", []),
                        "overall_feedback": feedback.get("overall_feedback", ""),
                        "communication": communication_analysis
                    },
                    "facial_analysis": facial_data,
                    "confidence_score": feedback.get("score", 0) / 100.0
                }
                
                supabase.table("interview_responses").insert(response_data).execute()
                logger.info(f"✅ Response stored in database: Q{current_idx}")
                
                # Update session progress in database
                update_data = {
                    "current_question_index": next_idx,
                    "status": "completed" if is_complete else "active"
                }
                if is_complete:
                    update_data["completed_at"] = datetime.utcnow().isoformat()
        
                supabase.table("interview_sessions").update(update_data).eq("id", interview_id).execute()
                logger.info(f"✅ Progress updated: {next_idx}/{len(questions)}")
                
            except Exception as e:
                logger.error(f"Failed to store response: {e}")
        
        # Update in-memory session for backward compatibility
        if interview_id in interview_sessions:
            interview_sessions[interview_id]["current_question"] = next_idx
            interview_sessions[interview_id]["status"] = "completed" if is_complete else "active"
        
        next_question = None
        if next_idx < len(questions):
            next_question = questions[next_idx]
        
        return {
            "success": True,
            "analysis": communication_analysis,
            "feedback": feedback,
            "next_question": next_question,
            "progress": {
                "current": next_idx,
                "total": len(questions),
                "completed": is_complete
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error submitting answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/interviews/{interview_id}/analyze")
async def analyze_interview(interview_id: str, analysis_data: dict):
    """Analyze completed interview using DATABASE data."""
    try:
        if supabase:
            # Get session from database
            session_result = supabase.table("interview_sessions").select("*").eq("id", interview_id).execute()
            if not session_result.data:
                raise HTTPException(status_code=404, detail="Interview not found")
        
            session = session_result.data[0]
        
            if session.get("status") != "completed":
                raise HTTPException(status_code=400, detail="Interview not completed")
        
            # Get all responses from database
            responses = supabase.table("interview_responses")\
                .select("*")\
                .eq("session_id", interview_id)\
                .execute()
            
            if not responses.data:
                raise HTTPException(status_code=404, detail="No responses found")
            
            # Calculate overall scores
            scores = []
            communication_scores = []
            for r in responses.data:
                if "ai_analysis" in r:
                    ai_analysis = r["ai_analysis"]
                    if isinstance(ai_analysis, dict):
                        if "score" in ai_analysis:
                            scores.append(ai_analysis["score"])
                        if "communication" in ai_analysis and "scores" in ai_analysis["communication"]:
                            comm_scores = ai_analysis["communication"]["scores"]
                            if "clarity_score" in comm_scores:
                                communication_scores.append(comm_scores["clarity_score"])
            
            overall_score = sum(scores) / len(scores) if scores else 0
            avg_clarity = sum(communication_scores) / len(communication_scores) if communication_scores else 0
            
            # Aggregate strengths/improvements
            all_strengths = []
            all_improvements = []
            for r in responses.data:
                if "ai_analysis" in r:
                    ai_analysis = r["ai_analysis"]
                    if isinstance(ai_analysis, dict):
                        if "strengths" in ai_analysis:
                            all_strengths.extend(ai_analysis["strengths"])
                        if "improvements" in ai_analysis:
                            all_improvements.extend(ai_analysis["improvements"])
            
            # Get unique items
            unique_strengths = list(set(all_strengths))[:5]
            unique_improvements = list(set(all_improvements))[:5]
            
            analysis = {
                "overall_score": round(overall_score, 1),
                "clarity_score": round(avg_clarity, 1),
                "questions_answered": len(responses.data),
                "feedback": {
                    "strengths": unique_strengths,
                    "improvements": unique_improvements,
                    "overall": f"You scored {overall_score:.1f}/100. {'Excellent performance!' if overall_score >= 80 else 'Good effort! Keep practicing to improve.' if overall_score >= 60 else 'More practice needed.'}"
                }
            }
            
            # Store analysis in session
            supabase.table("interview_sessions").update({
                "feedback": analysis,
                "total_score": overall_score
            }).eq("id", interview_id).execute()
            
            return {"success": True, "analysis": analysis}
        else:
            # Fallback to memory
            if interview_id not in interview_sessions:
                raise HTTPException(status_code=404, detail="Interview not found")
            session = interview_sessions[interview_id]
            if session["status"] != "completed":
                raise HTTPException(status_code=400, detail="Interview not completed")
            analysis = generate_overall_analysis(session)
            return {"success": True, "analysis": analysis}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error analyzing interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_questions(interview_type: str, difficulty: str, topics: List[str]) -> List[Dict[str, Any]]:
    """Generate questions for the interview."""
    if interview_type not in question_bank:
        return []
    
    if difficulty not in question_bank[interview_type]:
        difficulty = "medium"
    
    questions = question_bank[interview_type][difficulty].copy()
    
    # Add some randomization and filtering based on topics
    # For now, return first 5 questions
    return questions[:5]

async def analyze_answer(question: Dict[str, Any], answer: str) -> Dict[str, Any]:
    """Analyze user's answer using AI and provide detailed feedback."""
    word_count = len(answer.split())
    
    # Use Groq for fast AI analysis
    groq_key = GROQ_API_KEY
    if not groq_key or word_count < 5:
        # Fallback to basic scoring
        score = min(100, max(0, word_count * 2))
        return {
            "score": score,
            "word_count": word_count,
            "strengths": ["Answer provided"],
            "improvements": ["Add more details and examples"],
            "overall_feedback": "Try to elaborate more on your answer."
        }
    
    # AI-powered analysis
    try:
        question_text = question.get('question') or question.get('text', '')
        expected_points = question.get('expected_points', [])
        
        prompt = f"""Analyze this interview answer and provide structured feedback:

Question: {question_text}
Answer: {answer}

Expected points to cover: {', '.join(expected_points) if expected_points else 'Relevant technical knowledge and examples'}

Provide feedback in this exact JSON format:
{{
    "score": <0-100>,
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "overall_feedback": "one sentence summary"
}}"""

        result = await _call_groq(prompt, timeout=15.0, api_key=groq_key)
        
        if result:
            # _call_groq returns parsed JSON dict
            # Check if result has the expected feedback structure
            if isinstance(result, dict):
                if "score" in result:
                    feedback = result
                    feedback["word_count"] = word_count
                    # Ensure all required fields exist
                    if "strengths" not in feedback:
                        feedback["strengths"] = []
                    if "improvements" not in feedback:
                        feedback["improvements"] = []
                    if "overall_feedback" not in feedback:
                        feedback["overall_feedback"] = "AI analysis completed"
                    return feedback
                
                # If result has different structure, extract feedback fields
                feedback = {
                    "score": result.get("score", 75),
                    "word_count": word_count,
                    "strengths": result.get("strengths", ["AI analysis completed"]),
                    "improvements": result.get("improvements", ["Could provide more specific examples"]),
                    "overall_feedback": result.get("overall_feedback", result.get("feedback", "Analysis completed"))
                }
                return feedback
            
    except Exception as e:
        logger.warning(f"AI analysis failed: {e}")
    
    # Fallback
    score = min(100, max(0, word_count * 2))
    return {
        "score": score,
        "word_count": word_count,
        "strengths": ["Answer provided"],
        "improvements": ["Add more details"],
        "overall_feedback": "Good start. Try to add more specific examples."
    }

def generate_overall_analysis(session: Dict[str, Any]) -> Dict[str, Any]:
    """Generate overall interview analysis."""
    answered_questions = [q for q in session["questions"] if "answer" in q]
    
    if not answered_questions:
        return {"error": "No answers to analyze"}
    
    total_score = sum(q.get("feedback", {}).get("score", 0) for q in answered_questions)
    average_score = total_score / len(answered_questions)
    
    analysis = {
        "overall_score": round(average_score, 1),
        "questions_answered": len(answered_questions),
        "total_questions": len(session["questions"]),
        "completion_rate": round((len(answered_questions) / len(session["questions"])) * 100, 1),
        "interview_type": session["interview_type"],
        "job_role": session["job_role"],
        "difficulty": session["difficulty"],
        "feedback": {
            "strengths": ["Completed the interview", "Provided detailed answers"],
            "improvements": ["Practice more technical questions", "Work on conciseness"],
            "overall": f"You scored {average_score:.1f}/100. {'Great job!' if average_score >= 70 else 'Keep practicing to improve your performance.'}"
        },
        "recommendations": [
            "Practice more behavioral questions",
            "Review system design concepts",
            "Work on communication skills"
        ]
    }
    
    return analysis
# --- WebSocket for real-time transcription ---
@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket transcription client connected")
    accumulated_audio = b""
    CHUNK_THRESHOLD = 12000  # ~1.5s of audio — respond faster
    try:
        while True:
            try:
                message = await websocket.receive()
            except Exception as e:  # noqa: BLE001
                logger.error(f"WS receive error: {e}")
                break

            # Handle disconnect messages
            if isinstance(message, dict) and message.get("type") == "websocket.disconnect":
                break

            data_bytes: bytes | None = None
            if isinstance(message, dict):
                if message.get('bytes') is not None:
                    data_bytes = message['bytes']
                elif message.get('text'):
                    # ignore text frames
                    data_bytes = None
            if data_bytes:
                accumulated_audio += data_bytes
                if len(accumulated_audio) >= CHUNK_THRESHOLD:
                    try:
                        from transcription import transcribe_audio  # type: ignore
                        transcript = await transcribe_audio(accumulated_audio)
                        if transcript and transcript.strip():
                            await websocket.send_json({"transcript": transcript.strip()})
                            logger.debug(f"Sent transcript chunk: {transcript[:60]}...")
                        accumulated_audio = b""
                    except Exception as e:  # noqa: BLE001
                        logger.warning(f"Transcription chunk failed: {e}")
                        accumulated_audio = b""
        # Transcribe any remaining audio on disconnect
        if len(accumulated_audio) > 2000:
            try:
                from transcription import transcribe_audio  # type: ignore
                transcript = await transcribe_audio(accumulated_audio)
                if transcript and transcript.strip():
                    await websocket.send_json({"transcript": transcript.strip()})
            except Exception:
                pass
    except WebSocketDisconnect:
        logger.info("WebSocket transcription client disconnected")
    except Exception as e:  # noqa: BLE001
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except Exception:  # noqa: BLE001
            pass

# -----------------------------
# Hybrid Technical QG Endpoint
# -----------------------------

def _build_qg_prompt(payload: Dict[str, Any]) -> str:
    """Build enhanced question generation prompt with resume focus."""
    job_role = payload.get("job_role", "Software Engineer")
    tech_stack = payload.get("tech_stack", [])
    difficulty = payload.get("difficulty", "medium")
    resume_summary = payload.get("resume_summary", "")
    exp_level = payload.get("exp_level", "1-3 years")
    total = int(payload.get("total", 10))
    
    # Parse resume for projects
    resume_projects = []
    if resume_summary:
        # Extract project mentions (simple parsing)
        lines = resume_summary.split("\n")
        for line in lines:
            if any(keyword in line.lower() for keyword in ["project", "built", "developed", "created", "implemented"]):
                resume_projects.append(line.strip())
    
    tech_stack_str = ", ".join(tech_stack) if tech_stack else "General"
    
    return f"""You are an expert technical interviewer conducting an ORAL interview.
Generate {total} interview questions for:

- Role: {job_role}
- Tech Stack: {tech_stack_str}
- Difficulty: {difficulty}
- Experience level: {exp_level}

CRITICAL REQUIREMENTS:
1. Questions should be CONVERSATIONAL and suitable for ORAL interview
2. Generate 2-3 questions SPECIFICALLY about the candidate's resume projects
3. Questions should encourage detailed explanations with examples
4. Avoid questions requiring written code or diagrams
5. Focus on "tell me about", "explain how", "walk me through" style

Resume Summary:
{resume_summary if resume_summary else "No resume provided"}

Resume Projects Identified:
{chr(10).join(f"- {p}" for p in resume_projects[:3]) if resume_projects else "None"}

Rules:
- 60% should be tailored to the resume & target role; 40% fundamentals.
- Vary difficulty based on exp_level (easy for 0-1y, medium 1-3y, medium-hard 3-5y, hard 5+).
- Output strictly JSON with this shape:
{{
  "questions": [
    {{ "id": "q1", "text": "Tell me about [specific resume project]. How did you approach [technical challenge]?", "category": "Resume", "difficulty": "medium-hard", "rubric": ["Project understanding", "Technical depth", "Problem-solving approach"] }},
    {{ "id": "q2", "text": "Walk me through your experience with [technology from resume]. What challenges did you face?", "category": "Resume", "difficulty": "medium", "rubric": ["Hands-on experience", "Challenge handling", "Learning approach"] }},
    {{ "id": "q3", "text": "Explain your role in [team project from resume]. How did you collaborate with others?", "category": "Resume", "difficulty": "medium", "rubric": ["Collaboration", "Communication", "Team dynamics"] }},
    ... (7 more general technical questions)
  ]
}}
""".strip()

async def _call_gemini(prompt: str, timeout: float = 8.0) -> Dict[str, Any]:
    import httpx
    headers = {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY or ""}
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.6, "maxOutputTokens": 1200}
    }
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(
            "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
            headers=headers,
            json=body,
        )
        resp.raise_for_status()
        data = resp.json()
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
        try:
            return json.loads(text)
        except Exception:
            return {"questions": []}

async def _call_groq(prompt: str, timeout: float = 6.0, api_key: Optional[str] = None) -> Dict[str, Any]:
    import httpx
    key = api_key or (GROQ_API_KEY or "")
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    body = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "You must return only valid JSON for interview questions."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.6,
        "max_tokens": 1000,
    }
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
        # Sanitize possible code fences or extra prose and extract JSON
        sanitized = text.strip()
        if sanitized.startswith("```"):
            # remove code fence markers like ```json ... ```
            sanitized = "\n".join([line for line in sanitized.splitlines() if not line.startswith("```")])
        # Try direct parse
        try:
            return json.loads(sanitized)
        except Exception:
            # Fallback: extract first JSON object "{ ... }"
            start = sanitized.find("{")
            end = sanitized.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(sanitized[start:end+1])
                except Exception:
                    pass
            return {"questions": []}

def _default_questions(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Fall back to internal bank if LLMs fail
    easy = question_bank.get("technical", {}).get("easy", [])
    medium = question_bank.get("technical", {}).get("medium", [])
    hard = question_bank.get("technical", {}).get("hard", [])
    qs = (easy + medium + hard)[:10]
    # Normalize to expected schema
    normalized = []
    for i, q in enumerate(qs, start=1):
        normalized.append({
            "id": q.get("id", f"tech_{i:03d}"),
            "text": q.get("question", ""),
            "category": q.get("category", "General"),
            "difficulty": q.get("difficulty", "medium"),
            "rubric": q.get("expected_points", []),
        })
    return {"questions": normalized}

# Fallbacks for aptitude and HR
def _default_questions_aptitude(difficulty: str, total: int) -> Dict[str, Any]:
    pool = []
    for level in [difficulty, "medium", "easy"]:
        pool.extend(question_bank.get("aptitude", {}).get(level, []))
    qs = pool[:max(1, total)]
    normalized = []
    for i, q in enumerate(qs, start=1):
        normalized.append({
            "id": q.get("id", f"apt_{i:03d}"),
            "text": q.get("question", ""),
            "category": q.get("category", "general"),
            "difficulty": q.get("difficulty", difficulty),
            "answer": q.get("answer", None),
            "explanation": q.get("explanation", None),
        })
    return {"questions": normalized}

def _default_questions_hr(total: int) -> Dict[str, Any]:
    pool = []
    for level in ["medium", "easy", "hard"]:
        pool.extend(question_bank.get("hr", {}).get(level, []))
    qs = pool[:max(1, total)]
    normalized = []
    for i, q in enumerate(qs, start=1):
        normalized.append({
            "id": q.get("id", f"hr_{i:03d}"),
            "text": q.get("question", ""),
            "category": q.get("category", "behavioral"),
            "difficulty": q.get("difficulty", "medium"),
            "star_points": ["Situation","Task","Action","Result"],
        })
    return {"questions": normalized}

@app.post("/generate-technical")
async def generate_technical(payload: Dict[str, Any]):
    try:
        prompt = _build_qg_prompt(payload)
        source = "gemini"
        result = {"questions": []}

        if GEMINI_API_KEY:
            try:
                result = await _call_gemini(prompt, timeout=8.0)
            except Exception as e:
                logger.warning(f"Gemini QG failed: {e}")
                result = {"questions": []}
        if not result.get("questions") and GROQ_API_KEY:
            source = "groq"
            try:
                result = await _call_groq(prompt, timeout=6.0, api_key=GROQ_API_KEY_TECHNICAL)
            except Exception as e:
                logger.warning(f"Groq QG failed: {e}")
                result = {"questions": []}
        if not result.get("questions"):
            source = "cache"
            result = _default_questions(payload)

        # Create session
        session_id = str(uuid.uuid4())
        session_obj = {
            "id": session_id,
            "user_id": payload.get("user_id", "demo"),
            "interview_type": "technical",
            "job_role": payload.get("job_role", "Software Engineer"),
            "difficulty": "adaptive",
            "status": "active",
            "questions": result.get("questions", []),
            "current_question": 0,
            "start_time": datetime.utcnow().isoformat(),
            "duration": payload.get("duration", 30),
        }
        interview_sessions[session_id] = session_obj

        # Persist to Supabase if available
        if supabase:
            try:
                supabase.table("interview_sessions").insert({
                    "id": session_id,
                    "user_id": session_obj["user_id"],
                    "session_type": "technical",
                    "job_role": session_obj.get("job_role"),
                    # Store difficulty inside questions_data to avoid schema mismatches
                    "questions_data": {"difficulty": session_obj.get("difficulty"), "questions": session_obj["questions"]},
                    "status": "active",
                    "started_at": datetime.utcnow().isoformat(),
                }).execute()
            except Exception as e:
                logger.warning(f"Supabase insert session failed: {e}")

        logger.info(f"✅ Generated {len(result.get('questions', []))} questions from {source}")
        logger.info(f"Resume summary length: {len((payload.get('resume_summary') or ''))}")
        return {"success": True, "session_id": session_id, "questions": result.get("questions", []), "source": source}
    except Exception as e:
        logger.error(f"generate_technical error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-aptitude")
async def generate_aptitude(payload: Dict[str, Any]):
    try:
        difficulty = payload.get("difficulty", "medium")
        total = int(payload.get("total", 15))
        resume_summary = payload.get("resume_summary", "")
        prompt = f"""
You are an expert aptitude interviewer conducting an ORAL interview. Generate {total} aptitude questions at {difficulty} level.

CRITICAL: These are for a SPOKEN interview — NOT a written test.
- Questions must be answerable VERBALLY
- Ask "How would you approach...", "Walk me through your reasoning...", "Explain how you would solve..."
- NO multiple choice, NO fill-in-the-blank
- Questions should test logical thinking, quantitative reasoning, and problem-solving VERBALLY

Categories:
- Logical Reasoning & Puzzles (40%): river-crossing, pattern recognition, deduction
- Quantitative Thinking (30%): mental math, estimation, probability reasoning
- Verbal & Critical Reasoning (20%): arguments, assumptions, conclusions
- Data Interpretation (10%): describe a scenario and ask for interpretation

Resume context: {resume_summary if resume_summary else "No resume provided"}

Output ONLY valid JSON:
{{
  "questions": [
    {{ "id": "apt1", "text": "...", "category": "logical_reasoning|quantitative|verbal|data_interpretation", "difficulty": "easy|medium|hard", "expected_points": ["point1", "point2"] }},
    ...
  ]
}}
"""
        result = await _call_groq(prompt, timeout=8.0, api_key=GROQ_API_KEY_APTITUDE)
        if not result.get("questions"):
            result = _default_questions_aptitude(difficulty, total)
        session_id = str(uuid.uuid4())
        session_obj = {
            "id": session_id,
            "user_id": payload.get("user_id", "demo"),
            "interview_type": "aptitude",
            "difficulty": difficulty,
            "status": "active",
            "questions": result.get("questions", []),
            "current_question": 0,
            "start_time": datetime.utcnow().isoformat(),
            "duration": payload.get("duration", 45),
        }
        interview_sessions[session_id] = session_obj
        if supabase:
            try:
                supabase.table("interview_sessions").insert({
                    "id": session_id,
                    "user_id": session_obj["user_id"],
                    "session_type": "aptitude",
                    "questions_data": {"difficulty": difficulty, "questions": session_obj["questions"]},
                    "status": "active",
                    "started_at": datetime.utcnow().isoformat(),
                }).execute()
            except Exception as e:
                logger.warning(f"Supabase insert session failed: {e}")
        return {"success": True, "session_id": session_id, "questions": result.get("questions", [])}
    except Exception as e:
        logger.error(f"generate_aptitude error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-hr")
async def generate_hr(payload: Dict[str, Any]):
    try:
        job_role = payload.get("job_role", "Software Engineer")
        exp_level = payload.get("exp_level", "1-3")
        resume_summary = payload.get("resume_summary", "")
        total = int(payload.get("total", 10))
        prompt = f"""
You are an expert HR interviewer conducting a LIVE verbal interview. Generate {total} behavioral/HR interview questions for:
Role: {job_role}
Experience Level: {exp_level} years
Resume Summary: {resume_summary if resume_summary else "No resume provided"}

IMPORTANT: Questions must feel natural and conversational — like a real HR round.
Mix these categories:
- "Tell me about yourself" / self-introduction (1 question)
- Behavioral (STAR method): conflict, teamwork, failure, leadership (40%)
- Motivation & fit: why this role, why this company, career goals (20%)
- Self-assessment: strengths, weaknesses, areas of growth (20%)
- Situational: "What would you do if..." scenarios (20%)

Each question should invite a detailed, story-driven answer.

Output ONLY valid JSON:
{{
  "questions": [
    {{ "id": "hr1", "text": "...", "category": "behavioral|motivation|self_assessment|situational", "difficulty": "easy|medium|hard", "expected_points": ["Situation","Task","Action","Result"] }},
    ...
  ]
}}
"""
        result = await _call_groq(prompt, timeout=8.0, api_key=GROQ_API_KEY_HR)
        if not result.get("questions"):
            result = _default_questions_hr(total)
        session_id = str(uuid.uuid4())
        session_obj = {
            "id": session_id,
            "user_id": payload.get("user_id", "demo"),
            "interview_type": "hr",
            "job_role": job_role,
            "difficulty": "adaptive",
            "status": "active",
            "questions": result.get("questions", []),
            "current_question": 0,
            "start_time": datetime.utcnow().isoformat(),
            "duration": payload.get("duration", 30),
        }
        interview_sessions[session_id] = session_obj
        if supabase:
            try:
                supabase.table("interview_sessions").insert({
                    "id": session_id,
                    "user_id": session_obj["user_id"],
                    "session_type": "hr",
                    "job_role": job_role,
                    "questions_data": {"questions": session_obj["questions"]},
                    "status": "active",
                    "started_at": datetime.utcnow().isoformat(),
                }).execute()
            except Exception as e:
                logger.warning(f"Supabase insert session failed: {e}")
        return {"success": True, "session_id": session_id, "questions": result.get("questions", [])}
    except Exception as e:
        logger.error(f"generate_hr error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Mount facial analysis router ─────────────────────────────────
if _ANALYSIS_AVAILABLE:
    app.include_router(analysis_router)
    logger.info("Facial analysis service mounted at /analysis/*")
else:
    logger.warning("Facial analysis service not available — interview_module missing")


# ══════════════════════════════════════════════════════════════════
#  Voice Interview Agent (adapted from real-time-voicebot)
# ══════════════════════════════════════════════════════════════════

try:
    from voice_agent import create_voice_agent, VoiceInterviewAgent
    _VOICE_AVAILABLE = True
except ImportError:
    _VOICE_AVAILABLE = False
    logger.warning("Voice agent not available — voice_agent.py missing or dependency error")

# In-memory voice sessions
voice_sessions: Dict[str, Any] = {}


class VoiceStartRequest(BaseModel):
    user_id: str
    interview_type: str = "technical"
    job_role: str = "Software Engineer"


class VoiceTranscriptRequest(BaseModel):
    session_id: str
    transcript: str


@app.post("/voice/start")
async def voice_start(req: VoiceStartRequest):
    """Start a voice interview session. Returns greeting text (+ audio if TTS configured)."""
    if not _VOICE_AVAILABLE:
        raise HTTPException(status_code=501, detail="Voice agent not available")

    agent = create_voice_agent(req.interview_type, req.job_role)
    session_id = str(uuid.uuid4())
    voice_sessions[session_id] = agent

    greeting = await agent.get_greeting()

    return {
        "session_id": session_id,
        "greeting": greeting,
        "tts_available": bool(os.getenv("ELEVENLABS_API_KEY")),
    }


@app.post("/voice/respond")
async def voice_respond(req: VoiceTranscriptRequest):
    """Send a transcript (from STT) and get AI response back."""
    agent = voice_sessions.get(req.session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Voice session not found")

    ai_response = await agent.process_transcript(req.transcript)

    return {
        "response": ai_response,
        "exchanges": len(agent.get_conversation_history()) // 2,
    }


@app.post("/voice/tts")
async def voice_tts(req: VoiceTranscriptRequest):
    """Generate TTS audio for text. Returns audio/mpeg bytes."""
    agent = voice_sessions.get(req.session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Voice session not found")

    audio_bytes = await agent.generate_tts_audio(req.transcript)
    if not audio_bytes:
        raise HTTPException(status_code=501, detail="TTS not configured (set ELEVENLABS_API_KEY)")

    from fastapi.responses import Response
    return Response(content=audio_bytes, media_type="audio/mpeg")


@app.get("/voice/history/{session_id}")
async def voice_history(session_id: str):
    """Get conversation history for a voice session."""
    agent = voice_sessions.get(session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Voice session not found")

    return {
        "history": agent.get_conversation_history(),
        "summary": agent.get_summary(),
    }


if __name__ == "__main__":
    # Get configuration from environment
    host = os.getenv("SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("SERVICE_PORT", "8002"))
    
    # Run the service
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        reload_dirs=[str(Path(__file__).parent)],  # only watch this dir, not interview_module
        log_level="info"
    )
