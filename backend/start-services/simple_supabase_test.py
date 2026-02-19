#!/usr/bin/env python
"""
Simple script to test Supabase connection with a shorter timeout
"""

import asyncio
import os
import sys

import asyncpg

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Load environment variables
from dotenv import load_dotenv

load_dotenv()

print("🔍 Simple Supabase Connection Test...")
print(f"✅ SUPABASE_DB_URL: {os.getenv('SUPABASE_DB_URL', 'NOT SET')}")

async def test_connection():
    """Test connection to Supabase PostgreSQL with shorter timeout"""
    db_url = os.getenv('SUPABASE_DB_URL')
    if not db_url:
        print("❌ SUPABASE_DB_URL not set")
        return False
        
    print(f"🔄 Testing connection...")
    
    try:
        # Try to create a connection with a short timeout
        connection = await asyncpg.connect(
            db_url,
            timeout=15
        )
        print("✅ Connected successfully!")
        
        # Try to execute a simple query
        result = await connection.fetchval("SELECT 1")
        print(f"✅ Query executed successfully: {result}")
        
        # Close the connection
        await connection.close()
        print("✅ Connection closed successfully!")
        return True
        
    except asyncio.TimeoutError:
        print("❌ Connection timed out - check your credentials and network")
        return False
    except asyncpg.InvalidPasswordError as e:
        print(f"❌ Invalid password error: {e}")
        return False
    except asyncpg.UndefinedTableError as e:
        print(f"✅ Connected but database error (expected): {e}")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting simple Supabase connection test...")
    result = asyncio.run(test_connection())
    if result:
        print("🎉 Test passed! Supabase connection is working.")
    else:
        print("💥 Connection test failed.")
