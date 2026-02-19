#!/usr/bin/env python3
"""
Enhanced StudyMate Resume Analyzer Service
Comprehensive AI-powered resume analysis with action words and STAR methodology scoring
"""

import asyncio
import io
import json
import os
import re
import tempfile
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import asyncpg
try:
    from google import genai as genai_new
except ImportError:
    genai_new = None
import PyPDF2
from docx import Document
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from groq import Groq
from pydantic import BaseModel

from supabase import Client, create_client

# Load environment variables from backend root
backend_root = Path(__file__).parent.parent.parent
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

# Initialize clients
supabase_url = os.getenv("SUPABASE_URL")
# Try both possible env var names for backward compatibility
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

groq_client = None
gemini_client = None
db_pool = None

# Initialize AI clients
try:
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        groq_client = Groq(api_key=groq_api_key)
        print("✅ Groq client initialized")
    else:
        print("⚠️ GROQ_API_KEY not found")
except Exception as e:
    print(f"❌ Failed to initialize Groq client: {e}")

try:
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if gemini_api_key and genai_new:
        gemini_client = genai_new.Client(api_key=gemini_api_key)
        print("✅ Gemini client initialized (google.genai)")
    elif gemini_api_key:
        print("⚠️ google-genai package not installed, Gemini disabled")
    else:
        print("⚠️ GEMINI_API_KEY not found")
except Exception as e:
    print(f"❌ Failed to initialize Gemini client: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    try:
        # Initialize database connection
        database_url = os.getenv("SUPABASE_DB_URL")
        if database_url:
            db_pool = await asyncpg.create_pool(
                database_url,
                statement_cache_size=0,  # Required for Supabase/pgbouncer
                command_timeout=30
            )
            print("✅ Database connection pool created")
        else:
            print("⚠️ SUPABASE_DB_URL not found")
    except Exception as e:
        print(f"❌ Failed to create database pool: {e}")
    
    yield
    
    # Cleanup
    if db_pool:
        await db_pool.close()

app = FastAPI(
    title="StudyMate Resume Analyzer Service",
    description="Enhanced AI-powered resume analysis with action words and STAR methodology scoring",
    version="2.0.0",
    lifespan=lifespan
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
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "resume-analyzer",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "groq": groq_client is not None,
            "gemini": gemini_client is not None,
            "database": db_pool is not None,
            "supabase": supabase is not None
        },
        "features": {
            "enhanced_analysis": True,
            "action_verb_scoring": True,
            "star_methodology": True,
            "history_tracking": True,
            "role_suggestions": True
        }
    }

# Optional Docling import — can be disabled via USE_DOCLING=false env var
USE_DOCLING = os.getenv("USE_DOCLING", "true").lower() != "false"
try:
    if not USE_DOCLING:
        raise ImportError("Docling disabled via USE_DOCLING=false")
    from llama_index.readers.docling import DoclingReader
    from llama_index.core import SimpleDirectoryReader
    DOCLING_AVAILABLE = True
    print("✅ Docling is available for advanced PDF parsing")
except ImportError:
    DOCLING_AVAILABLE = False
    if not USE_DOCLING:
        print("⚠️  Docling disabled via USE_DOCLING env var, using PyPDF2 fallback")
    else:
        print("⚠️  Docling not found, using PyPDF2 fallback")

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file using Docling (preferred) or PyPDF2"""
    # Try Docling First (Advanced Parsing)
    if DOCLING_AVAILABLE:
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                pdf_path = os.path.join(temp_dir, "resume.pdf")
                with open(pdf_path, "wb") as f:
                    f.write(file_content)
                
                print("Using Docling for PDF extraction...")
                reader = DoclingReader()
                # SimpleDirectoryReader with Docling
                loader = SimpleDirectoryReader(
                    input_dir=temp_dir,
                    file_extractor={".pdf": reader},
                )
                docs = loader.load_data()
                text = "\n\n".join([doc.text for doc in docs])
                print(f"✅ Docling extraction successful ({len(text)} chars)")
                return text
        except Exception as e:
            print(f"❌ Docling extraction failed: {e}")
            print("Falling back to PyPDF2...")

    # Fallback to PyPDF2
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        doc = Document(io.BytesIO(file_content))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        print(f"DOCX extraction error: {e}")
        return ""

async def get_action_verbs_reference() -> Dict[str, Any]:
    """Get action verbs reference data from database"""
    try:
        if not db_pool:
            return {}
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM action_verbs_reference")
            return {row['verb'].lower(): {
                'category': row['category'],
                'strength_score': row['strength_score'],
                'alternatives': row['alternatives']
            } for row in rows}
    except Exception as e:
        print(f"Error getting action verbs reference: {e}")
        return {}

async def get_star_examples_reference() -> List[Dict[str, Any]]:
    """Get STAR examples reference data from database"""
    try:
        if not db_pool:
            return []
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM star_examples_reference")
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting STAR examples reference: {e}")
        return []

def analyze_action_verbs(text: str, action_verbs_ref: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze action verbs in resume text"""
    words = re.findall(r'\b\w+\b', text.lower())
    found_verbs = []
    total_score = 0
    verb_categories = {}
    
    for word in words:
        if word in action_verbs_ref:
            verb_data = action_verbs_ref[word]
            found_verbs.append({
                'verb': word,
                'category': verb_data['category'],
                'strength_score': verb_data['strength_score'],
                'alternatives': verb_data['alternatives']
            })
            total_score += verb_data['strength_score']
            
            category = verb_data['category']
            if category not in verb_categories:
                verb_categories[category] = 0
            verb_categories[category] += 1
    
    # Calculate diversity score
    diversity_score = len(verb_categories) * 10 if verb_categories else 0
    
    # Calculate final score (0-100)
    final_score = min(100, (total_score * 2) + diversity_score)
    
    return {
        'score': final_score,
        'found_verbs': found_verbs,
        'categories': verb_categories,
        'total_verbs_found': len(found_verbs),
        'recommendations': generate_action_verb_recommendations(found_verbs, action_verbs_ref)
    }

def analyze_star_methodology(text: str, star_examples: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze STAR methodology compliance in resume text"""
    lines = [line.strip() for line in text.split('\n') if line.strip() and len(line.strip()) > 20]
    bullet_points = [line for line in lines if line.startswith('•') or line.startswith('-') or line.startswith('*')]
    
    if not bullet_points:
        bullet_points = lines[:10]  # Take first 10 substantial lines
    
    star_scores = []
    total_score = 0
    
    for bullet in bullet_points:
        score = calculate_star_score(bullet)
        star_scores.append({
            'bullet': bullet,
            'star_score': score,
            'improvements': generate_star_improvements(bullet, star_examples)
        })
        total_score += score
    
    final_score = (total_score / len(bullet_points)) * 100 if bullet_points else 0
    
    return {
        'score': final_score,
        'bullet_analysis': star_scores,
        'recommendations': generate_star_recommendations(star_scores, star_examples)
    }

def calculate_star_score(bullet_text: str) -> float:
    """Calculate STAR methodology score for a single bullet point"""
    bullet_lower = bullet_text.lower()
    
    # Check for STAR components
    situation_indicators = ['when', 'during', 'while', 'in', 'for', 'at']
    task_indicators = ['responsible for', 'tasked with', 'needed to', 'required to']
    action_indicators = ['implemented', 'developed', 'created', 'led', 'managed', 'designed']
    result_indicators = ['resulting in', 'achieved', 'improved', 'increased', 'decreased', 'reduced']
    
    score = 0
    
    # Situation (25%)
    if any(indicator in bullet_lower for indicator in situation_indicators):
        score += 0.25
    
    # Task (25%)
    if any(indicator in bullet_lower for indicator in task_indicators):
        score += 0.25
    
    # Action (25%)
    if any(indicator in bullet_lower for indicator in action_indicators):
        score += 0.25
    
    # Result (25%)
    if any(indicator in bullet_lower for indicator in result_indicators) or any(char.isdigit() for char in bullet_text):
        score += 0.25
    
    return score

def generate_action_verb_recommendations(found_verbs: List[Dict], action_verbs_ref: Dict) -> List[str]:
    """Generate recommendations for improving action verbs"""
    recommendations = []
    
    if len(found_verbs) < 5:
        recommendations.append("Add more strong action verbs to your resume bullet points")
    
    weak_verbs = [v for v in found_verbs if v['strength_score'] < 4]
    if weak_verbs:
        recommendations.append(f"Consider replacing weak action verbs like '{', '.join([v['verb'] for v in weak_verbs[:3]])}' with stronger alternatives")
    
    categories = set([v['category'] for v in found_verbs])
    if len(categories) < 3:
        recommendations.append("Diversify your action verbs across different categories (Leadership, Technical, Creative, Analytical, Communication)")
    
    return recommendations

def generate_star_improvements(bullet: str, star_examples: List[Dict]) -> List[str]:
    """Generate context-specific STAR methodology improvements"""
    improvements = []
    bullet_lower = bullet.lower()
    has_numbers = any(char.isdigit() for char in bullet)
    word_count = len(bullet.split())
    
    # Check for Situation/Context
    situation_words = ['when', 'during', 'while', 'in', 'at', 'for', 'faced with']
    has_situation = any(word in bullet_lower for word in situation_words)
    
    if not has_situation:
        improvements.append("Add context: Describe WHEN this happened (e.g., 'During Q3 2023' or 'When system performance degraded')")
    
    # Check for Task/Challenge
    task_words = ['responsible', 'tasked', 'needed', 'required', 'challenge', 'problem']
    has_task = any(word in bullet_lower for word in task_words)
    
    if not has_task:
        improvements.append("Clarify your role: Explain WHAT you were responsible for (e.g., 'Tasked with improving team efficiency')")
    
    # Check for Action verbs
    action_words = ['implemented', 'developed', 'created', 'led', 'managed', 'designed', 
                    'built', 'optimized', 'increased', 'reduced', 'achieved']
    has_action = any(word in bullet_lower for word in action_words)
    
    if not has_action:
        improvements.append("Strengthen action: Use stronger verbs like 'Implemented', 'Developed', 'Led' instead of weak verbs")
    
    # Check for Results with numbers
    result_words = ['achieved', 'resulted', 'increased', 'reduced', 'improved', 'saved', 'generated']
    has_result = any(word in bullet_lower for word in result_words)
    
    if not has_numbers and has_result:
        improvements.append(f"Quantify the result: Add specific metrics to '{next((w for w in result_words if w in bullet_lower), 'result')}' (e.g., 'by 40%' or 'saving $50K')")
    elif not has_numbers and not has_result:
        improvements.append("Add measurable outcome: Include the RESULT with numbers (e.g., 'resulting in 30% faster load times' or 'saving 15 hours/week')")
    
    # Check for impact/outcome
    if has_numbers and not has_result:
        improvements.append(f"Connect numbers to outcome: Explain how the metrics impacted the business/team")
    
    # Length check - too short means missing details
    if word_count < 12:
        improvements.append(f"Expand with specifics: This bullet is brief ({word_count} words). Add details about your specific contribution and its impact")
    
    # If bullet is good but can be better
    if len(improvements) == 0:
        improvements.append("Consider adding: More specific metrics or the broader impact of this achievement on the team/company")
    
    return improvements[:3]  # Limit to top 3 most relevant suggestions

async def enrich_star_with_llm(bullet_analysis: List[Dict], job_role: str, resume_text: str) -> List[Dict]:
    """Use LLM to generate context-specific STAR improvements for each bullet point"""
    if not groq_client or not bullet_analysis:
        return bullet_analysis
    
    # Take top 10 bullets to keep prompt manageable
    bullets_for_llm = bullet_analysis[:10]
    bullets_text = "\n".join([f"{i+1}. \"{b['bullet']}\" (STAR score: {b['star_score']:.0%})" 
                              for i, b in enumerate(bullets_for_llm)])
    
    prompt = f"""You are an expert resume coach specializing in the STAR method (Situation, Task, Action, Result).
    
Target Role: {job_role}

Here are resume bullet points with their STAR scores:
{bullets_text}

For EACH bullet, provide 2-3 specific, actionable improvement suggestions that are DIRECTLY relevant to the bullet's content and the target role of {job_role}.

Rules:
- Reference the ACTUAL content of each bullet (don't give generic advice)
- Show a REWRITTEN example for bullets scoring below 75%
- Explain which STAR component is missing/weak
- Tie improvements to what {job_role} recruiters look for

Respond in JSON format:
{{
  "improvements": [
    {{
      "index": 1,
      "suggestions": [
        "Specific suggestion referencing the bullet content...",
        "Rewrite example: 'Led migration of 3 microservices to Kubernetes, reducing deployment time by 60% and saving $12K/month in infrastructure costs'"
      ]
    }}
  ]
}}
"""
    
    try:
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert resume coach. Provide specific, actionable STAR method improvements in valid JSON format. Reference actual bullet content."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=1500
        )
        
        response_text = response.choices[0].message.content
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        llm_data = json.loads(response_text)
        llm_improvements = llm_data.get("improvements", [])
        
        # Merge LLM improvements into bullet_analysis
        for item in llm_improvements:
            idx = item.get("index", 0) - 1  # Convert to 0-based
            if 0 <= idx < len(bullet_analysis):
                bullet_analysis[idx]["improvements"] = item.get("suggestions", bullet_analysis[idx]["improvements"])
        
        print("✅ LLM-enriched STAR improvements generated")
    except Exception as e:
        print(f"⚠️ LLM STAR enrichment failed, using heuristic fallback: {e}")
    
    return bullet_analysis

def generate_star_recommendations(star_scores: List[Dict], star_examples: List[Dict]) -> List[str]:
    """Generate overall STAR methodology recommendations"""
    recommendations = []
    
    avg_score = sum([s['star_score'] for s in star_scores]) / len(star_scores) if star_scores else 0
    
    if avg_score < 0.5:
        recommendations.append("Most bullet points lack STAR methodology structure. Focus on Situation, Task, Action, and Result")
    
    if avg_score < 0.7:
        recommendations.append("Add more quantifiable results and specific outcomes to your achievements")
    
    recommendations.append("Use the CAR (Challenge, Action, Result) or STAR method for stronger impact statements")
    
    return recommendations

def validate_skills_for_role(skills: List[str], job_role: str) -> Dict[str, Any]:
    """
    Validate if extracted skills are relevant for the job role
    Returns: relevance_score (0-100), matched_skills, irrelevant_skills
    """
    role_skill_categories = {
        'frontend developer': {
            'required': ['react', 'javascript', 'html', 'css', 'typescript', 'vue', 'angular'],
            'preferred': ['redux', 'webpack', 'sass', 'tailwind', 'next.js', 'responsive'],
            'irrelevant': ['python', 'django', 'flask', 'tensorflow', 'machine learning', 'data science', 'pandas', 'numpy', 'deep learning']
        },
        'backend developer': {
            'required': ['python', 'java', 'node.js', 'api', 'database', 'sql', 'rest'],
            'preferred': ['microservices', 'docker', 'aws', 'redis', 'postgresql', 'mongodb'],
            'irrelevant': ['react', 'vue', 'angular', 'html', 'css', 'responsive design', 'ui/ux']
        },
        'full stack developer': {
            'required': ['javascript', 'python', 'node.js', 'react', 'api', 'database', 'sql'],
            'preferred': ['typescript', 'mongodb', 'docker', 'aws', 'git', 'ci/cd'],
            'irrelevant': ['machine learning', 'data science', 'tensorflow', 'deep learning']
        },
        'data scientist': {
            'required': ['python', 'machine learning', 'statistics', 'sql', 'pandas', 'numpy'],
            'preferred': ['tensorflow', 'pytorch', 'deep learning', 'nlp', 'tableau', 'scikit-learn'],
            'irrelevant': ['react', 'html', 'css', 'javascript', 'vue', 'angular', 'responsive design', 'ui/ux']
        },
        'devops engineer': {
            'required': ['docker', 'kubernetes', 'jenkins', 'ci/cd', 'aws', 'linux', 'scripting'],
            'preferred': ['terraform', 'ansible', 'monitoring', 'prometheus', 'grafana'],
            'irrelevant': ['react', 'vue', 'angular', 'ui/ux', 'responsive design']
        },
    }
    
    role_data = role_skill_categories.get(job_role.lower(), {
        'required': [],
        'preferred': [],
        'irrelevant': []
    })
    
    skills_lower = [s.lower() for s in skills]
    
    matched_required = [s for s in role_data['required'] if s in ' '.join(skills_lower)]
    matched_preferred = [s for s in role_data['preferred'] if s in ' '.join(skills_lower)]
    found_irrelevant = [s for s in role_data['irrelevant'] if s in ' '.join(skills_lower)]
    
    # Calculate relevance score
    total_required = len(role_data['required'])
    total_preferred = len(role_data['preferred'])
    
    if total_required > 0:
        required_match_percent = (len(matched_required) / total_required) * 100
    else:
        required_match_percent = 50  # Neutral if no required skills defined
    
    if total_preferred > 0:
        preferred_match_percent = (len(matched_preferred) / total_preferred) * 100
    else:
        preferred_match_percent = 0
    
    # Penalty for irrelevant skills
    irrelevant_penalty = min(len(found_irrelevant) * 5, 30)  # Max 30% penalty
    
    relevance_score = (required_match_percent * 0.7 + preferred_match_percent * 0.3) - irrelevant_penalty
    relevance_score = max(0, min(100, relevance_score))  # Clamp between 0-100
    
    return {
        'relevance_score': round(relevance_score, 1),
        'matched_required': matched_required,
        'matched_preferred': matched_preferred,
        'irrelevant_skills': found_irrelevant,
        'has_mismatch': len(found_irrelevant) > 2
    }

def extract_keywords_from_job_description(job_description: str, job_role: str) -> List[str]:
    """Extract relevant keywords from job description"""
    if not job_description or len(job_description.strip()) < 20:
        # Fallback to role-based keywords if no description provided
        role_keywords = {
            'frontend developer': ['react', 'javascript', 'typescript', 'html', 'css', 'vue', 'angular', 'redux', 'webpack', 'responsive design'],
            'backend developer': ['python', 'java', 'node.js', 'api', 'database', 'sql', 'rest', 'microservices', 'docker', 'aws'],
            'full stack developer': ['react', 'node.js', 'javascript', 'python', 'database', 'api', 'git', 'aws', 'docker', 'mongodb'],
            'data scientist': ['python', 'machine learning', 'tensorflow', 'pandas', 'sql', 'statistics', 'deep learning', 'nlp', 'tableau'],
            'devops engineer': ['docker', 'kubernetes', 'jenkins', 'ci/cd', 'aws', 'terraform', 'monitoring', 'linux', 'scripting'],
        }
        return role_keywords.get(job_role.lower(), ['javascript', 'python', 'git', 'api', 'database'])
    
    # Extract technical terms and skills from job description
    keywords = []
    text = job_description.lower()
    
    # Common technical keywords
    tech_keywords = [
        'react', 'angular', 'vue', 'javascript', 'typescript', 'python', 'java', 'c++', 'c#',
        'node.js', 'express', 'django', 'flask', 'spring', 'api', 'rest', 'graphql',
        'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd',
        'git', 'github', 'agile', 'scrum', 'jira',
        'machine learning', 'ai', 'deep learning', 'tensorflow', 'pytorch',
        'html', 'css', 'sass', 'tailwind', 'bootstrap',
        'testing', 'jest', 'cypress', 'junit', 'selenium'
    ]
    
    for keyword in tech_keywords:
        if keyword in text:
            keywords.append(keyword)
    
    # Extract multi-word skills using regex
    skill_patterns = [
        r'experience (?:with|in) ([a-z\s]+?)(?:\.|,|and|or|\n)',
        r'knowledge of ([a-z\s]+?)(?:\.|,|and|or|\n)',
        r'proficient in ([a-z\s]+?)(?:\.|,|and|or|\n)',
    ]
    
    for pattern in skill_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            skills = [s.strip() for s in match.split() if len(s.strip()) > 2]
            keywords.extend(skills[:2])  # Take first 2 words
    
    return list(set(keywords))[:15]  # Return unique keywords, max 15

def analyze_keyword_matching(resume_text: str, job_description: str, job_role: str) -> dict:
    """Analyze keyword matching between resume and job description"""
    # Extract keywords from job description
    required_keywords = extract_keywords_from_job_description(job_description, job_role)
    
    if not required_keywords:
        return {
            "matching_keywords": [],
            "missing_keywords": [],
            "keyword_density": 0
        }
    
    resume_lower = resume_text.lower()
    
    matching = [kw for kw in required_keywords if kw.lower() in resume_lower]
    missing = [kw for kw in required_keywords if kw.lower() not in resume_lower]
    
    # Calculate density (percentage of required keywords found)
    density = (len(matching) / len(required_keywords) * 100) if required_keywords else 0
    
    return {
        "matching_keywords": matching,
        "missing_keywords": missing,
        "keyword_density": round(density, 1)
    }

async def analyze_with_groq(resume_text: str, job_role: str, job_description: str = "") -> dict:
    """Enhanced analysis with Groq including action verbs and STAR methodology"""
    if not groq_client:
        print("❌ Groq client not available")
        raise HTTPException(status_code=500, detail="Groq client not initialized. Please check GROQ_API_KEY in .env file")
    
    # Get reference data
    print("📚 Fetching reference data...")
    action_verbs_ref = await get_action_verbs_reference()
    star_examples = await get_star_examples_reference()
    print(f"✅ Got {len(action_verbs_ref)} action verbs and {len(star_examples)} STAR examples")
    
    # Perform specialized analysis
    print("🔍 Analyzing action verbs...")
    action_verb_analysis = analyze_action_verbs(resume_text, action_verbs_ref)
    print(f"✅ Action verb analysis complete. Score: {action_verb_analysis['score']}")
    
    print("⭐ Analyzing STAR methodology...")
    star_analysis = analyze_star_methodology(resume_text, star_examples)
    print(f"✅ STAR analysis complete. Score: {star_analysis['score']}")
    
    prompt = f"""
    You are a STRICT and CRITICAL resume analyzer AND experienced {job_role} hiring manager. Analyze this resume for the position of {job_role}.
    Job Description: {job_description if job_description else "No job description provided - evaluate based on role requirements"}

    Resume Text:
    {resume_text}

    IMPORTANT INSTRUCTIONS FOR SCORING:
    - BE STRICT: Only give high scores (70-100) if there is CLEAR, RELEVANT experience for {job_role}
    - If the resume shows NO experience in {job_role}, the overall score should be 30-50, NOT 70+
    - If skills don't match the role requirements, the score should be LOW
    - Check for ACTUAL relevant experience, not just keywords
    - ATS score should be based on formatting, keywords, and structure - be realistic
    - Don't be generous - most resumes should score 40-70, not 70-90
    
    CRITICAL SCORING EXAMPLES:
    ❌ WRONG: Frontend Developer resume for Data Scientist role = 75% (TOO HIGH)
    ✅ CORRECT: Frontend Developer resume for Data Scientist role = 30-40% (LOW - no relevant experience)
    
    ❌ WRONG: Student with projects but no work experience = 80% (TOO HIGH)  
    ✅ CORRECT: Student with projects but no work experience = 50-60% (MEDIUM - potential but unproven)
    
    RELEVANCE CHECK:
    - Does the candidate have experience in {job_role}? If NO, score should be below 50
    - Do the skills match what a {job_role} needs? If NO, score should be below 60
    - Is there relevant education or projects? If NO, reduce score by 10-20 points
    - Are there irrelevant skills (e.g., React skills for Data Scientist)? Penalize heavily
    
    Provide analysis in JSON format:
    {{
        "overall_score": <0-100, BE STRICT - average should be 40-60 for most resumes>,
        "ats_score": <0-100, check formatting, keywords, structure>,
        "sections_analysis": {{
            "contact_info": {{"score": <0-100>, "feedback": "Detailed feedback: check if name, email, phone, LinkedIn, GitHub, and location are present. Note any missing items specifically."}},
            "summary": {{"score": <0-100>, "feedback": "Detailed feedback: Is there a professional summary? Is it tailored for {job_role}? What specific improvements would make it stronger? Mention exact phrases to add/remove."}},
            "experience": {{"score": <0-100>, "feedback": "Detailed feedback: Analyze EACH role listed. Is the experience relevant to {job_role}? Are achievements quantified? What's missing that a {job_role} recruiter would look for? Be specific about which experiences are strong and which are weak."}},
            "education": {{"score": <0-100>, "feedback": "Detailed feedback: Is the degree relevant? Are there relevant coursework, certifications, or academic projects for {job_role}? What certifications would strengthen this section?"}},
            "skills": {{"score": <0-100>, "feedback": "Detailed feedback: Which listed skills are relevant for {job_role}? Which critical skills are missing? Categorize into must-have vs nice-to-have. Suggest specific skills to add."}}
        }},
        "recommendations": [
            "List 5-7 SPECIFIC improvements needed for {job_role}",
            "Focus on what's MISSING for this role",
            "Be specific about gaps",
            "Include specific action items"
        ],
        "keyword_analysis": {{
            "matching_keywords": ["list keywords found that match {job_role}"],
            "missing_keywords": ["list critical keywords missing for {job_role}"],
            "keyword_density": <percentage of relevant keywords present>
        }},
        "formatting_feedback": "Provide 3-5 SPECIFIC formatting improvements: check section headings, bullet point consistency, font/margin assumptions, date formatting, use of bold/italics, page length, and ATS compatibility issues. Be detailed about each issue found.",
        "recruiter_tips": [
            {{"label": "Experience Level Match", "status": "success|warning|error", "description": "Detailed analysis of whether experience level matches {job_role} requirements. Mention specific years, roles, and progression."}},
            {{"label": "Achievement Impact", "status": "success|warning|error", "description": "Analysis of quantifiable achievements. Which bullets have strong metrics? Which need numbers? Give examples of how to quantify."}},
            {{"label": "Technical Depth for {job_role}", "status": "success|warning|error", "description": "How well does the resume demonstrate depth in core {job_role} technologies? What's impressive and what's surface-level?"}},
            {{"label": "Resume Storytelling", "status": "success|warning|error", "description": "Does the resume tell a coherent career story toward {job_role}? Are transitions explained? Is there a clear growth trajectory?"}},
            {{"label": "Industry Keywords", "status": "success|warning|error", "description": "Analysis of industry-specific terminology, buzzwords, and jargon that {job_role} recruiters search for."}},
            {{"label": "Competitive Edge", "status": "success|warning|error", "description": "What makes this candidate stand out (or not) compared to typical {job_role} applicants? Unique strengths and differentiators."}}
        ],
        "suggested_roles": [
            {{"title": "Role Title", "match_score": 0-100, "reasoning": "why this role fits", "key_skills": ["skill1", "skill2"]}}
        ]
    }}
    
    Remember: BE STRICT. If this resume isn't a good fit for {job_role}, the score should reflect that (30-50 range).
    Recruiter tips MUST be detailed (2-3 sentences each) and specific to the actual resume content — never generic.
    """
    
    try:
        print(f"🤖 Calling Groq API for analysis (Model: llama-3.3-70b-versatile)...")
        try:
            response = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a STRICT, CRITICAL resume analyzer and hiring manager. Be honest and tough in your evaluations. Only give high scores to truly qualified candidates. Most resumes should score 40-60, not 70-90. Provide detailed, actionable feedback in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.1,
                max_tokens=3000
            )
            print("✅ Groq API response received successfully")
        except Exception as groq_error:
            print(f"❌ Groq API call failed: {groq_error}")
            # Try fallback model if first one fails
            print("🔄 Trying fallback model (llama3-70b-8192)...")
            response = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a STRICT, CRITICAL resume analyzer. Provide detailed feedback in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                model="llama3-70b-8192",
                temperature=0.1,
                max_tokens=2000
            )
            print("✅ Fallback Groq API response received")
        analysis_text = response.choices[0].message.content
        
        # Try to parse JSON, with better error handling
        try:
            # Remove markdown code blocks if present
            if "```json" in analysis_text:
                analysis_text = analysis_text.split("```json")[1].split("```")[0].strip()
            elif "```" in analysis_text:
                analysis_text = analysis_text.split("```")[1].split("```")[0].strip()
            
            groq_analysis = json.loads(analysis_text)
            print("✅ Successfully parsed Groq analysis JSON")
        except json.JSONDecodeError as e:
            print(f"⚠️ JSON parsing failed: {e}")
            print(f"Raw AI response (first 500 chars): {analysis_text[:500]}")
            # Fallback with minimal data - let component scores drive the overall score
            groq_analysis = {
                "ats_score": 50,  # Default ATS score
                "sections_analysis": {},
                "recommendations": ["AI response parsing failed - using component-based scoring"],
                "formatting_feedback": "Resume formatting needs review for ATS compatibility"
            }
        
        # Add keyword analysis
        print("🔑 Analyzing keyword matching...")
        keyword_analysis = analyze_keyword_matching(resume_text, job_description, job_role)
        print(f"✅ Keyword analysis complete. Matching: {len(keyword_analysis['matching_keywords'])}, Missing: {len(keyword_analysis['missing_keywords'])}")
        
        # NEW: Validate skills for role relevance
        print("🎯 Validating skills for role...")
        all_text = resume_text.lower()
        skill_validation = validate_skills_for_role([resume_text], job_role)
        print(f"✅ Skill validation complete. Relevance: {skill_validation['relevance_score']}%")
        if skill_validation['irrelevant_skills']:
            print(f"⚠️  Found irrelevant skills: {', '.join(skill_validation['irrelevant_skills'][:3])}")
        
        # CALCULATE OVERALL SCORE DYNAMICALLY from component scores
        # Weight: Action Verbs (15%), STAR (20%), ATS (25%), Keywords (30%), Skill Relevance (10%)
        calculated_overall_score = (
            action_verb_analysis['score'] * 0.15 +
            star_analysis['score'] * 0.20 +
            groq_analysis.get('ats_score', 50) * 0.25 +
            keyword_analysis['keyword_density'] * 0.30 +
            skill_validation['relevance_score'] * 0.10
        )
        
        # Apply penalty for role mismatch (if many irrelevant skills found)
        if skill_validation['has_mismatch']:
            calculated_overall_score *= 0.75  # 25% penalty for significant mismatch
            print(f"⚠️  Applied 25% penalty for role mismatch. Score: {calculated_overall_score:.1f}%")
        
        print(f"📊 Calculated overall score: {calculated_overall_score:.1f}%")
        print(f"   - Action Verbs: {action_verb_analysis['score']:.1f}% (15% weight)")
        print(f"   - STAR Method: {star_analysis['score']:.1f}% (20% weight)")
        print(f"   - ATS Score: {groq_analysis.get('ats_score', 50):.1f}% (25% weight)")
        print(f"   - Keywords: {keyword_analysis['keyword_density']:.1f}% (30% weight)")
        print(f"   - Skill Relevance: {skill_validation['relevance_score']:.1f}% (10% weight)")
        
        # Enrich STAR bullet improvements using LLM (context-specific)
        print("🌟 Enriching STAR improvements with LLM...")
        star_analysis['bullet_analysis'] = await enrich_star_with_llm(
            star_analysis['bullet_analysis'], job_role, resume_text
        )
        
        # Combine with specialized analysis
        result = {
            **groq_analysis,
            "action_verb_analysis": action_verb_analysis,
            "star_analysis": star_analysis,
            "action_verb_score": action_verb_analysis['score'],
            "star_methodology_score": star_analysis['score'],
            "keyword_analysis": keyword_analysis,
            "skill_validation": skill_validation,
            "overall_score": round(calculated_overall_score, 1),  # Use calculated score, not AI's
            "recruiter_tips": groq_analysis.get('recruiter_tips', [
                {"label": "Job Level Match", "status": "warning", "description": "Could not determine experience level match."},
                {"label": "Measurable Results", "status": "warning", "description": "Check for quantifiable achievements."},
                {"label": "Resume Tone", "status": "success", "description": "Professional tone detected."}
            ]),
            "suggested_roles": groq_analysis.get('suggested_roles', [])
        }
        
        return result
        
    except Exception as e:
        print(f"Groq analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Groq analysis failed: {str(e)}")

async def save_analysis_to_history(user_id: str, job_role: str, job_description: str, 
                                 file_name: str, file_path: str, analysis_results: dict, 
                                 resume_id: Optional[str] = None) -> str:
    """Save analysis to history table and update user_resumes"""
    try:
        if not db_pool:
            return ""
        
        # Validate user_id is a proper UUID before inserting
        import uuid as _uuid
        try:
            _uuid.UUID(user_id)
        except (ValueError, AttributeError):
            print(f"⚠️ Skipping history save — invalid user_id: '{user_id}'")
            return ""
        
        async with db_pool.acquire() as conn:
            # Insert analysis into history
            analysis_id = await conn.fetchval("""
                INSERT INTO resume_analysis_history 
                (user_id, job_role, job_description, file_name, file_path, analysis_results, 
                 action_verb_score, star_methodology_score, ats_score, overall_score, 
                 recommendations, line_by_line_analysis, resume_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id
            """, 
            user_id, job_role, job_description, file_name, file_path, 
            json.dumps(analysis_results),
            analysis_results.get('action_verb_score', 0),
            analysis_results.get('star_methodology_score', 0),
            analysis_results.get('ats_score', 0),
            analysis_results.get('overall_score', 0),
            json.dumps(analysis_results.get('recommendations', [])),
            json.dumps(analysis_results.get('line_by_line_analysis', [])),
            resume_id
            )
            
            # Update user_resumes table if resume_id is provided
            if resume_id:
                await conn.execute("""
                    UPDATE user_resumes
                    SET analysis_count = COALESCE(analysis_count, 0) + 1,
                        last_analyzed_at = NOW(),
                        latest_analysis_id = $1
                    WHERE id = $2
                """, str(analysis_id), resume_id)
                print(f"✅ Updated resume record {resume_id} with analysis {analysis_id}")
            
            return str(analysis_id)
    except Exception as e:
        print(f"Error saving analysis to history: {e}")
        import traceback
        traceback.print_exc()
        return ""

# API Endpoints
@app.post("/analyze-resume")
async def analyze_resume(
    resume: Optional[UploadFile] = File(None),
    job_role: str = Form(...),
    job_description: str = Form(""),
    user_id: Optional[str] = Form(None),
    resume_id: Optional[str] = Form(None)
):
    """Enhanced resume analysis with action words and STAR methodology scoring"""
    
    resume_record_id = None
    file_name = ""
    file_content = None
    
    # Handle two cases: new upload or existing resume selection
    if resume_id:
        # Fetch existing resume from database
        print(f"📂 Using existing resume ID: {resume_id}")
        try:
            if not db_pool:
                raise HTTPException(status_code=500, detail="Database not available")
            
            async with db_pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT id, filename, file_path, user_id
                    FROM user_resumes 
                    WHERE id = $1
                """, resume_id)
                
                if not row:
                    raise HTTPException(status_code=404, detail="Resume not found")
                
                if user_id and row['user_id'] != user_id:
                    raise HTTPException(status_code=403, detail="Access denied to this resume")
                
                file_name = row['filename']
                resume_record_id = row['id']
                file_path = row['file_path']
                
                # Fetch file from Supabase Storage
                print(f"📥 Fetching file from storage: {file_path}")
                try:
                    response = supabase.storage.from_("resume-files").download(file_path)
                    file_content = response
                    print(f"✅ File fetched successfully, size: {len(file_content)} bytes")
                except Exception as storage_error:
                    print(f"❌ Storage fetch error: {storage_error}")
                    raise HTTPException(status_code=500, detail=f"Failed to fetch resume from storage: {str(storage_error)}")
                
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Error fetching existing resume: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch resume: {str(e)}")
    
    elif resume and resume.filename:
        # New file upload
        print(f"📤 Processing new resume upload: {resume.filename}")
        file_name = resume.filename
        
        # Validate file type
        allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if resume.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        
        # Read file content
        file_content = await resume.read()
    else:
        raise HTTPException(status_code=400, detail="Either resume file or resume_id must be provided")
    
    if not file_content:
        raise HTTPException(status_code=400, detail="Could not read resume content")
    
    try:
        # Extract text based on file type
        is_pdf = file_name.lower().endswith('.pdf') or (resume and resume.content_type == 'application/pdf')
        
        if is_pdf:
            resume_text = extract_text_from_pdf(file_content)
        else:
            resume_text = extract_text_from_docx(file_content)
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the uploaded file")
        
        # Store file in Supabase storage
        file_path = ""
        if supabase and user_id:
            try:
                # Use file_name which is safely set above
                storage_path = f"{user_id}/{file_name}"
                print(f"📡 Attempting storage upload to: {storage_path}")
                # Try to upload, but don't fail if storage bucket doesn't exist
                try:
                    supabase.storage.from_("resume-files").upload(storage_path, file_content)
                    file_path = storage_path
                    print(f"✅ File uploaded to storage: {storage_path}")
                except Exception as storage_error:
                    print(f"⚠️ Storage upload failed (bucket may not exist): {storage_error}")
                    # Continue without storage - analysis can still work
                    file_path = f"local/{file_name}"
            except Exception as e:
                print(f"⚠️ Storage preparation error: {e}")
                file_path = f"local/{file_name}"
        
        # Perform enhanced analysis
        print(f"📊 Starting analysis for job role: {job_role}")
        print(f"📄 Resume text length: {len(resume_text)} characters")
        
        try:
            analysis_results = await analyze_with_groq(resume_text, job_role, job_description)
            print(f"✅ Analysis completed successfully")
        except Exception as analysis_error:
            print(f"❌ Analysis failed: {analysis_error}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(analysis_error)}")
        
        # Save to history
        analysis_id = ""
        if user_id:
            try:
                analysis_id = await save_analysis_to_history(
                    user_id, job_role, job_description, file_name, 
                    file_path, analysis_results, resume_record_id
                )
                print(f"✅ Analysis saved to history: {analysis_id}")
            except Exception as save_error:
                print(f"⚠️ Failed to save to history (non-critical): {save_error}")
                import traceback
                traceback.print_exc()
                # Continue even if history save fails
        
        return {
            "status": "success",
            "analysis_id": analysis_id,
            "analysis": analysis_results,
            "extracted_text": resume_text[:2000] + "..." if len(resume_text) > 2000 else resume_text,
            "full_resume_text": resume_text
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected analysis error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/analysis-history/{user_id}")
async def get_analysis_history(user_id: str):
    """Get user's analysis history"""
    try:
        if not db_pool:
            raise HTTPException(status_code=500, detail="Database not available")
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, job_role, job_description, file_name, 
                       action_verb_score, star_methodology_score, ats_score, overall_score,
                       created_at
                FROM resume_analysis_history 
                WHERE user_id = $1 
                ORDER BY created_at DESC
            """, user_id)
            
            history = [dict(row) for row in rows]
            return {"status": "success", "history": history}
            
    except Exception as e:
        print(f"Error getting analysis history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

@app.get("/analysis/{analysis_id}")
async def get_analysis_details(analysis_id: str):
    """Get detailed analysis by ID"""
    try:
        if not db_pool:
            raise HTTPException(status_code=500, detail="Database not available")
        
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM resume_analysis_history WHERE id = $1
            """, analysis_id)
            
            if not row:
                raise HTTPException(status_code=404, detail="Analysis not found")
            
            analysis = dict(row)
            return {"status": "success", "analysis": analysis}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting analysis details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analysis: {str(e)}")

@app.get("/profile-resumes/{user_id}")
async def get_profile_resumes(user_id: str):
    """Get user's existing resumes from profile builder (legacy endpoint)"""
    try:
        if not db_pool:
            raise HTTPException(status_code=500, detail="Database not available")
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, filename, file_path, upload_date, processing_status
                FROM user_resumes 
                WHERE user_id = $1 
                ORDER BY upload_date DESC
            """, user_id)
            
            resumes = [dict(row) for row in rows]
            return {"status": "success", "resumes": resumes}
            
    except Exception as e:
        print(f"Error getting profile resumes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get resumes: {str(e)}")

@app.get("/user-resumes/{user_id}")
async def get_user_resumes_for_analyzer(user_id: str):
    """Get all user resumes with analysis count for selection in analyzer"""
    try:
        if not db_pool:
            raise HTTPException(status_code=500, detail="Database not available")
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT r.id, r.filename, r.file_path, r.upload_date, 
                       r.file_size, r.processing_status,
                       COALESCE(r.analysis_count, 0) as analysis_count,
                       r.last_analyzed_at
                FROM user_resumes r
                WHERE r.user_id = $1
                ORDER BY r.upload_date DESC
            """, user_id)
            
            resumes = [dict(row) for row in rows]
            print(f"✅ Found {len(resumes)} resumes for user {user_id}")
            return {"status": "success", "resumes": resumes}
            
    except Exception as e:
        print(f"❌ Error getting user resumes: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get resumes: {str(e)}")


@app.get("/analysis/{analysis_id}/full")
async def get_full_analysis(analysis_id: str):
    """Get complete analysis results for viewing past reports"""
    try:
        if not db_pool:
            raise HTTPException(status_code=500, detail="Database not available")
        
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, user_id, job_role, job_description, file_name,
                       analysis_results, action_verb_score, star_methodology_score,
                       ats_score, overall_score, recommendations, line_by_line_analysis,
                       created_at
                FROM resume_analysis_history WHERE id = $1
            """, analysis_id)
            
            if not row:
                raise HTTPException(status_code=404, detail="Analysis not found")
            
            result = dict(row)
            # Parse JSON fields
            if result.get('analysis_results'):
                try:
                    result['analysis_results'] = json.loads(result['analysis_results']) if isinstance(result['analysis_results'], str) else result['analysis_results']
                except (json.JSONDecodeError, TypeError):
                    pass
            if result.get('recommendations'):
                try:
                    result['recommendations'] = json.loads(result['recommendations']) if isinstance(result['recommendations'], str) else result['recommendations']
                except (json.JSONDecodeError, TypeError):
                    pass
            if result.get('line_by_line_analysis'):
                try:
                    result['line_by_line_analysis'] = json.loads(result['line_by_line_analysis']) if isinstance(result['line_by_line_analysis'], str) else result['line_by_line_analysis']
                except (json.JSONDecodeError, TypeError):
                    pass
            
            return {"status": "success", "analysis": result}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting full analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analysis: {str(e)}")


@app.post("/suggest-roles")
async def suggest_roles(resume_text: str = Form(...)):
    """AI suggests best-fit roles based on resume content"""
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq client not initialized")
    
    try:
        prompt = f"""Analyze this resume and suggest the top 6 job roles that best fit this candidate.

Resume:
{resume_text[:3000]}

Return ONLY valid JSON:
{{
    "suggested_roles": [
        {{
            "title": "Job Title",
            "match_score": 0-100,
            "reasoning": "1-sentence explanation",
            "key_skills": ["skill1", "skill2", "skill3"]
        }}
    ]
}}

Rank by match_score descending. Be realistic with scores."""
        
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a career advisor. Respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=1000
        )
        
        response_text = response.choices[0].message.content.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(response_text)
        return {"status": "success", **result}
        
    except Exception as e:
        print(f"Role suggestion error: {e}")
        raise HTTPException(status_code=500, detail=f"Role suggestion failed: {str(e)}")


@app.get("/")
async def root():
    """Service information"""
    return {
        "service": "StudyMate Resume Analyzer",
        "version": "3.0.0",
        "description": "Enhanced AI-powered resume analysis with action words, STAR methodology, and role suggestions",
        "endpoints": {
            "analyze": "POST /analyze-resume",
            "suggest_roles": "POST /suggest-roles",
            "history": "GET /analysis-history/{user_id}",
            "full_analysis": "GET /analysis/{analysis_id}/full",
            "details": "GET /analysis/{analysis_id}",
            "user_resumes": "GET /user-resumes/{user_id}",
            "health": "GET /health"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
