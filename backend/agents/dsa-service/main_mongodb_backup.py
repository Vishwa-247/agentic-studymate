from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import csv
import io
import os
import re
import httpx
from pymongo import MongoClient
from bson import ObjectId
import motor.motor_asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from backend root
backend_root = Path(__file__).parent.parent.parent
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

# Database connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "coding_interview_prep")

# Supabase and AI configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize Groq client
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

# Collections
progress_collection = db.dsa_progress
preferences_collection = db.dsa_preferences
analytics_collection = db.dsa_analytics

# Pydantic models
class DSAProgress(BaseModel):
    user_id: str
    topic_id: str
    problem_name: str
    completed: bool
    completed_at: Optional[datetime] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None

class DSAFilters(BaseModel):
    difficulty: List[str] = []
    category: List[str] = []
    companies: List[str] = []
    search_query: Optional[str] = None

class DSAUserPreferences(BaseModel):
    user_id: str
    filters: DSAFilters
    favorites: List[str] = []
    last_visited: List[str] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DSAAnalytics(BaseModel):
    user_id: str
    total_problems: int = 0
    solved_problems: int = 0
    difficulty: Dict[str, int] = {}
    category: Dict[str, int] = {}
    streak_days: int = 0
    last_activity: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Feedback and AI Chatbot Models
class FeedbackRequest(BaseModel):
    feedback_id: str
    user_id: str
    problem_name: str
    difficulty: str
    category: str
    rating: int
    time_spent: Optional[int] = None
    struggled_areas: List[str] = []
    detailed_feedback: Optional[str] = ""

class ChatbotRequest(BaseModel):
    query: str
    user_id: str
    context: str = "dsa_practice"
    user_level: str = "intermediate"
    feedback_history: List[Dict] = []

class ChatbotResponse(BaseModel):
    response: str
    source: str
    suggestions: Optional[List[Dict]] = None

class AISuggestions(BaseModel):
    approach_suggestions: List[str]
    key_concepts: List[str]
    similar_problems: List[str]
    learning_resources: List[Dict[str, str]]
    overall_advice: str

# FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("DSA Service starting up...")
    
    # Create indexes (gracefully handle MongoDB being unavailable)
    try:
        await progress_collection.create_index([("user_id", 1), ("topic_id", 1), ("problem_name", 1)], unique=True)
        await preferences_collection.create_index("user_id", unique=True)
        await analytics_collection.create_index("user_id", unique=True)
        print("✅ MongoDB indexes created successfully")
    except Exception as e:
        print(f"⚠️  MongoDB not available — DSA service will run in degraded mode: {e}")
    
    yield
    
    # Shutdown
    print("DSA Service shutting down...")

app = FastAPI(
    title="DSA Service",
    description="Service for managing DSA progress, filters, and analytics",
    version="1.0.0",
    lifespan=lifespan
)

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

# Helper functions
async def update_analytics(user_id: str):
    """Update user analytics after progress change"""
    progress_items = await progress_collection.find({"user_id": user_id}).to_list(None)
    
    total_problems = len(progress_items)
    solved_problems = len([p for p in progress_items if p.get("completed", False)])
    
    difficulty_stats = {}
    category_stats = {}
    
    for item in progress_items:
        if item.get("completed", False):
            diff = item.get("difficulty", "Unknown")
            cat = item.get("category", "Unknown")
            
            difficulty_stats[diff] = difficulty_stats.get(diff, 0) + 1
            category_stats[cat] = category_stats.get(cat, 0) + 1
    
    # Calculate streak
    streak_days = await calculate_streak(user_id)
    
    # Update analytics
    await analytics_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "total_problems": total_problems,
                "solved_problems": solved_problems,
                "difficulty": difficulty_stats,
                "category": category_stats,
                "streak_days": streak_days,
                "last_activity": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )

async def calculate_streak(user_id: str) -> int:
    """Calculate current streak of consecutive days with activity"""
    now = datetime.utcnow()
    streak = 0
    current_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    while True:
        next_date = current_date + timedelta(days=1)
        
        # Check if there's activity on this date
        activity = await progress_collection.find_one({
            "user_id": user_id,
            "completed_at": {
                "$gte": current_date,
                "$lt": next_date
            }
        })
        
        if activity:
            streak += 1
            current_date -= timedelta(days=1)
        else:
            break
    
    return streak

# Feedback and AI Utility Functions
async def get_user_feedback_history(user_id: str, limit: int = 5) -> List[Dict]:
    """Get user's recent feedback history for context"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/dsa_feedbacks",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                },
                params={
                    "user_id": f"eq.{user_id}",
                    "order": "created_at.desc",
                    "limit": str(limit),
                    "select": "problem_name,difficulty,rating,struggled_areas,ai_suggestions"
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to fetch feedback history: {response.status_code}")
                return []
    except Exception as e:
        print(f"Error fetching feedback history: {e}")
        return []

async def update_feedback_suggestions(feedback_id: str, suggestions: AISuggestions):
    """Update feedback with AI suggestions"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/dsa_feedbacks",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                },
                params={"id": f"eq.{feedback_id}"},
                json={
                    "ai_suggestions": suggestions.dict(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            )
            
            if response.status_code == 200:
                print(f"✅ Updated feedback {feedback_id} with AI suggestions")
            else:
                print(f"Failed to update feedback: {response.status_code}")
    except Exception as e:
        print(f"Error updating feedback suggestions: {e}")

async def generate_enhanced_ai_suggestions(feedback: FeedbackRequest) -> AISuggestions:
    """Generate enhanced AI suggestions based on specific feedback"""
    
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
    
    # Build enhanced prompt
    struggled_areas_text = ", ".join(feedback.struggled_areas) if feedback.struggled_areas else "None specified"
    time_info = f" (spent {feedback.time_spent} minutes)" if feedback.time_spent else ""
    
    prompt = f"""You are an expert DSA mentor analyzing a student's feedback.

PROBLEM DETAILS:
- Problem: {feedback.problem_name}
- Difficulty: {feedback.difficulty}
- Category: {feedback.category}
- Rating: {feedback.rating}/5 stars{time_info}
- Struggled With: {struggled_areas_text}
- Additional Feedback: {feedback.detailed_feedback or "None"}

Based on this SPECIFIC feedback, provide PERSONALIZED suggestions:

1. **Approach Suggestions** (3-5 tactical strategies):
   - Address the EXACT areas they struggled with: {struggled_areas_text}
   - Be specific to {feedback.problem_name}
   - Include mental models or patterns
   - Consider their {feedback.difficulty} level

2. **Key Concepts** (3-4 fundamental concepts):
   - Focus on gaps revealed by their struggles
   - Link to theoretical foundations
   - Explain why these concepts matter for {feedback.category}

3. **Similar Problems** (3-4 practice recommendations):
   - Gradually increasing difficulty
   - Same concept, different context
   - Include problem names and brief descriptions

4. **Learning Resources** (3-4 specific resources):
   - Format: {{"type": "video/article/course", "title": "...", "description": "...", "url": "..."}}
   - Target their knowledge gaps
   - Include YouTube videos when relevant

5. **Overall Advice** (2-3 sentences of encouragement):
   - Acknowledge their specific struggles
   - Provide motivation and next steps

IMPORTANT: 
- Make suggestions UNIQUE to this feedback, not generic advice
- Be specific to {feedback.problem_name} and their struggles
- Consider their {feedback.rating}/5 rating and time spent
- Return valid JSON only

Return JSON in this exact format:
{{
  "approach_suggestions": ["strategy1", "strategy2", "strategy3"],
  "key_concepts": ["concept1", "concept2", "concept3"],
  "similar_problems": ["problem1", "problem2", "problem3"],
  "learning_resources": [
    {{"type": "video", "title": "Title", "description": "Description", "url": "https://..."}},
    {{"type": "article", "title": "Title", "description": "Description", "url": "https://..."}}
  ],
  "overall_advice": "Encouraging advice specific to their situation"
}}"""

    try:
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert DSA mentor. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=2000
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Clean the response
        if response_text.startswith('```json'):
            response_text = response_text.replace('```json', '').replace('```', '')
        elif response_text.startswith('```'):
            response_text = response_text.replace('```', '')
        
        response_text = response_text.strip()
        
        if not response_text:
            raise Exception("Empty response from Groq")
        
        suggestions_data = json.loads(response_text)
        
        return AISuggestions(
            approach_suggestions=suggestions_data.get("approach_suggestions", []),
            key_concepts=suggestions_data.get("key_concepts", []),
            similar_problems=suggestions_data.get("similar_problems", []),
            learning_resources=suggestions_data.get("learning_resources", []),
            overall_advice=suggestions_data.get("overall_advice", "")
        )
        
    except Exception as e:
        print(f"Enhanced AI suggestions generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI suggestions generation failed: {str(e)}")

async def generate_contextual_chatbot_response(query: str, user_id: str, feedback_history: List[Dict]) -> ChatbotResponse:
    """Generate contextual chatbot response using feedback history"""
    
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
    
    # Analyze feedback history
    common_struggles = {}
    low_rated_problems = []
    recent_categories = []
    
    for feedback in feedback_history:
        # Count struggles
        for area in feedback.get("struggled_areas", []):
            common_struggles[area] = common_struggles.get(area, 0) + 1
        
        # Track low ratings
        if feedback.get("rating", 5) <= 2:
            low_rated_problems.append(feedback.get("problem_name", ""))
        
        # Track categories
        if feedback.get("category"):
            recent_categories.append(feedback.get("category"))
    
    # Build context
    context_parts = []
    if common_struggles:
        top_struggles = sorted(common_struggles.items(), key=lambda x: x[1], reverse=True)[:3]
        context_parts.append(f"Recent struggles: {', '.join([s[0] for s in top_struggles])}")
    
    if low_rated_problems:
        context_parts.append(f"Challenging problems: {', '.join(low_rated_problems[:3])}")
    
    if recent_categories:
        unique_categories = list(set(recent_categories))
        context_parts.append(f"Recent focus areas: {', '.join(unique_categories[:3])}")
    
    context_text = ". ".join(context_parts) if context_parts else "No recent feedback history"
    
    # Build enhanced prompt
    system_prompt = f"""You are an expert DSA tutor and mentor. 

STUDENT CONTEXT:
{context_text}

INSTRUCTIONS:
- **Keep responses under 150 words**
- Use bullet points, not long paragraphs
- Provide concise, actionable advice
- When suggesting resources, include YouTube video links: [Video Title](https://youtube.com/watch?v=...)
- Be encouraging but brief

RESPONSE FORMAT:
1. Acknowledge their situation (1 sentence)
2. Provide 2-3 bullet points of advice
3. Include 1-2 resource links
4. End with brief encouragement (1 sentence)"""

    try:
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=400
        )
        
        response_text = response.choices[0].message.content.strip()
        
        return ChatbotResponse(
            response=response_text,
            source="contextual_ai",
            suggestions=None
        )
        
    except Exception as e:
        print(f"Contextual chatbot response generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chatbot response generation failed: {str(e)}")

# Routes
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "dsa-unified-service",
        "version": "2.0.0",
        "features": [
            "progress_tracking",
            "analytics", 
            "favorites",
            "ai_feedback",
            "contextual_chatbot"
        ],
        "groq_configured": groq_client is not None
    }

# Progress management
@app.post("/progress", response_model=DSAProgress)
async def update_progress(progress: DSAProgress, user_id: str = Depends(verify_request_user_id)):
    """Update user's progress on a specific problem"""
    try:
        if str(progress.user_id) != str(user_id):
            raise HTTPException(status_code=403, detail="Forbidden")

        # Update or insert progress
        result = await progress_collection.update_one(
            {
                "user_id": progress.user_id,
                "topic_id": progress.topic_id,
                "problem_name": progress.problem_name
            },
            {
                "$set": {
                    "completed": progress.completed,
                    "completed_at": progress.completed_at or datetime.utcnow(),
                    "difficulty": progress.difficulty,
                    "category": progress.category
                }
            },
            upsert=True
        )
        
        # Update analytics
        await update_analytics(progress.user_id)
        
        return progress
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/progress/{user_id}")
async def get_progress(user_id: str, authed_user_id: str = Depends(verify_request_user_id)):
    """Get all progress for the authenticated user"""
    try:
        if str(user_id) != str(authed_user_id):
            raise HTTPException(status_code=403, detail="Forbidden")

        progress_items = await progress_collection.find({"user_id": user_id}).to_list(None)

        # Convert ObjectId to string for JSON serialization
        for item in progress_items:
            item["_id"] = str(item["_id"])

        return progress_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/progress/{user_id}/{topic_id}")
async def get_topic_progress(user_id: str, topic_id: str):
    """Get progress for a specific topic"""
    try:
        progress_items = await progress_collection.find({
            "user_id": user_id,
            "topic_id": topic_id
        }).to_list(None)
        
        for item in progress_items:
            item["_id"] = str(item["_id"])
        
        return progress_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/progress/bulk")
async def bulk_update_progress(progress_items: List[DSAProgress]):
    """Bulk update multiple progress items"""
    try:
        operations = []
        user_ids = set()
        
        for progress in progress_items:
            user_ids.add(progress.user_id)
            operations.append({
                "updateOne": {
                    "filter": {
                        "user_id": progress.user_id,
                        "topic_id": progress.topic_id,
                        "problem_name": progress.problem_name
                    },
                    "update": {
                        "$set": {
                            "completed": progress.completed,
                            "completed_at": progress.completed_at or datetime.utcnow(),
                            "difficulty": progress.difficulty,
                            "category": progress.category
                        }
                    },
                    "upsert": True
                }
            })
        
        if operations:
            await progress_collection.bulk_write(operations)
            
            # Update analytics for all affected users
            for user_id in user_ids:
                await update_analytics(user_id)
        
        return {"updated": len(operations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Filter preferences
@app.post("/filters")
async def save_filters(user_id: str, filters: DSAFilters):
    """Save user's filter preferences"""
    try:
        await preferences_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "filters": filters.dict(),
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        return {"message": "Filters saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/filters/{user_id}")
async def get_filters(user_id: str):
    """Get user's filter preferences"""
    try:
        preferences = await preferences_collection.find_one({"user_id": user_id})
        
        if preferences and "filters" in preferences:
            return preferences["filters"]
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# User preferences
@app.post("/preferences")
async def save_preferences(preferences: DSAUserPreferences):
    """Save user's complete preferences"""
    try:
        await preferences_collection.update_one(
            {"user_id": preferences.user_id},
            {"$set": preferences.dict()},
            upsert=True
        )
        return {"message": "Preferences saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/preferences/{user_id}")
async def get_preferences(user_id: str):
    """Get user's complete preferences"""
    try:
        preferences = await preferences_collection.find_one({"user_id": user_id})
        
        if preferences:
            preferences["_id"] = str(preferences["_id"])
            return preferences
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Favorites
@app.post("/favorites")
async def add_to_favorites(user_id: str, item_id: str):
    """Add item to user's favorites"""
    try:
        await preferences_collection.update_one(
            {"user_id": user_id},
            {
                "$addToSet": {"favorites": item_id},
                "$set": {"updated_at": datetime.utcnow()}
            },
            upsert=True
        )
        return {"message": "Added to favorites"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/favorites/{user_id}/{item_id}")
async def remove_from_favorites(user_id: str, item_id: str):
    """Remove item from user's favorites"""
    try:
        await preferences_collection.update_one(
            {"user_id": user_id},
            {
                "$pull": {"favorites": item_id},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        return {"message": "Removed from favorites"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/favorites/{user_id}")
async def get_favorites(user_id: str):
    """Get user's favorites"""
    try:
        preferences = await preferences_collection.find_one({"user_id": user_id})
        
        if preferences and "favorites" in preferences:
            return preferences["favorites"]
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Analytics
@app.get("/analytics/{user_id}")
async def get_analytics(user_id: str):
    """Get user's analytics"""
    try:
        analytics = await analytics_collection.find_one({"user_id": user_id})
        
        if analytics:
            analytics["_id"] = str(analytics["_id"])
            return analytics
        
        # Return default analytics if none exist
        return {
            "user_id": user_id,
            "total_problems": 0,
            "solved_problems": 0,
            "difficulty": {},
            "category": {},
            "streak_days": 0,
            "last_activity": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Export/Import
@app.get("/export/{user_id}")
async def export_progress(user_id: str):
    """Export user's progress as CSV"""
    try:
        progress_items = await progress_collection.find({"user_id": user_id}).to_list(None)
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "topic_id", "problem_name", "completed", "completed_at", 
            "difficulty", "category"
        ])
        
        # Write data
        for item in progress_items:
            writer.writerow([
                item.get("topic_id", ""),
                item.get("problem_name", ""),
                item.get("completed", False),
                item.get("completed_at", ""),
                item.get("difficulty", ""),
                item.get("category", "")
            ])
        
        output.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=dsa_progress_{user_id}.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/import")
async def import_progress(user_id: str = Form(...), file: UploadFile = File(...)):
    """Import user's progress from CSV"""
    try:
        content = await file.read()
        csv_data = csv.DictReader(io.StringIO(content.decode()))
        
        imported = 0
        errors = []
        
        for row in csv_data:
            try:
                progress = DSAProgress(
                    user_id=user_id,
                    topic_id=row.get("topic_id", ""),
                    problem_name=row.get("problem_name", ""),
                    completed=row.get("completed", "").lower() == "true",
                    completed_at=datetime.fromisoformat(row.get("completed_at")) if row.get("completed_at") else None,
                    difficulty=row.get("difficulty", ""),
                    category=row.get("category", "")
                )
                
                await progress_collection.update_one(
                    {
                        "user_id": progress.user_id,
                        "topic_id": progress.topic_id,
                        "problem_name": progress.problem_name
                    },
                    {"$set": progress.dict()},
                    upsert=True
                )
                
                imported += 1
            except Exception as e:
                errors.append(f"Row {imported + 1}: {str(e)}")
        
        # Update analytics
        await update_analytics(user_id)
        
        return {
            "imported": imported,
            "errors": errors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# DSA FEEDBACK & AI CHATBOT ENDPOINTS
# ============================================

@app.post("/feedback/generate-suggestions")
async def generate_suggestions_endpoint(feedback: FeedbackRequest, user_id: str = Depends(verify_request_user_id)):
    """Generate enhanced AI suggestions for feedback"""
    try:
        if str(feedback.user_id) != str(user_id):
            raise HTTPException(status_code=403, detail="Forbidden")

        print(f"\n{'='*60}")
        print(f"🤖 AI SUGGESTIONS REQUEST")
        print(f"{'='*60}")
        print(f"📋 Feedback ID: {feedback.feedback_id}")
        print(f"👤 User ID: {feedback.user_id}")
        print(f"🎯 Problem: {feedback.problem_name}")
        print(f"⭐ Rating: {feedback.rating}/5")
        print(f"🔥 Difficulty: {feedback.difficulty}")
        print(f"📦 Category: {feedback.category}")
        print(f"⏱️  Time Spent: {feedback.time_spent} minutes")
        print(f"😓 Struggled Areas: {feedback.struggled_areas}")
        print(f"💭 Detailed Feedback: {feedback.detailed_feedback[:100]}...")
        print(f"{'='*60}\n")

        print("🔄 Generating AI suggestions using Groq...")
        suggestions = await generate_enhanced_ai_suggestions(feedback)
        print(f"✅ AI suggestions generated successfully!")
        print(f"   - Approach Suggestions: {len(suggestions.approach_suggestions)}")
        print(f"   - Key Concepts: {len(suggestions.key_concepts)}")
        print(f"   - Similar Problems: {len(suggestions.similar_problems)}")
        print(f"   - Learning Resources: {len(suggestions.learning_resources)}")

        print("💾 Updating feedback in Supabase...")
        await update_feedback_suggestions(feedback.feedback_id, suggestions)
        print("✅ Database updated successfully!")

        return {
            "success": True,
            "message": "AI suggestions generated successfully",
            "suggestions": suggestions.dict()
        }

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback/chatbot-response")
async def chatbot_response_endpoint(request: ChatbotRequest):
    """Generate contextual chatbot response with smart feedback handling"""
    try:
        print(f"\n{'='*60}")
        print(f"💬 CHATBOT REQUEST")
        print(f"{'='*60}")
        print(f"👤 User ID: {request.user_id}")
        print(f"❓ Query: {request.query}")
        print(f"🎯 Context: {request.context}")
        print(f"📊 User Level: {request.user_level}")
        print(f"{'='*60}\n")

        query_lower = request.query.lower()
        
        # Check if user is asking about feedbacks/progress
        feedback_keywords = ['feedback', 'progress', 'history', 'review', 'analyze', 'problems solved']
        is_feedback_query = any(keyword in query_lower for keyword in feedback_keywords)
        
        # Check if user is selecting a specific feedback by number
        feedback_selection = None
        number_match = re.search(r'\b(\d+)\b', request.query)
        if number_match:
            feedback_selection = int(number_match.group(1))
        
        print("📚 Fetching user's feedback history...")
        feedback_history = await get_user_feedback_history(request.user_id)
        feedback_count = len(feedback_history)
        print(f"📋 Found {feedback_count} previous feedbacks")

        # If user selected a specific feedback number
        if feedback_selection and feedback_selection <= feedback_count:
            print(f"🎯 User selected feedback #{feedback_selection}")
            selected_feedback = feedback_history[feedback_selection - 1]
            
            response_text = f"""📊 **Analyzing Feedback #{feedback_selection}**

**Problem:** {selected_feedback.get('problem_name', 'Unknown')}
**Difficulty:** {selected_feedback.get('difficulty', 'Unknown')}
**Rating:** {selected_feedback.get('rating', 0)}/5
**Time Spent:** {selected_feedback.get('time_spent', 'N/A')} minutes

**Your Experience:**
{selected_feedback.get('detailed_feedback', 'No feedback provided')}

**Struggled With:** {', '.join(selected_feedback.get('struggled_areas', []))}

---

**💡 Key Insights:**
"""
            
            # Add AI suggestions if available
            ai_suggestions = selected_feedback.get('ai_suggestions')
            if ai_suggestions:
                response_text += f"\n**Suggested Approaches:**\n"
                for suggestion in ai_suggestions.get('approach_suggestions', [])[:3]:
                    response_text += f"- {suggestion}\n"
                
                response_text += f"\n**Recommended Next Steps:**\n"
                for problem in ai_suggestions.get('similar_problems', [])[:3]:
                    response_text += f"- {problem}\n"
            
            response_text += "\n\n🎥 **Want video tutorials?** Let me know and I'll fetch relevant YouTube videos!"
            
            return {
                "response": response_text,
                "source": "feedback_analysis",
                "suggestions": [],
                "feedbackCount": feedback_count
            }

        # If user is asking about feedbacks in general
        if is_feedback_query:
            if feedback_count == 0:
                return {
                    "response": "📭 You haven't submitted any feedback yet! Start solving problems and share your experience to get personalized AI suggestions.",
                    "source": "feedback_info",
                    "suggestions": [],
                    "feedbackCount": 0
                }
            
            # Show numbered list of feedbacks
            if feedback_count <= 10:
                response_text = f"📊 **You have {feedback_count} feedback(s):**\n\n"
                for idx, fb in enumerate(feedback_history[:10], 1):
                    difficulty_emoji = "🟢" if fb.get('difficulty') == 'Easy' else "🟡" if fb.get('difficulty') == 'Medium' else "🔴"
                    response_text += f"{idx}. {difficulty_emoji} **{fb.get('problem_name')}** - {fb.get('category')} ({fb.get('rating')}/5)\n"
                
                response_text += "\n\n💬 **Reply with a number** (1-{}) to analyze that feedback in detail!".format(feedback_count)
            else:
                # Group by difficulty or category
                response_text = f"📊 **You have {feedback_count} feedbacks!**\n\n"
                response_text += "Here's a summary:\n\n"
                
                # Count by difficulty
                easy = sum(1 for fb in feedback_history if fb.get('difficulty') == 'Easy')
                medium = sum(1 for fb in feedback_history if fb.get('difficulty') == 'Medium')
                hard = sum(1 for fb in feedback_history if fb.get('difficulty') == 'Hard')
                
                response_text += f"🟢 Easy: {easy} problems\n"
                response_text += f"🟡 Medium: {medium} problems\n"
                response_text += f"🔴 Hard: {hard} problems\n\n"
                
                response_text += "**Recent problems (1-10):**\n"
                for idx, fb in enumerate(feedback_history[:10], 1):
                    difficulty_emoji = "🟢" if fb.get('difficulty') == 'Easy' else "🟡" if fb.get('difficulty') == 'Medium' else "🔴"
                    response_text += f"{idx}. {difficulty_emoji} {fb.get('problem_name')} ({fb.get('rating')}/5)\n"
                
                response_text += "\n💬 Reply with a number to analyze specific feedback!"
            
            return {
                "response": response_text,
                "source": "feedback_list",
                "suggestions": [f"Analyze feedback #{i+1}" for i in range(min(3, feedback_count))],
                "feedbackCount": feedback_count
            }

        # For other queries (not feedback-related), use normal AI response
        print("🤖 Generating general AI response...")
        response = await generate_contextual_chatbot_response(
            request.query, 
            request.user_id, 
            []  # Don't include feedback history for general queries
        )
        print(f"✅ Response generated: {len(response.response)} characters")
        
        # Add feedback count hint if user has feedbacks
        if feedback_count > 0:
            response.response += f"\n\n💡 *Tip: You have {feedback_count} feedback(s). Ask me about them to get personalized insights!*"
        
        return response

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/feedback/history/{user_id}")
async def get_feedback_history(user_id: str, limit: int = 10):
    """Get user's feedback history"""
    try:
        feedback_history = await get_user_feedback_history(user_id, limit)
        return {"success": True, "feedbacks": feedback_history}
    except Exception as e:
        print(f"❌ Error fetching feedback history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback/youtube-recommendations")
async def get_youtube_recommendations(request: dict):
    """Fetch real YouTube recommendations for a problem"""
    try:
        print(f"\n{'='*60}")
        print(f"📺 YOUTUBE RECOMMENDATIONS REQUEST")
        print(f"{'='*60}")
        problem_name = request.get('problemName', 'Unknown')
        difficulty = request.get('difficulty', 'Unknown')
        category = request.get('category', 'Unknown')
        print(f"🎯 Problem: {problem_name}")
        print(f"🔥 Difficulty: {difficulty}")
        print(f"📦 Category: {category}")
        print(f"{'='*60}\n")

        youtube_api_key = os.getenv("YOUTUBE_API_KEY")
        if not youtube_api_key:
            print("⚠️  YouTube API key not configured, returning mock data")
            return {
                "success": True,
                "videos": [],
                "message": "YouTube API key not configured"
            }

        # Build search query
        search_query = f"{category} {problem_name} {difficulty} tutorial solution"
        print(f"🔍 Searching YouTube for: {search_query}")

        # Initialize YouTube API
        from googleapiclient.discovery import build
        youtube = build('youtube', 'v3', developerKey=youtube_api_key)

        # Search for videos
        search_response = youtube.search().list(
            q=search_query,
            part='id,snippet',
            maxResults=5,
            type='video',
            order='relevance',
            videoDuration='medium'  # 4-20 minutes
        ).execute()

        recommendations = []
        for item in search_response.get('items', []):
            video_id = item['id']['videoId']
            snippet = item['snippet']
            
            # Get video details for duration
            video_response = youtube.videos().list(
                part='contentDetails,statistics',
                id=video_id
            ).execute()
            
            duration = 'N/A'
            views = 0
            if video_response['items']:
                duration = video_response['items'][0]['contentDetails']['duration']
                views = int(video_response['items'][0]['statistics'].get('viewCount', 0))
            
            recommendations.append({
                "title": snippet['title'],
                "description": snippet['description'][:150] + "...",
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "thumbnail": snippet['thumbnails']['high']['url'],
                "duration": duration,
                "views": views,
                "channelTitle": snippet['channelTitle'],
                "relevanceScore": 0.9  # Based on search ranking
            })

        print(f"✅ Found {len(recommendations)} YouTube videos")
        
        # Save to database (ai_resources field)
        feedback_id = request.get('feedbackId')
        if feedback_id:
            print(f"💾 Saving videos to feedback {feedback_id}...")
            from shared.database.supabase_connection import supabase_manager
            
            supabase_manager.supabase.table('dsa_feedbacks').update({
                'ai_resources': recommendations
            }).eq('id', feedback_id).execute()
            print("✅ Videos saved to database!")

        return {
            "success": True,
            "videos": recommendations,
            "count": len(recommendations)
        }

    except Exception as e:
        print(f"❌ ERROR fetching YouTube videos: {e}")
        # Return empty array on error instead of failing
        return {
            "success": False,
            "videos": [],
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)