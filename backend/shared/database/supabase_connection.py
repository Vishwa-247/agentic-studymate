"""
Supabase PostgreSQL connection module for StudyMate backend services
Replaces MongoDB with Supabase PostgreSQL for unified database access
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import asyncpg

logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL", "postgresql://postgres:your_password@db.jwmsgrodliegekbrhvgt.supabase.co:5432/postgres")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://jwmsgrodliegekbrhvgt.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))

class SupabaseManager:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.supabase = None
        
        # Check environment variables
        logger.info(f"🔍 SUPABASE_URL: {SUPABASE_URL[:50]}..." if SUPABASE_URL else "❌ NOT SET")
        logger.info(f"🔍 SUPABASE_SERVICE_ROLE_KEY: {'SET (' + str(len(SUPABASE_SERVICE_ROLE_KEY)) + ' chars)' if SUPABASE_SERVICE_ROLE_KEY else '❌ NOT SET'}")
        
        # Try to create Supabase client
        try:
            if not SUPABASE_SERVICE_ROLE_KEY:
                logger.error("❌ SUPABASE_SERVICE_KEY not found in environment variables")
                logger.error("💡 Make sure your .env file has: SUPABASE_SERVICE_KEY=eyJhbGc...")
                return
                
            from supabase import create_client
            self.supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
            logger.info("✅ Supabase client created successfully")
        except ImportError as e:
            logger.error(f"❌ Supabase library not installed: {e}")
            logger.error("💡 Run: pip install supabase")
        except Exception as e:
            logger.error(f"❌ Failed to create Supabase client: {e}")
            import traceback
            logger.error(f"📋 Traceback: {traceback.format_exc()}")
        
    async def connect(self):
        """Create database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                SUPABASE_DB_URL,
                min_size=1,
                max_size=10,
                command_timeout=60,
                statement_cache_size=0  # CRITICAL: Disable prepared statements for PgBouncer compatibility
            )
            logger.info("Connected to Supabase PostgreSQL successfully!")
        except Exception as e:
            logger.error(f"Failed to connect to Supabase: {e}")
            # Don't raise error, allow offline mode
            logger.warning("Running in offline mode")
    
    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Disconnected from Supabase PostgreSQL")
    
    async def execute_query(self, query: str, *args) -> List[Dict]:
        """Execute a SELECT query and return results"""
        if not self.pool:
            raise Exception("Database not connected")
        
        async with self.pool.acquire() as connection:
            rows = await connection.fetch(query, *args)
            return [dict(row) for row in rows]
    
    async def execute_command(self, command: str, *args) -> str:
        """Execute INSERT/UPDATE/DELETE command"""
        if not self.pool:
            raise Exception("Database not connected")
        
        async with self.pool.acquire() as connection:
            result = await connection.execute(command, *args)
            return result
    
    async def fetch_one(self, query: str, *args) -> Optional[Dict]:
        """Fetch single row"""
        if not self.pool:
            raise Exception("Database not connected")
        
        async with self.pool.acquire() as connection:
            row = await connection.fetchrow(query, *args)
            return dict(row) if row else None

# Global database manager instance
db_manager = SupabaseManager()

# Profile operations
async def get_user_profile(user_id: str) -> Optional[Dict]:
    """Get user profile from Supabase"""
    query = """
        SELECT * FROM user_profiles 
        WHERE user_id = $1
    """
    return await db_manager.fetch_one(query, user_id)

async def create_user_profile(user_id: str, profile_data: Dict) -> Dict:
    """Create new user profile"""
    query = """
        INSERT INTO user_profiles (
            user_id, full_name, email, phone, location, 
            linkedin_url, github_url, portfolio_url, professional_summary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    """
    
    async with db_manager.pool.acquire() as connection:
        row = await connection.fetchrow(
            query,
            user_id,
            profile_data.get('full_name'),
            profile_data.get('email'),
            profile_data.get('phone'),
            profile_data.get('location'),
            profile_data.get('linkedin_url'),
            profile_data.get('github_url'),
            profile_data.get('portfolio_url'),
            profile_data.get('professional_summary')
        )
        return dict(row)

async def update_user_profile(user_id: str, profile_data: Dict) -> Dict:
    """Update existing user profile"""
    query = """
        UPDATE user_profiles 
        SET full_name = $2, email = $3, phone = $4, location = $5,
            linkedin_url = $6, github_url = $7, portfolio_url = $8,
            professional_summary = $9, updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
    """
    
    async with db_manager.pool.acquire() as connection:
        row = await connection.fetchrow(
            query,
            user_id,
            profile_data.get('full_name'),
            profile_data.get('email'),
            profile_data.get('phone'),
            profile_data.get('location'),
            profile_data.get('linkedin_url'),
            profile_data.get('github_url'),
            profile_data.get('portfolio_url'),
            profile_data.get('professional_summary')
        )
        return dict(row) if row else None

# Resume operations
async def save_resume_analysis(user_id: str, resume_data: Dict) -> str:
    """Save resume analysis to Supabase"""
    query = """
        INSERT INTO user_resumes (
            user_id, filename, file_path, file_size, extracted_text,
            ai_analysis, skill_gaps, recommendations, processing_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
    """
    
    async with db_manager.pool.acquire() as connection:
        row = await connection.fetchrow(
            query,
            user_id,
            resume_data.get('filename'),
            resume_data.get('file_path', ''),
            resume_data.get('file_size', 0),
            resume_data.get('extracted_text'),
            json.dumps(resume_data.get('ai_analysis', {})),
            resume_data.get('skill_gaps', []),
            resume_data.get('recommendations', []),
            'completed'
        )
        return str(row['id'])

async def get_user_resumes(user_id: str) -> List[Dict]:
    """Get all resumes for a user"""
    query = """
        SELECT * FROM user_resumes 
        WHERE user_id = $1 
        ORDER BY created_at DESC
    """
    return await db_manager.execute_query(query, user_id)

# Education operations
async def save_user_education(user_id: str, education_data: List[Dict]) -> bool:
    """Save user education data"""
    # First, delete existing education
    delete_query = "DELETE FROM user_education WHERE user_id = $1"
    await db_manager.execute_command(delete_query, user_id)
    
    # Insert new education records
    for edu in education_data:
        insert_query = """
            INSERT INTO user_education (
                user_id, institution, degree, field_of_study, 
                start_year, end_year, grade, description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """
        await db_manager.execute_command(
            insert_query,
            user_id,
            edu.get('institution'),
            edu.get('degree'),
            edu.get('field'),
            edu.get('startYear'),
            edu.get('endYear'),
            edu.get('grade'),
            edu.get('description')
        )
    
    return True

async def get_user_education(user_id: str) -> List[Dict]:
    """Get user education data"""
    query = "SELECT * FROM user_education WHERE user_id = $1 ORDER BY end_year DESC"
    return await db_manager.execute_query(query, user_id)

# Experience operations
async def save_user_experience(user_id: str, experience_data: List[Dict]) -> bool:
    """Save user experience data"""
    # First, delete existing experience
    delete_query = "DELETE FROM user_experience WHERE user_id = $1"
    await db_manager.execute_command(delete_query, user_id)
    
    # Insert new experience records
    for exp in experience_data:
        insert_query = """
            INSERT INTO user_experience (
                user_id, company, position, start_date, end_date,
                is_current, description, technologies, location
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """
        await db_manager.execute_command(
            insert_query,
            user_id,
            exp.get('company'),
            exp.get('position'),
            exp.get('startDate'),
            exp.get('endDate'),
            exp.get('current', False),
            exp.get('description'),
            exp.get('technologies', []),
            exp.get('location')
        )
    
    return True

async def get_user_experience(user_id: str) -> List[Dict]:
    """Get user experience data"""
    query = "SELECT * FROM user_experience WHERE user_id = $1 ORDER BY start_date DESC"
    return await db_manager.execute_query(query, user_id)

# Projects operations
async def save_user_projects(user_id: str, projects_data: List[Dict]) -> bool:
    """Save user projects data"""
    # First, delete existing projects
    delete_query = "DELETE FROM user_projects WHERE user_id = $1"
    await db_manager.execute_command(delete_query, user_id)
    
    # Insert new project records
    for project in projects_data:
        insert_query = """
            INSERT INTO user_projects (
                user_id, title, description, technologies, 
                start_date, end_date, github_url, live_url, highlights
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """
        await db_manager.execute_command(
            insert_query,
            user_id,
            project.get('title'),
            project.get('description'),
            project.get('technologies', []),
            project.get('startDate'),
            project.get('endDate'),
            project.get('githubUrl'),
            project.get('liveUrl'),
            project.get('highlights', [])
        )
    
    return True

async def get_user_projects(user_id: str) -> List[Dict]:
    """Get user projects data"""
    query = "SELECT * FROM user_projects WHERE user_id = $1 ORDER BY start_date DESC"
    return await db_manager.execute_query(query, user_id)

# Skills operations
async def save_user_skills(user_id: str, skills_data: List[Dict]) -> bool:
    """Save user skills data"""
    # First, delete existing skills
    delete_query = "DELETE FROM user_skills WHERE user_id = $1"
    await db_manager.execute_command(delete_query, user_id)
    
    # Insert new skill records
    for skill in skills_data:
        insert_query = """
            INSERT INTO user_skills (user_id, name, level, category)
            VALUES ($1, $2, $3, $4)
        """
        await db_manager.execute_command(
            insert_query,
            user_id,
            skill.get('name'),
            skill.get('level'),
            skill.get('category')
        )
    
    return True

async def get_user_skills(user_id: str) -> List[Dict]:
    """Get user skills data"""
    query = "SELECT * FROM user_skills WHERE user_id = $1 ORDER BY category, name"
    return await db_manager.execute_query(query, user_id)

# Certifications operations
async def save_user_certifications(user_id: str, certifications_data: List[Dict]) -> bool:
    """Save user certifications data"""
    # First, delete existing certifications
    delete_query = "DELETE FROM user_certifications WHERE user_id = $1"
    await db_manager.execute_command(delete_query, user_id)
    
    # Insert new certification records
    for cert in certifications_data:
        insert_query = """
            INSERT INTO user_certifications (
                user_id, name, issuer, issue_date, expiry_date,
                credential_id, credential_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        """
        await db_manager.execute_command(
            insert_query,
            user_id,
            cert.get('name'),
            cert.get('issuer'),
            cert.get('issueDate'),
            cert.get('expiryDate'),
            cert.get('credentialId'),
            cert.get('credentialUrl')
        )
    
    return True

async def get_user_certifications(user_id: str) -> List[Dict]:
    """Get user certifications data"""
    query = "SELECT * FROM user_certifications WHERE user_id = $1 ORDER BY issue_date DESC"
    return await db_manager.execute_query(query, user_id)

# Utility functions
async def init_database():
    """Initialize database connection"""
    await db_manager.connect()
    logger.info("Supabase database connection initialized successfully!")

async def close_database():
    """Close database connection"""
    await db_manager.disconnect()

# Health check
async def health_check() -> Dict[str, Any]:
    """Check database health"""
    try:
        if not db_manager.pool:
            return {"status": "unhealthy", "error": "No connection pool"}
        
        async with db_manager.pool.acquire() as connection:
            await connection.fetchval("SELECT 1")
        
        return {
            "status": "healthy",
            "database": "supabase_postgresql",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
