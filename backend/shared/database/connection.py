from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from typing import Optional

# MongoDB configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://Studymate:8bXhotVr353DQGwb@aipathway.aimqfai.mongodb.net/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "studymate_db")

class DatabaseManager:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database = None
    
    async def connect(self):
        """Create database connection"""
        self.client = AsyncIOMotorClient(MONGODB_URL)
        self.database = self.client[DATABASE_NAME]
        
        # Test connection
        try:
            await self.client.admin.command('ping')
            print("Connected to MongoDB successfully!")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise e
    
    async def disconnect(self):
        """Close database connection"""
        if self.client:
            self.client.close()
    
    def get_collection(self, collection_name: str):
        """Get a collection from the database"""
        if not self.database:
            raise Exception("Database not connected")
        return self.database[collection_name]

# Global database manager instance
db_manager = DatabaseManager()

# Database collections
async def get_users_collection():
    return db_manager.get_collection("users")

async def get_courses_collection():
    return db_manager.get_collection("courses")

async def get_chapters_collection():
    return db_manager.get_collection("chapters")

async def get_flashcards_collection():
    return db_manager.get_collection("flashcards")

async def get_mcqs_collection():
    return db_manager.get_collection("mcqs")

async def get_qnas_collection():
    return db_manager.get_collection("qnas")

async def get_mock_interviews_collection():
    return db_manager.get_collection("mock_interviews")

async def get_interview_questions_collection():
    return db_manager.get_collection("interview_questions")

async def get_interview_analysis_collection():
    return db_manager.get_collection("interview_analysis")

async def get_progress_tracking_collection():
    return db_manager.get_collection("progress_tracking")

async def get_dsa_problems_collection():
    return db_manager.get_collection("dsa_problems")

async def get_profiles_collection():
    return db_manager.get_collection("profiles")

# Utility functions
async def init_database():
    """Initialize database connection and create indexes"""
    await db_manager.connect()
    
    # Create indexes for better performance
    users_collection = await get_users_collection()
    await users_collection.create_index("email", unique=True)
    
    courses_collection = await get_courses_collection()
    await courses_collection.create_index([("user_id", 1), ("created_at", -1)])
    
    chapters_collection = await get_chapters_collection()
    await chapters_collection.create_index([("course_id", 1), ("order_number", 1)])
    
    mock_interviews_collection = await get_mock_interviews_collection()
    await mock_interviews_collection.create_index([("user_id", 1), ("created_at", -1)])
    
    progress_collection = await get_progress_tracking_collection()
    await progress_collection.create_index([("user_id", 1), ("activity_type", 1), ("created_at", -1)])
    
    print("Database indexes created successfully!")

async def close_database():
    """Close database connection"""
    await db_manager.disconnect()

# Synchronous client for data seeding
def get_sync_client():
    """Get synchronous MongoDB client for data seeding"""
    return MongoClient(MONGODB_URL)

def get_sync_database():
    """Get synchronous database for data seeding"""
    client = get_sync_client()
    return client[DATABASE_NAME]