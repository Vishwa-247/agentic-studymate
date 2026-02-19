from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Enums
class CoursePurpose(str, Enum):
    exam = "exam"
    job_interview = "job_interview"
    practice = "practice"
    coding_preparation = "coding_preparation"
    other = "other"

class CourseDifficulty(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"
    expert = "expert"

class InterviewType(str, Enum):
    technical = "technical"
    behavioral = "behavioral"
    mixed = "mixed"

# User Models
class UserProfile(BaseModel):
    name: str
    skills: List[str] = []
    experience: int = 0
    resume_url: Optional[str] = None
    resume_parsed_data: Optional[Dict[str, Any]] = None
    target_role: Optional[str] = None
    current_level: Optional[str] = None

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: str
    password_hash: Optional[str] = None
    profile: UserProfile
    preferences: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Course Models
class CourseProgress(BaseModel):
    current_chapter: int = 0
    completion_percentage: float = 0.0
    last_accessed: datetime = Field(default_factory=datetime.utcnow)

class CourseContent(BaseModel):
    status: Optional[str] = None
    message: Optional[str] = None
    last_updated: Optional[datetime] = None
    parsed_content: Optional[Dict[str, Any]] = None

class Course(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    title: str
    purpose: CoursePurpose
    difficulty: CourseDifficulty
    summary: Optional[str] = None
    content: Optional[CourseContent] = None
    progress: CourseProgress = Field(default_factory=CourseProgress)
    adaptations: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Chapter(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    course_id: str
    title: str
    content: str
    order_number: int
    json_content: Optional[Dict[str, Any]] = None  # For structured content like mind maps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Flashcard(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    course_id: str
    question: str
    answer: str
    difficulty: Optional[str] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MCQ(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    course_id: str
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: Optional[str] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class QnA(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    course_id: str
    question: str
    answer: str
    difficulty: Optional[str] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Interview Models
class FacialData(BaseModel):
    confident: float
    stressed: float
    hesitant: float
    nervous: float
    excited: float

class Recommendation(BaseModel):
    title: str
    description: str
    link: Optional[str] = None

class InterviewAnalysis(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    interview_id: str
    facial_data: FacialData
    pronunciation_feedback: str
    technical_feedback: str
    language_feedback: str
    recommendations: List[Recommendation] = []
    overall_score: float = 0.0
    technical_score: float = 0.0
    communication_score: float = 0.0
    confidence_score: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InterviewQuestion(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    interview_id: str
    question: str
    user_answer: Optional[str] = None
    expected_answer: Optional[str] = None
    order_number: int
    question_type: str = "technical"  # technical, behavioral, coding
    difficulty: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MockInterview(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    job_role: str
    tech_stack: str
    experience: str
    interview_type: InterviewType = InterviewType.mixed
    questions: List[str] = []  # Question IDs
    completed: bool = False
    analysis_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Progress Models
class ProgressMetrics(BaseModel):
    score: Optional[float] = None
    time_spent: Optional[int] = None  # in seconds
    completion_rate: Optional[float] = None
    accuracy: Optional[float] = None
    attempts: Optional[int] = None

class ProgressTracking(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    activity_type: str  # course, interview, coding, quiz
    activity_id: str
    metrics: ProgressMetrics
    weaknesses_identified: List[str] = []
    strengths_identified: List[str] = []
    agent_recommendations: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

# DSA Problems Model
class DSAProblem(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    leetcode_id: Optional[str] = None
    title: str
    difficulty: str  # easy, medium, hard
    category: str  # arrays, strings, graphs, etc.
    completed: bool = False
    attempts: int = 0
    notes: Optional[str] = None
    feedback_rating: Optional[int] = None  # 1-5 rating
    feedback_comment: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Request/Response Models
class CourseGenerationRequest(BaseModel):
    course_name: str
    purpose: CoursePurpose
    difficulty: CourseDifficulty
    additional_requirements: Optional[str] = None

class CourseGenerationResponse(BaseModel):
    course_id: str
    status: str
    message: str
    estimated_completion_time: Optional[int] = None  # in minutes

class InterviewStartRequest(BaseModel):
    job_role: str
    tech_stack: str
    experience: str
    interview_type: InterviewType = InterviewType.mixed
    question_count: int = 5

class InterviewStartResponse(BaseModel):
    interview_id: str
    questions: List[InterviewQuestion]
    estimated_duration: int  # in minutes

class ChatMessageRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    conversation_id: Optional[str] = None

class ChatMessageResponse(BaseModel):
    response: str
    conversation_id: str
    suggestions: List[str] = []
    resources: List[Dict[str, str]] = []

# API Response Models
class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[str] = None

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool