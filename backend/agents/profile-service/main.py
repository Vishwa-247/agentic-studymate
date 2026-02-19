import io
import json
import logging
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import docx
import PyPDF2
# Load environment variables from backend root
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

backend_root = Path(__file__).parent.parent.parent
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

# Add the backend directory to the path for shared module imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from shared.database.supabase_connection import (SupabaseManager,
                                                 close_database,
                                                 create_user_profile,
                                                 get_user_certifications,
                                                 get_user_education,
                                                 get_user_experience,
                                                 get_user_profile,
                                                 get_user_projects,
                                                 get_user_skills)
from shared.database.supabase_connection import health_check as db_health_check
from shared.database.supabase_connection import (init_database,
                                                 save_user_certifications,
                                                 save_user_education,
                                                 save_user_experience,
                                                 save_user_projects,
                                                 save_user_skills,
                                                 update_user_profile)

# Create a SupabaseManager instance  
supabase_manager = SupabaseManager()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    try:
        logger.info("🔌 Attempting to connect to database...")
        logger.info(f"📊 SupabaseManager instance exists: {supabase_manager is not None}")
        logger.info(f"📊 Supabase client exists: {supabase_manager.supabase is not None if supabase_manager else 'N/A'}")
        
        # Connect the main supabase_manager instance
        await supabase_manager.connect()
        
        # CRITICAL FIX: Also connect the global db_manager from supabase_connection.py
        # This is used by all helper functions (create_user_profile, update_user_profile, etc.)
        from shared.database.supabase_connection import db_manager
        await db_manager.connect()
        
        logger.info(f"✅ Connection pool created: {supabase_manager.pool is not None if supabase_manager else 'N/A'}")
        logger.info(f"✅ Global db_manager pool created: {db_manager.pool is not None}")
        logger.info(f"✅ Supabase client ready: {supabase_manager.supabase is not None if supabase_manager else 'N/A'}")
        logger.info("🚀 Profile Service started successfully")
    except Exception as e:
        logger.error(f"💥 Database connection failed: {e}")
        logger.warning(f"⚠️ Database not available, running in offline mode")
        import traceback
        logger.error(f"📋 Traceback: {traceback.format_exc()}")
    
    yield
    
    # Disconnect both instances
    await supabase_manager.disconnect()
    from shared.database.supabase_connection import db_manager
    await db_manager.disconnect()
    logger.info("🛑 Profile Service shutdown complete")

# Create FastAPI app with lifespan
app = FastAPI(title="Profile Service - Supabase Edition", lifespan=lifespan)

# Enable CORS
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

# AI Configuration
GROQ_API_KEY = os.getenv("PROFILE_SERVICE_GROQ_KEY", os.getenv("GROQ_API_KEY", ""))

# Initialize Groq client
groq_client = None
if GROQ_API_KEY:
    try:
        from groq import Groq

        # Use the method that works (from successful test)
        groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info("✅ Groq client initialized successfully")
        logger.info(f"🔑 Using API key: {GROQ_API_KEY[:10]}...{GROQ_API_KEY[-4:]}")
    except ImportError as e:
        logger.error(f"⚠️ Groq library not installed: {e}")
        logger.error("Run: pip install groq")
    except Exception as e:
        logger.error(f"⚠️ Failed to initialize Groq client: {e}")
        logger.error("Run: pip install --upgrade groq")
else:
    logger.error("❌ GROQ_API_KEY not found in environment variables")
    logger.error("Please set GROQ_API_KEY in your .env file")

async def db_health_check():
    """Check database connection health"""
    try:
        if not supabase_manager or not supabase_manager.supabase:
            return {
                "status": "unhealthy",
                "error": "No connection pool"
            }

        # Test query
        result = supabase_manager.supabase.table('user_profiles').select('user_id').limit(1).execute()

        return {
            "status": "healthy",
            "connection": "active"
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        return ""

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        doc = docx.Document(io.BytesIO(file_content))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting DOCX text: {e}")
        return ""

async def extract_profile_with_groq(resume_text: str) -> dict:
    """Extract profile data using Groq AI"""
    if not groq_client:
        logger.error("❌ Groq client not available")
        logger.error("Possible issues:")
        logger.error("1. GROQ_API_KEY not set in .env file")
        logger.error("2. Groq library not installed (run: pip install groq)")
        logger.error("3. Invalid API key")
        raise Exception("Groq client not available - check API key and installation")
    
    if not resume_text or len(resume_text.strip()) < 10:
        raise Exception("Resume text is too short or empty")
    
    try:
        prompt = f"""
        Extract structured profile information from this resume text. Be precise and only extract information that is clearly present.
        
        Resume Text:
        {resume_text}
        
        Please provide a JSON response with the following structure:
        {{
            "personal_info": {{
                "name": "Full name (only if clearly stated)",
                "email": "Email address (only if found)",
                "phone": "Phone number (only if found)",
                "location": "Location/Address (only if found)",
                "linkedin": "LinkedIn URL (only if found)",
                "github": "GitHub URL (only if found)",
                "portfolio": "Portfolio URL (only if found)"
            }},
            "professional_summary": "Professional summary or objective (only if present)",
            "skills": [
                {{
                    "name": "Skill name",
                    "level": "Beginner|Intermediate|Advanced|Expert",
                    "category": "MUST be one of: Technical, Soft, Language, Framework, Tool"
                }}
            ],
            "experience": [
                {{
                    "company": "Company name",
                    "position": "Job title",
                    "location": "Work location",
                    "startDate": "Start date (YYYY-MM format if possible)",
                    "endDate": "End date (YYYY-MM format if possible)",
                    "current": false,
                    "description": "Job description and achievements",
                    "technologies": ["List of technologies used"]
                }}
            ],
            "education": [
                {{
                    "institution": "University/School name",
                    "degree": "Degree name",
                    "field": "Field of study",
                    "startYear": "Start year",
                    "endYear": "End year",
                    "grade": "GPA or grade if mentioned",
                    "description": "Additional details"
                }}
            ],
            "projects": [
                {{
                    "title": "Project name",
                    "description": "Project description",
                    "technologies": ["Technologies used"],
                    "startDate": "Start date if available",
                    "endDate": "End date if available",
                    "githubUrl": "GitHub URL if found",
                    "liveUrl": "Live demo URL if found",
                    "highlights": ["Key achievements or features"]
                }}
            ],
            "certifications": [
                {{
                    "name": "Certification name",
                    "issuer": "Issuing organization",
                    "issueDate": "Issue date",
                    "expiryDate": "Expiry date if applicable",
                    "credentialId": "Credential ID if available",
                    "credentialUrl": "Credential URL if available"
                }}
            ]
        }}
        
        CRITICAL SKILL CATEGORY RULES:
        - NEVER use 'Database', 'Backend', 'Frontend', 'DevOps', or custom categories
        - ONLY use these 5 categories: Technical, Soft, Language, Framework, Tool
        - Use 'Technical' for programming languages, technologies, ML/AI, SQL, databases, data science
        - Use 'Framework' for libraries like React, Django, TensorFlow, Scikit-learn, Pandas, NumPy
        - Use 'Tool' for software tools like Git, Docker, AWS, MongoDB, Redis, Elasticsearch, Jupyter, VS Code
        - Use 'Language' for human languages like English, Spanish, French, Hindi
        - Use 'Soft' for soft skills like Leadership, Communication, Teamwork, Problem Solving
        
        Only return valid JSON, no additional text. If information is not found, use empty strings or empty arrays.
        """
        
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert at extracting structured data from resumes. CRITICAL: Return ONLY valid JSON with no markdown, no explanations, no code blocks. Just the raw JSON object."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.1,
            max_tokens=3000
        )
        
        # NEW: Robust JSON extraction
        content = response.choices[0].message.content.strip()
        logger.info(f"🤖 Raw Groq response (first 200 chars): {content[:200]}")
        
        try:
            # Try direct JSON parse first
            extracted_data = json.loads(content)
        except json.JSONDecodeError:
            # Handle markdown code blocks: ```json ... ```
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
            if json_match:
                extracted_data = json.loads(json_match.group(1))
            else:
                # Try to find JSON object anywhere in the response
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    extracted_data = json.loads(json_match.group(0))
                else:
                    logger.error(f"❌ Could not extract JSON from response: {content[:500]}")
                    # Return empty structure instead of raising error to prevent upload failure
                    logger.warning("📝 Using empty profile structure due to AI extraction failure")
                    return get_empty_profile_structure()
        
        return extracted_data
        
    except Exception as e:
        logger.error(f"Groq extraction failed: {e}")
        raise e


def map_skill_category(category: str) -> str:
    """
    Map AI-generated skill categories to database-allowed categories.

    Allowed categories: 'Technical', 'Soft', 'Language', 'Framework', 'Tool'
    """
    category_lower = category.lower().strip()

    # Mapping rules
    technical_keywords = ['machine learning', 'data science', 'ai', 'ml', 'deep learning', 
                         'computer vision', 'nlp', 'data', 'database', 'programming', 'python', 'java', 
                         'javascript', 'sql', 'algorithms', 'statistics', 'nosql', 'mysql', 'postgresql']
    framework_keywords = ['framework', 'library', 'tensorflow', 'pytorch', 'react', 
                         'django', 'flask', 'scikit', 'pandas', 'numpy', 'spring', 'angular']
    tool_keywords = ['tool', 'software', 'platform', 'cloud', 'aws', 'azure', 
                    'docker', 'kubernetes', 'git', 'jenkins', 'jupyter', 'vscode', 
                    'mongodb', 'redis', 'elasticsearch', 'cassandra']
    soft_keywords = ['soft', 'communication', 'leadership', 'management', 'teamwork', 
                    'problem solving', 'analytical', 'creative']
    language_keywords = ['language', 'english', 'spanish', 'french', 'hindi', 'mandarin']

    # Check if category is already valid
    if category in ['Technical', 'Soft', 'Language', 'Framework', 'Tool']:
        return category

    # Map based on keywords
    for keyword in framework_keywords:
        if keyword in category_lower:
            return 'Framework'

    for keyword in tool_keywords:
        if keyword in category_lower:
            return 'Tool'

    for keyword in soft_keywords:
        if keyword in category_lower:
            return 'Soft'

    for keyword in language_keywords:
        if keyword in category_lower:
            return 'Language'

    for keyword in technical_keywords:
        if keyword in category_lower:
            return 'Technical'

    # Default fallback
    logger.warning(f"⚠️ Unknown skill category '{category}', defaulting to 'Technical'")
    return 'Technical'


def calculate_profile_completion(profile_data: Dict) -> int:
    """Calculate profile completion percentage based on filled fields"""
    total_fields = 0
    filled_fields = 0

    # Helper to get field value (handles both snake_case and camelCase)
    def get_field(snake_name: str, camel_name: str = None):
        return profile_data.get(snake_name) or profile_data.get(camel_name or snake_name)

    # Personal info fields (8 fields, 40% weight)
    personal_checks = [
        ('full_name', 'fullName'),
        ('email', 'email'),
        ('phone', 'phone'),
        ('location', 'location'),
        ('linkedin_url', 'linkedin'),
        ('github_url', 'github'),
        ('portfolio_url', 'portfolio'),
        ('professional_summary', 'summary')
    ]

    for snake, camel in personal_checks:
        total_fields += 1
        if get_field(snake, camel):
            filled_fields += 1

    # Section completion (60% weight total)
    sections = [
        ('education', profile_data.get('education', [])),
        ('experience', profile_data.get('experience', [])),
        ('projects', profile_data.get('projects', [])),
        ('skills', profile_data.get('skills', [])),
        ('certifications', profile_data.get('certifications', []))
    ]

    for section_name, section_data in sections:
        total_fields += 1
        if isinstance(section_data, list) and len(section_data) > 0:
            filled_fields += 1

    percentage = int((filled_fields / total_fields) * 100) if total_fields > 0 else 0
    logger.info(f"📊 Profile completion: {filled_fields}/{total_fields} fields = {percentage}%")
    return percentage


def get_empty_profile_structure():
    """Return empty profile structure as fallback"""
    return {
        "personal_info": {
            "name": "",
            "email": "",
            "phone": "",
            "location": "",
            "linkedin": "",
            "github": "",
            "portfolio": ""
        },
        "professional_summary": "",
        "skills": [],
        "experience": [],
        "education": [],
        "projects": [],
        "certifications": []
    }

@app.post("/extract-profile")
async def extract_profile_data(
    resume: UploadFile = File(...),
    user_id: str = Form(...)
):
    """Extract profile data from resume and store in Supabase"""
    try:
        logger.info(f"🔍 Starting profile extraction for user: {user_id}")

        # Check if database is connected
        if not supabase_manager or not supabase_manager.supabase:
            logger.error("❌ Database not connected")
            raise HTTPException(
                status_code=503, 
                detail="Database not connected"
            )
        
        # Test database connection
        try:
            db_status = await db_health_check()
            if not db_status.get("status") == "healthy":
                logger.warning(f"⚠️ Database health check failed: {db_status}")
        except Exception as db_test_error:
            logger.warning(f"⚠️ Database health check error: {db_test_error}")
        
        # Read file content
        file_content = await resume.read()
        
        # Store resume file in Supabase Storage
        file_ext = resume.filename.split('.')[-1] if '.' in resume.filename else 'pdf'
        storage_filename = f"{user_id}/{int(datetime.now().timestamp())}.{file_ext}"
        
        try:
            # Upload file to Supabase storage
            storage_result = supabase_manager.supabase.storage.from_('resume-files').upload(
                storage_filename,
                file_content,
                file_options={"content-type": resume.content_type}
            )
            logger.info(f"📁 File uploaded to storage: {storage_filename}")
        except Exception as storage_error:
            logger.warning(f"⚠️ Storage upload failed: {storage_error}")
            # Continue with extraction even if storage fails
        
        # Extract text based on file type
        if resume.content_type == "application/pdf":
            resume_text = extract_text_from_pdf(file_content)
        elif resume.content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]:
            resume_text = extract_text_from_docx(file_content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF or DOCX.")
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from resume. Please check file format.")
        
        logger.info(f"📄 Extracted {len(resume_text)} characters from resume")
        
        # Save resume metadata to database
        try:
            resume_record = {
                "user_id": user_id,
                "filename": resume.filename,
                "file_path": storage_filename,
                "file_size": len(file_content),
                "extracted_text": resume_text[:10000],  # Store first 10k chars
                "processing_status": "completed",
                "extraction_status": "processing"
            }
            
            supabase_manager.supabase.table('user_resumes').insert(resume_record).execute()
            logger.info("💾 Resume metadata saved to database")
        except Exception as db_error:
            logger.warning(f"⚠️ Failed to save resume metadata: {db_error}")
        
        # Extract structured data using Groq
        if not groq_client:
            raise HTTPException(status_code=503, detail="AI extraction service not available")
        
        logger.info("🧠 Extracting profile data with Groq AI...")
        try:
            extracted_data = await extract_profile_with_groq(resume_text)
        except Exception as groq_error:
            logger.error(f"⚠️ Groq extraction failed: {groq_error}")
            # Use empty structure but still save the resume text
            extracted_data = get_empty_profile_structure()
            logger.warning("📝 Using empty profile structure, resume text saved for manual review")
        
        # Transform extracted data to match frontend format
        formatted_data = {
            "personalInfo": {
                "fullName": extracted_data.get("personal_info", {}).get("name", ""),
                "email": extracted_data.get("personal_info", {}).get("email", ""),
                "phone": extracted_data.get("personal_info", {}).get("phone", ""),
                "location": extracted_data.get("personal_info", {}).get("location", ""),
                "linkedin": extracted_data.get("personal_info", {}).get("linkedin", ""),
                "github": extracted_data.get("personal_info", {}).get("github", ""),
                "portfolio": extracted_data.get("personal_info", {}).get("portfolio", ""),
            },
            "education": extracted_data.get("education", []),
            "experience": extracted_data.get("experience", []),
            "projects": extracted_data.get("projects", []),
            "skills": extracted_data.get("skills", []),
            "certifications": extracted_data.get("certifications", []),
            "summary": extracted_data.get("professional_summary", "")
        }
        
        # Apply skill category mapping to ensure database compatibility
        if "skills" in formatted_data and formatted_data["skills"]:
            logger.info(f"📝 Processing {len(formatted_data['skills'])} skills for category mapping")
            for skill in formatted_data["skills"]:
                if isinstance(skill, dict) and "category" in skill:
                    original_category = skill.get("category", "Technical")
                    mapped_category = map_skill_category(original_category)
                    
                    if original_category != mapped_category:
                        logger.info(f"📝 Mapped skill category '{original_category}' → '{mapped_category}' for skill: {skill.get('name', 'Unknown')}")
                    
                    skill["category"] = mapped_category
        
        # Calculate confidence score
        confidence_score = 0.0
        total_fields = 0
        filled_fields = 0
        
        # Check personal info completeness
        personal_info = formatted_data["personalInfo"]
        for field in ["fullName", "email", "phone", "location"]:
            total_fields += 1
            if personal_info.get(field) and personal_info.get(field).strip():
                filled_fields += 1
        
        # Check other sections
        sections = ["skills", "experience", "education", "projects", "certifications"]
        for section in sections:
            total_fields += 1
            if formatted_data.get(section) and len(formatted_data.get(section, [])) > 0:
                filled_fields += 1
        
        # Use 0-1 scale to avoid database overflow (NUMERIC(3,2) max is 9.99)
        confidence_score = filled_fields / total_fields if total_fields > 0 else 0
        
        # Store extraction result
        try:
            # VALIDATE confidence_score before saving
            if not isinstance(confidence_score, (int, float)):
                logger.error(f"❌ Invalid confidence_score type: {type(confidence_score)}")
                confidence_score = 0.0

            if confidence_score < 0 or confidence_score > 1:
                logger.warning(f"⚠️ Confidence score out of range: {confidence_score}, clamping to 0-1")
                confidence_score = max(0.0, min(1.0, confidence_score))

            extraction_record = {
                "user_id": user_id,
                "extracted_data": formatted_data,
                "confidence_score": round(confidence_score, 4),  # Round to 4 decimal places
                "status": "completed",
                "extraction_type": "groq_ai"
            }

            supabase_manager.supabase.table('resume_extractions').insert(extraction_record).execute()
            logger.info(f"💾 Extraction result saved with confidence: {confidence_score:.4f}")
        except Exception as db_error:
            import traceback
            logger.error(f"❌ Failed to save extraction result: {db_error}")
            logger.error(f"📋 Full error details: {traceback.format_exc()}")
            logger.error(f"📊 Attempted confidence_score value: {confidence_score}")
            logger.error(f"📊 Confidence_score type: {type(confidence_score)}")
            # Continue anyway - extraction succeeded even if DB save failed
        
        # Prepare response
        result = {
            "success": True,
            "extraction_id": f"extraction_{user_id}_{int(datetime.now().timestamp())}",
            "extracted_data": formatted_data,
            "confidence_score": round(confidence_score * 100, 2),  # Display as percentage
            "message": f"Successfully extracted profile data with {confidence_score * 100:.1f}% completeness",
            "metadata": {
                "filename": resume.filename,
                "file_size": len(file_content),
                "extraction_date": datetime.now().isoformat(),
                "ai_provider": "groq",
                "storage_path": storage_filename
            }
        }
        
        logger.info(f"✅ Profile extraction completed successfully with {confidence_score * 100:.1f}% confidence")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"💥 Critical error in extract_profile: {e}")
        logger.error(f"📋 Full traceback:\n{error_trace}")

        # Provide helpful error message based on error type
        if "groq_client" in str(e).lower() or "api" in str(e).lower():
            raise HTTPException(
                status_code=503, 
                detail=f"AI service error: {str(e)}. Please check GROQ_API_KEY configuration."
            )
        elif "json" in str(e).lower():
            raise HTTPException(
                status_code=500,
                detail=f"AI returned invalid format: {str(e)}. Please try uploading again."
            )
        else:
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/profile/{user_id}/apply-extraction")
async def apply_extracted_data(user_id: str, extracted_data: Dict[str, Any]):
    """Apply extracted resume data to user profile"""
    try:
        logger.info(f"🔄 Applying extracted data for user: {user_id}")
        logger.info(f"📋 Extracted data keys: {list(extracted_data.keys()) if extracted_data else 'None'}")
        
        if not extracted_data:
            raise HTTPException(status_code=400, detail="No extracted data provided")
        
        # TRANSFORM DATA: Convert between different naming conventions
        transformed_data = {}

        # Handle personalInfo / personal_info
        if "personalInfo" in extracted_data:
            transformed_data["personalInfo"] = extracted_data["personalInfo"]
        elif "personal_info" in extracted_data:
            transformed_data["personalInfo"] = extracted_data["personal_info"]

        # Copy other sections (they should match)
        for key in ["education", "experience", "projects", "skills", "certifications", "summary"]:
            if key in extracted_data:
                transformed_data[key] = extracted_data[key]

        logger.info(f"✅ Transformed data keys: {list(transformed_data.keys())}")

        # Apply the transformed data using the existing update endpoint
        await update_profile(user_id, transformed_data)
        
        # Mark extraction as applied
        try:
            result = supabase_manager.supabase.table('resume_extractions')\
                .update({"applied_at": datetime.now().isoformat(), "applied_by": user_id})\
                .eq('user_id', user_id)\
                .execute()
            logger.info(f"✅ Marked {len(result.data)} extraction(s) as applied")
        except Exception as db_error:
            logger.warning(f"⚠️ Failed to mark extraction as applied: {db_error}")
        
        # Calculate and update completion percentage using database function
        try:
            completion_result = await db_manager.fetch_one(
                "SELECT calculate_profile_completion($1) as completion",
                user_id
            )
            if completion_result:
                completion_percentage = completion_result['completion']
                logger.info(f"✅ Profile completion updated: {completion_percentage}%")
        except Exception as calc_error:
            logger.warning(f"⚠️ Failed to calculate completion percentage: {calc_error}")
        
        logger.info(f"✅ Extracted data applied successfully for user: {user_id}")
        return {
            "success": True,
            "message": "Profile updated successfully with extracted data"
        }
        
    except Exception as e:
        logger.error(f"💥 Error applying extracted data: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/profile/{user_id}/resume")
async def get_user_resume(user_id: str):
    """Get user's resume information"""
    try:
        result = supabase_manager.supabase.table('user_resumes')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('upload_date', desc=True)\
            .limit(1)\
            .execute()
        
        if result.data:
            return {"resume": result.data[0]}
        else:
            return {"resume": None}
            
    except Exception as e:
        logger.error(f"💥 Error fetching resume: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.delete("/profile/{user_id}/resume")
async def delete_user_resume(user_id: str):
    """Delete user's resume"""
    try:
        # Get resume info first
        result = supabase_manager.supabase.table('user_resumes')\
            .select('file_path')\
            .eq('user_id', user_id)\
            .execute()
        
        # Delete from storage
        if result.data:
            for resume in result.data:
                try:
                    supabase_manager.supabase.storage.from_('resume-files').remove([resume['file_path']])
                except Exception as storage_error:
                    logger.warning(f"⚠️ Failed to delete from storage: {storage_error}")
        
        # Delete from database
        supabase_manager.supabase.table('user_resumes').delete().eq('user_id', user_id).execute()
        supabase_manager.supabase.table('resume_extractions').delete().eq('user_id', user_id).execute()
        
        logger.info(f"✅ Resume deleted successfully for user: {user_id}")
        return {"success": True, "message": "Resume deleted successfully"}
        
    except Exception as e:
        logger.error(f"💥 Error deleting resume: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/profile/{user_id}")
async def get_profile(user_id: str):
    """Get complete user profile"""
    try:
        logger.info(f"📖 Fetching profile for user: {user_id}")
        
        # Check if database is available
        if not supabase_manager or not supabase_manager.supabase:
            logger.warning("Database not connected, returning empty profile")
            return {
                "user_id": user_id,
                "full_name": "",
                "email": "",
                "phone": "",
                "location": "",
                "professional_summary": "",
                "linkedin_url": "",
                "github_url": "",
                "portfolio_url": "",
                "completion_percentage": 0,
                "education": [],
                "experience": [],
                "projects": [],
                "skills": [],
                "certifications": [],
                "_offline_mode": True
            }
        
        # Get main profile
        profile = await get_user_profile(user_id)
        if not profile:
            # Create empty profile structure
            return {
                "user_id": user_id,
                "full_name": "",
                "email": "",
                "phone": "",
                "location": "",
                "professional_summary": "",
                "linkedin_url": "",
                "github_url": "",
                "portfolio_url": "",
                "completion_percentage": 0,
                "education": [],
                "experience": [],
                "projects": [],
                "skills": [],
                "certifications": []
            }
        
        # Get related data
        education = await get_user_education(user_id)
        experience = await get_user_experience(user_id)
        projects = await get_user_projects(user_id)
        skills = await get_user_skills(user_id)
        certifications = await get_user_certifications(user_id)
        
        # Combine all data
        complete_profile = {
            **profile,
            "education": education,
            "experience": experience,
            "projects": projects,
            "skills": skills,
            "certifications": certifications
        }
        
        # Calculate and add completion percentage
        complete_profile["completion_percentage"] = calculate_profile_completion(complete_profile)
        
        logger.info(f"✅ Profile fetched successfully with {complete_profile['completion_percentage']}% completion for user: {user_id}")
        return complete_profile
        
    except Exception as e:
        logger.error(f"💥 Error fetching profile: {e}")
        # Return empty profile instead of 500 error
        return {
            "user_id": user_id,
            "full_name": "",
            "email": "",
            "phone": "",
            "location": "",
            "professional_summary": "",
            "linkedin_url": "",
            "github_url": "",
            "portfolio_url": "",
            "completion_percentage": 0,
            "education": [],
            "experience": [],
            "projects": [],
            "skills": [],
            "certifications": [],
            "_error": str(e)
        }

@app.put("/profile/{user_id}")
async def update_profile(user_id: str, profile_data: Dict[str, Any]):
    """Update user profile with all sections"""
    try:
        logger.info(f"💾 Updating profile for user: {user_id}")

        # Check if database is connected
        if not supabase_manager:
            logger.error("❌ SupabaseManager is None")
            raise HTTPException(status_code=503, detail="Database manager not initialized")

        if not supabase_manager.supabase:
            logger.error("❌ Supabase client is None")
            logger.error("💡 Check that SUPABASE_SERVICE_KEY is set in .env file")
            logger.error("💡 Check that supabase-py library is installed: pip install supabase")
            raise HTTPException(status_code=503, detail="Database client not initialized. Check environment variables and dependencies.")

        if not supabase_manager.pool:
            logger.warning("⚠️ Database pool is None, attempting to reconnect...")
            try:
                await supabase_manager.connect()
            except Exception as reconnect_error:
                logger.error(f"❌ Reconnection failed: {reconnect_error}")
                raise HTTPException(status_code=503, detail=f"Database connection failed: {reconnect_error}")
        
        # Update main profile
        if "personalInfo" in profile_data:
            personal_info = profile_data["personalInfo"]
            main_profile_data = {
                "full_name": personal_info.get("fullName"),
                "email": personal_info.get("email"),
                "phone": personal_info.get("phone"),
                "location": personal_info.get("location"),
                "linkedin_url": personal_info.get("linkedin"),
                "github_url": personal_info.get("github"),
                "portfolio_url": personal_info.get("portfolio"),
                "professional_summary": profile_data.get("summary", "")
            }
            
            # Check if profile exists
            existing_profile = await get_user_profile(user_id)
            if existing_profile:
                await update_user_profile(user_id, main_profile_data)
            else:
                await create_user_profile(user_id, main_profile_data)
        
        # Update related sections
        if "education" in profile_data:
            await save_user_education(user_id, profile_data["education"])
        
        if "experience" in profile_data:
            await save_user_experience(user_id, profile_data["experience"])
        
        if "projects" in profile_data:
            await save_user_projects(user_id, profile_data["projects"])
        
        if "skills" in profile_data:
            await save_user_skills(user_id, profile_data["skills"])
        
        if "certifications" in profile_data:
            await save_user_certifications(user_id, profile_data["certifications"])
        
        # Return updated profile
        updated_profile = await get_profile(user_id)
        
        logger.info(f"✅ Profile updated successfully for user: {user_id}")
        return updated_profile
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint with database status"""
    try:
        db_status = await db_health_check()
        
        ai_status = {
            "groq_available": groq_client is not None
        }
        
        return {
            "status": "healthy",
            "service": "profile-service-supabase",
            "database": db_status,
            "ai_providers": ai_status,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "profile-service-supabase",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "StudyMate Profile Service",
        "version": "2.0.0",
        "database": "supabase_postgresql",
        "ai_providers": ["groq"],
        "status": "running"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
