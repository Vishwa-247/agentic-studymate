#!/usr/bin/env python3
"""
Test script to check API Gateway functionality
"""
import os
import sys

sys.path.append('.')

try:
    print("Testing API Gateway imports...")
    
    # Test basic imports
    from fastapi import FastAPI
    print("FastAPI imported successfully")
    
    from fastapi.middleware.cors import CORSMiddleware
    print("CORS middleware imported successfully")
    
    from jose import JWTError, jwt
    print("JWT imports successful")
    
    from datetime import datetime, timedelta
    print("DateTime imports successful")
    
    import httpx
    print("HTTPx imported successfully")
    
    from dotenv import load_dotenv
    print("Python-dotenv imported successfully")
    
    # Test API Gateway import
    print("\nTesting API Gateway main module...")
    from api_gateway.main import app
    print("API Gateway main module imported successfully!")
    
    # Test app creation
    print(f"FastAPI app created: {app.title}")
    print(f"App version: {app.version}")
    
    print("\nAll imports successful! API Gateway should work.")
    
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
