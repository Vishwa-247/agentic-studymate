import logging
import os
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, Request
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

# Load .env from backend root folder
backend_root = Path(__file__).parent.parent
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="StudyMate API Gateway - Supabase Edition", version="2.0.0")

# -----------------
# CORS configuration
# -----------------
# Avoid allow_origins=['*'] when credentials are enabled.
# - ALLOWED_ORIGINS: comma-separated explicit origins
# - ALLOWED_ORIGIN_REGEX: regex for dynamic preview domains (default: lovable preview subdomains)
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
    allow_credentials=False, # Must be False for wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    method = request.method
    path = request.url.path
    
    print(f"📥 Incoming {method} request to {path}")
    
    try:
        response = await call_next(request)
        duration = datetime.now() - start_time
        print(f"📤 {method} {path} completed with {response.status_code} in {duration.total_seconds():.2f}s")
        return response
    except Exception as e:
        print(f"❌ Error processing {method} {path}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise e

@app.get("/health")
async def health_check():
    """Health check with service status"""
    service_health = {}
    
    # Check each service health
    for service_name, service_url in AGENT_SERVICES.items():
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{service_url}/health")
                service_health[service_name] = {
                    "status": "healthy" if response.status_code == 200 else "unhealthy",
                    "response_code": response.status_code
                }
        except Exception as e:
            service_health[service_name] = {
                "status": "unhealthy",
                "error": str(e)
            }
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "services": service_health,
        "database": "supabase_postgresql"
    }

# Security
security = HTTPBearer()

# Agent service URLs - Local development setup
AGENT_SERVICES = {
    "resume-analyzer": os.getenv("RESUME_ANALYZER_URL", "http://127.0.0.1:8003"),
    "profile-service": os.getenv("PROFILE_SERVICE_URL", "http://127.0.0.1:8006"),
    "course-generation": os.getenv("COURSE_GENERATION_URL", "http://127.0.0.1:8008"),
    "interview-coach": os.getenv("INTERVIEW_COACH_URL", "http://127.0.0.1:8002"),
    "evaluator": os.getenv("EVALUATOR_URL", "http://127.0.0.1:8010"),
    "orchestrator": os.getenv("ORCHESTRATOR_URL", "http://127.0.0.1:8011"),
    "project-studio": os.getenv("PROJECT_STUDIO_URL", "http://127.0.0.1:8012"),
    "job-search": os.getenv("JOB_SEARCH_URL", "http://127.0.0.1:8013"),
}

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        # Prefer UUID if present in token; fallback to sub (email)
        user_id: str = payload.get("uid") or payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def resolve_user_uuid_by_email(email: str) -> Optional[str]:
    """Resolve Supabase auth user's UUID by email using Admin API."""
    if not (SUPABASE_URL and SUPABASE_SERVICE_KEY):
        return None
    try:
        # Admin list users by email (supported by Supabase Auth Admin API)
        url = f"{SUPABASE_URL}/auth/v1/admin/users"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        }
        params = {"email": email}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers, params=params)
            if resp.status_code != 200:
                return None
            data = resp.json()
            # Response may be list under key 'users' or array directly
            users = data.get("users") if isinstance(data, dict) else data
            if isinstance(users, list) and users:
                return users[0].get("id")
            return None
    except Exception:
        return None

async def forward_to_agent(
    agent_name: str,
    path: str,
    method: str = "GET",
    data: dict = None,
    headers: dict = None,
):
    """Forward request to specific agent service.

    Important: callers should pass through the incoming Authorization header so
    downstream services can re-verify auth.
    """
    if agent_name not in AGENT_SERVICES:
        raise HTTPException(status_code=404, detail=f"Agent {agent_name} not found")

    agent_url = AGENT_SERVICES[agent_name]
    url = f"{agent_url}{path}"

    fwd_headers = headers or {}

    async with httpx.AsyncClient(timeout=60.0) as client:
        if method == "GET":
            response = await client.get(url, headers=fwd_headers)
        elif method == "POST":
            response = await client.post(url, json=data, headers=fwd_headers)
        elif method == "PUT":
            response = await client.put(url, json=data, headers=fwd_headers)
        elif method == "DELETE":
            response = await client.delete(url, headers=fwd_headers)
    return JSONResponse(content=response.json(), status_code=response.status_code)

@app.get("/")
async def root():
    return {
        "message": "StudyMate API Gateway - Supabase Edition", 
        "version": "2.0.0",
        "database": "supabase_postgresql",
        "services": list(AGENT_SERVICES.keys())
    }


# Authentication endpoints

def _is_origin_allowed(origin: str) -> bool:
    if not origin:
        return False
    if origin in ALLOWED_ORIGINS:
        return True
    if ALLOWED_ORIGIN_REGEX:
        try:
            return re.match(ALLOWED_ORIGIN_REGEX, origin) is not None
        except re.error:
            return False
    return False


def _preflight_headers(request: Request, methods: str) -> dict:
    origin = request.headers.get("origin", "")
    headers = {
        "Access-Control-Allow-Methods": methods,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
    if _is_origin_allowed(origin):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Vary"] = "Origin"
    return headers


@app.options("/auth/signin")
async def options_signin(request: Request):
    """Handle CORS preflight requests"""
    return Response(content="OK", status_code=200, headers=_preflight_headers(request, "POST, OPTIONS"))


# Optional: global OPTIONS fallback
@app.options("/{full_path:path}")
async def options_any(full_path: str, request: Request):
    return Response(
        content="OK",
        status_code=200,
        headers=_preflight_headers(request, "GET, POST, PUT, DELETE, OPTIONS"),
    )

@app.post("/auth/signin")
async def sign_in(credentials: dict):
    # For demo purposes, accept any email/password
    email = credentials.get("email")
    password = credentials.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    # Resolve uuid if possible
    uid = await resolve_user_uuid_by_email(email)
    # Create access token (include uid claim when available)
    token_payload = {"sub": email}
    if uid:
        token_payload["uid"] = uid
    access_token = create_access_token(data=token_payload)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": uid or email,
            "email": email,
            "name": email.split("@")[0].title()
        }
    }

@app.post("/auth/signup")
async def sign_up(user_data: dict):
    # For demo purposes, accept any registration
    email = user_data.get("email")
    password = user_data.get("password")
    name = user_data.get("name", email.split("@")[0].title() if email else "User")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    # Create access token
    access_token = create_access_token(data={"sub": email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": email,
            "email": email,
            "name": name
        }
    }

@app.post("/auth/signout")
async def sign_out(user_id: str = Depends(verify_token)):
    return {"message": "Signed out successfully"}

# Course Generation Routes
@app.post("/courses/generate")
async def generate_course(course_data: dict, user_id: str = Depends(verify_token)):
    course_data["user_id"] = user_id
    return await forward_to_agent("course-generation", "/generate", "POST", course_data)

@app.post("/courses/generate-parallel")
async def generate_course_parallel(course_data: dict, request: Request, user_id: str = Depends(verify_token)):
    """Generate course with parallel AI agents (Oboe-style)."""
    # Pass through the Authorization header so downstream can verify.
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("course-generation", "/generate-course-parallel", "POST", course_data, headers=headers)

@app.get("/courses")
async def get_courses(request: Request, user_id: str = Depends(verify_token)):
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("course-generation", f"/courses", "GET", headers=headers)

@app.get("/courses/{course_id}")
async def get_course(course_id: str, request: Request, user_id: str = Depends(verify_token)):
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("course-generation", f"/courses/{course_id}", "GET", headers=headers)

@app.get("/courses/{course_id}/content")
async def get_course_content(course_id: str, request: Request, user_id: str = Depends(verify_token)):
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("course-generation", f"/courses/{course_id}/content", "GET", headers=headers)

@app.delete("/courses/{course_id}")
async def delete_course(course_id: str, request: Request, user_id: str = Depends(verify_token)):
    """Delete course and all related content"""
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("course-generation", f"/courses/{course_id}", "DELETE", headers=headers)

# Interview Routes
@app.post("/interviews/start")
async def start_interview(interview_data: dict, request: Request, user_id: str = Depends(verify_token)):
    interview_data["user_id"] = user_id
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("interview-coach", "/start", "POST", interview_data, headers=headers)

@app.get("/interviews")
async def get_interviews(request: Request, user_id: str = Depends(verify_token)):
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("interview-coach", f"/interviews?user_id={user_id}", "GET", headers=headers)

@app.get("/interviews/{interview_id}")
async def get_interview(interview_id: str, request: Request, user_id: str = Depends(verify_token)):
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("interview-coach", f"/interviews/{interview_id}", "GET", headers=headers)

@app.post("/interviews/{interview_id}/analyze")
async def analyze_interview(interview_id: str, analysis_data: dict, user_id: str = Depends(verify_token)):
    return await forward_to_agent("interview-coach", f"/interviews/{interview_id}/analyze", "POST", analysis_data)

# Technical Interview: Hybrid Question Generation
@app.post("/interviews/technical/generate")
async def generate_technical(interview_data: dict, user_id: str = Depends(verify_token)):
    interview_data["user_id"] = user_id
    return await forward_to_agent("interview-coach", "/generate-technical", "POST", interview_data)
@app.post("/interviews/{interview_id}/answer")
async def submit_interview_answer(
    interview_id: str,
    request: Request,
    user_id: str = Depends(verify_token),
    audio: UploadFile | None = File(None),
    question_id: str | None = Form(None),
):
    """Forward answer uploads (multipart) to interview-coach service."""
    try:
        target = f"{AGENT_SERVICES['interview-coach']}/interviews/{interview_id}/answer"
        auth = request.headers.get("Authorization")
        headers = {"Authorization": auth} if auth else {}

        async with httpx.AsyncClient(timeout=60.0) as client:
            if audio is not None:
                files = {"audio": (audio.filename, await audio.read(), audio.content_type or "application/octet-stream")}
                data = {}
                if question_id is not None:
                    data["question_id"] = question_id
                # Forward facial_data if provided in form
                try:
                    form_data = await request.form()
                    facial_data_str = form_data.get("facial_data")
                    if facial_data_str:
                        data["facial_data"] = facial_data_str
                except Exception:
                    pass
                resp = await client.post(target, headers=headers, files=files, data=data)
            else:
                # JSON fallback
                payload = {"question_id": question_id or "0", "answer": ""}
                resp = await client.post(target, headers=headers, json=payload)
        return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/interviews/generate-aptitude")
async def generate_aptitude(interview_data: dict, user_id: str = Depends(verify_token)):
    interview_data["user_id"] = user_id
    return await forward_to_agent("interview-coach", "/generate-aptitude", "POST", interview_data)

@app.post("/interviews/generate-hr")
async def generate_hr(interview_data: dict, user_id: str = Depends(verify_token)):
    interview_data["user_id"] = user_id
    return await forward_to_agent("interview-coach", "/generate-hr", "POST", interview_data)


# ============================================
# Interview Journey Routes (Milestone 2)
# Gateway-only exposed under /api/interview/*
# ============================================


@app.post("/api/interview/start")
async def api_interview_start(payload: dict, request: Request, user_id: str = Depends(verify_token)):
    """Start deterministic interview journey. Injects verified user_id."""
    payload["user_id"] = user_id
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("interview-coach", "/api/interview/start", "POST", payload, headers=headers)


@app.post("/api/interview/step")
async def api_interview_step(payload: dict, request: Request, user_id: str = Depends(verify_token)):
    """Advance deterministic interview journey. Injects verified user_id."""
    payload["user_id"] = user_id
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("interview-coach", "/api/interview/step", "POST", payload, headers=headers)


# ============================================
# Facial / Body-Language Analysis Routes
# (proxied to interview-coach /analysis/*)
# ============================================

@app.post("/interviews/analyze-frame")
async def analyze_frame(payload: dict):
    """
    Forward a single camera frame to the interview-coach facial analysis
    service.  No auth required — the frame data is ephemeral and does not
    mutate user state directly.  Session binding is via session_id in the
    payload.
    """
    return await forward_to_agent(
        "interview-coach", "/analysis/analyze-frame", "POST", payload
    )


@app.post("/interviews/analysis/start-session")
async def start_analysis_session(payload: dict, user_id: str = Depends(verify_token)):
    """Start a facial-analysis session (pre-warm ML processors)."""
    payload.setdefault("user_id", user_id)
    return await forward_to_agent(
        "interview-coach", "/analysis/start-session", "POST", payload
    )


@app.post("/interviews/analysis/mark-question")
async def mark_analysis_question(payload: dict, user_id: str = Depends(verify_token)):
    """Notify the stress estimator about a new question."""
    return await forward_to_agent(
        "interview-coach", "/analysis/mark-question", "POST", payload
    )


@app.post("/interviews/analysis/end-session")
async def end_analysis_session(payload: dict, user_id: str = Depends(verify_token)):
    """End the analysis session and retrieve the aggregate summary."""
    return await forward_to_agent(
        "interview-coach", "/analysis/end-session", "POST", payload
    )


@app.get("/interviews/analysis/sessions")
async def list_analysis_sessions(user_id: str = Depends(verify_token)):
    """Debug: list active analysis sessions."""
    return await forward_to_agent(
        "interview-coach", "/analysis/sessions", "GET"
    )


# Chat Routes
@app.post("/chat/message")
async def send_message(message_data: dict, user_id: str = Depends(verify_token)):
    message_data["user_id"] = user_id
    return await forward_to_agent("chat-mentor", "/message", "POST", message_data)

# Progress Routes
@app.get("/progress")
async def get_progress(user_id: str = Depends(verify_token)):
    return await forward_to_agent("progress-analyst", f"/progress?user_id={user_id}", "GET")

# Resume Analyzer Routes
@app.post("/resume/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_role: str = Form(...),
    job_description: str = Form(""),
    user_id: Optional[str] = Form(None)
):
    """Analyze resume for specific job role"""
    async with httpx.AsyncClient(timeout=120.0) as client:
        files = {"resume": (resume.filename, await resume.read(), resume.content_type)}
        data = {
            "job_role": job_role,
            "job_description": job_description,
            "user_id": user_id or "demo"
        }
        response = await client.post(f"{AGENT_SERVICES['resume-analyzer']}/analyze-resume", files=files, data=data)
        return JSONResponse(content=response.json(), status_code=response.status_code)

# Profile Service Routes
@app.post("/api/profile/extract-profile")
async def extract_profile(
    resume: UploadFile = File(...),
    user_id: str = Form(...),
    user_id_verified: str = Depends(verify_token)
):
    """Extract profile data from resume using Groq AI"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        files = {"resume": (resume.filename, await resume.read(), resume.content_type)}
        data = {"user_id": user_id}
        response = await client.post(f"{AGENT_SERVICES['profile-service']}/extract-profile", files=files, data=data)
        return response.json()

@app.get("/api/profile/{user_id}")
async def get_profile(user_id: str, user_id_verified: str = Depends(verify_token)):
    """Get user profile"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{AGENT_SERVICES['profile-service']}/profile/{user_id}")
        return response.json()

@app.put("/api/profile/{user_id}")
async def update_profile(user_id: str, profile_data: dict, user_id_verified: str = Depends(verify_token)):
    """Update user profile"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.put(f"{AGENT_SERVICES['profile-service']}/profile/{user_id}", json=profile_data)
        return response.json()

@app.post("/resume/extract-profile")
async def extract_profile_data(
    resume: UploadFile = File(...),
    user_id: str = Form(...)
):
    """Extract profile data from resume (legacy endpoint)"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        files = {"resume": (resume.filename, await resume.read(), resume.content_type)}
        data = {"user_id": user_id}
        response = await client.post(f"{AGENT_SERVICES['resume-analyzer']}/extract-profile-data", files=files, data=data)
        return response.json()

# Groq Resume Analyzer Routes
@app.post("/api/resume-groq/analyze-resume")
async def analyze_resume_groq(
    resume: UploadFile = File(...),
    job_role: str = Form(...),
    job_description: str = Form(""),
    user_id: Optional[str] = Form(None)
):
    """Analyze resume using Groq AI"""
    async with httpx.AsyncClient(timeout=120.0) as client:
        files = {"resume": (resume.filename, await resume.read(), resume.content_type)}
        data = {
            "job_role": job_role,
            "job_description": job_description,
            "user_id": user_id or "demo"
        }
        response = await client.post(f"{AGENT_SERVICES['resume-analyzer-groq']}/analyze-resume", files=files, data=data)
        return response.json()

@app.post("/api/resume-groq/quick-suggestions")
async def get_quick_suggestions_groq(job_role: str = Form(...)):
    """Get quick suggestions for job role"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        data = {"job_role": job_role}
        response = await client.post(f"{AGENT_SERVICES['resume-analyzer-groq']}/quick-suggestions", data=data)
        return response.json()

# Enhanced Resume Analyzer Routes
@app.get("/resume/analysis-history/{user_id}")
async def get_resume_analysis_history(user_id: str):
    """Get user's resume analysis history"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{AGENT_SERVICES['resume-analyzer']}/analysis-history/{user_id}")
        return response.json()

@app.get("/resume/analysis/{analysis_id}")
async def get_resume_analysis_details(analysis_id: str):
    """Get detailed analysis results by ID"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{AGENT_SERVICES['resume-analyzer']}/analysis/{analysis_id}")
        return response.json()

@app.get("/resume/user-resumes/{user_id}")
async def get_user_resumes(user_id: str):
    """Get all resumes uploaded by a user"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{AGENT_SERVICES['resume-analyzer']}/user-resumes/{user_id}")
        return response.json()


# ============================================
# EVALUATOR & ORCHESTRATOR ROUTES (NEW)
# ============================================

@app.post("/api/evaluate")
async def api_evaluate(request: Request):
    """
    Forward evaluation request to Evaluator service.
    Dumb proxy - no business logic here.
    """
    try:
        payload = await request.json()
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{AGENT_SERVICES['evaluator']}/evaluate",
                json=payload
            )
            return response.json()
    except httpx.RequestError as e:
        logger.error(f"Evaluator service unavailable: {e}")
        raise HTTPException(status_code=503, detail="Evaluator service unavailable")


@app.get("/api/next")
async def api_next(user_id: str):
    """
    Forward routing request to Orchestrator service.
    Dumb proxy - no business logic here.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{AGENT_SERVICES['orchestrator']}/next",
                params={"user_id": user_id}
            )
            return response.json()
    except httpx.RequestError as e:
        logger.error(f"Orchestrator service unavailable: {e}")
        raise HTTPException(status_code=503, detail="Orchestrator service unavailable")

@app.post("/api/project-studio/{path:path}")
async def api_project_studio(path: str, request: Request, user_id: str = Depends(verify_token)):
    """
    Forward to Project Studio agents.
    """
    try:
        payload = await request.json()
    except:
        payload = {}
        
    return await forward_to_agent("project-studio", f"/agent/{path}", "POST", payload)

@app.post("/api/job-search/{path:path}")
async def api_job_search(path: str, request: Request, user_id: str = Depends(verify_token)):
    """
    Forward to Job Search Agent.
    """
    try:
        payload = await request.json()
    except:
        payload = {}
        
    return await forward_to_agent("job-search", f"/{path}", "POST", payload)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

