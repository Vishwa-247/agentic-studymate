#!/usr/bin/env python3
"""
StudyMate Backend - All-in-One Setup Script
===========================================

This script sets up the entire StudyMate backend with one virtual environment
and provides commands to run each service separately.

Features:
- Single virtual environment for all services
- Unified requirements installation
- Environment configuration
- Service management commands
- Resume upload and automatic profile filling

Usage:
    python setup_backend.py
"""

import os
import sys
import venv
import subprocess
import shutil
from pathlib import Path
import platform

class BackendSetup:
    def __init__(self):
        self.backend_dir = Path(__file__).parent
        self.venv_dir = self.backend_dir / "venv"
        self.is_windows = platform.system() == "Windows"
        
    def print_step(self, step, message):
        print(f"\n{'='*60}")
        print(f"STEP {step}: {message}")
        print(f"{'='*60}")
    
    def print_success(self, message):
        print(f"✅ {message}")
    
    def print_warning(self, message):
        print(f"⚠️ {message}")
    
    def print_error(self, message):
        print(f"❌ {message}")
    
    def check_python_version(self):
        """Check if Python version is compatible"""
        self.print_step(1, "Checking Python Version")
        
        version = sys.version_info
        if version.major < 3 or (version.major == 3 and version.minor < 8):
            self.print_error(f"Python 3.8+ required. Current: {version.major}.{version.minor}")
            sys.exit(1)
        
        self.print_success(f"Python {version.major}.{version.minor}.{version.micro} is compatible")
    
    def setup_virtual_environment(self):
        """Create unified virtual environment"""
        self.print_step(2, "Setting Up Virtual Environment")
        
        if self.venv_dir.exists():
            self.print_warning("Virtual environment already exists")
            response = input("Recreate it? (y/N): ").lower()
            if response == 'y':
                self.print_warning("Removing existing virtual environment...")
                shutil.rmtree(self.venv_dir)
            else:
                self.print_success("Using existing virtual environment")
                return
        
        print("📦 Creating virtual environment...")
        venv.create(self.venv_dir, with_pip=True)
        self.print_success("Virtual environment created successfully")
    
    def install_dependencies(self):
        """Install all dependencies from unified requirements"""
        self.print_step(3, "Installing All Dependencies")
        
        requirements_file = self.backend_dir / "unified_requirements.txt"
        if not requirements_file.exists():
            self.print_error("unified_requirements.txt not found")
            sys.exit(1)
        
        # Get pip executable
        if self.is_windows:
            pip_exe = self.venv_dir / "Scripts" / "pip.exe"
            python_exe = self.venv_dir / "Scripts" / "python.exe"
        else:
            pip_exe = self.venv_dir / "bin" / "pip"
            python_exe = self.venv_dir / "bin" / "python"
        
        print(f"📥 Installing packages from {requirements_file}")
        
        try:
            # Upgrade pip using python -m pip (Windows compatible)
            subprocess.run([str(python_exe), "-m", "pip", "install", "--upgrade", "pip"], 
                         check=True, capture_output=True, text=True)
            
            # Install requirements
            subprocess.run([str(python_exe), "-m", "pip", "install", "-r", str(requirements_file)], 
                         check=True, capture_output=True, text=True)
            
            self.print_success("All dependencies installed successfully")
            
        except subprocess.CalledProcessError as e:
            self.print_error(f"Failed to install dependencies: {e}")
            print("Error output:", e.stderr)
            sys.exit(1)
    
    def create_environment_file(self):
        """Create environment configuration file"""
        self.print_step(4, "Creating Environment Configuration")
        
        env_file = self.backend_dir / ".env"
        
        if env_file.exists():
            self.print_success(".env file already exists")
            return
        
        env_content = """# StudyMate Backend Environment Configuration
# ==============================================

# Groq AI Configuration (Required for Resume Parsing)
GROQ_API_KEY=your_groq_api_key_here

# Supabase Configuration (Required for Database)
SUPABASE_URL=https://jwmsgrodliegekbrhvgt.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
SUPABASE_DB_URL=postgresql://postgres:your_password@db.jwmsgrodliegekbrhvgt.supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Service URLs (for production deployment)
PROFILE_SERVICE_URL=http://localhost:8006
RESUME_ANALYZER_URL=http://localhost:8003
COURSE_SERVICE_URL=http://localhost:8007
DSA_SERVICE_URL=http://localhost:8004

# Optional: Gemini API (fallback for resume analysis)
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Configuration (for DSA Service)
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=studymate_dsa
"""
        
        with open(env_file, 'w') as f:
            f.write(env_content)
        
        self.print_success("Environment file created")
        self.print_warning("IMPORTANT: Edit .env with your actual API keys!")
    
    def create_service_runners(self):
        """Create individual service runner scripts"""
        self.print_step(5, "Creating Service Runner Scripts")
        
        scripts_dir = self.backend_dir / "scripts"
        scripts_dir.mkdir(exist_ok=True)
        
        # Get python executable path
        if self.is_windows:
            python_exe = self.venv_dir / "Scripts" / "python.exe"
            script_ext = ".bat"
        else:
            python_exe = self.venv_dir / "bin" / "python"
            script_ext = ".sh"
        
        services = {
            "api_gateway": {
                "port": 8000,
                "file": "api-gateway/main.py",
                "name": "API Gateway"
            },
            "profile_service": {
                "port": 8006, 
                "file": "agents/profile-service/main.py",
                "name": "Profile Service"
            },
            "resume_analyzer": {
                "port": 8003,
                "file": "agents/resume-analyzer/main.py", 
                "name": "Resume Analyzer"
            },
            "course_service": {
                "port": 8007,
                "file": "agents/course-service/main.py",
                "name": "Course Service"
            },
            "dsa_service": {
                "port": 8004,
                "file": "agents/dsa-service/main.py",
                "name": "DSA Service"
            }
        }
        
        # Create individual service scripts
        for service_key, config in services.items():
            if self.is_windows:
                script_content = f"""@echo off
echo 🚀 Starting {config['name']} on port {config['port']}...
cd /d "{self.backend_dir}"
"{python_exe}" {config['file']}
pause
"""
            else:
                script_content = f"""#!/bin/bash
echo "🚀 Starting {config['name']} on port {config['port']}..."
cd "{self.backend_dir}"
"{python_exe}" {config['file']}
"""
            
            script_file = scripts_dir / f"start_{service_key}{script_ext}"
            with open(script_file, 'w') as f:
                f.write(script_content)
            
            if not self.is_windows:
                os.chmod(script_file, 0o755)
        
        # Create start-all script
        if self.is_windows:
            start_all_content = f"""@echo off
echo 🚀 Starting All StudyMate Services...
echo =====================================

echo Starting Profile Service...
start "Profile Service" "{scripts_dir / 'start_profile_service.bat'}"
timeout /t 3 /nobreak >nul

echo Starting Resume Analyzer...
start "Resume Analyzer" "{scripts_dir / 'start_resume_analyzer.bat'}"
timeout /t 3 /nobreak >nul

echo Starting API Gateway...
start "API Gateway" "{scripts_dir / 'start_api_gateway.bat'}"
timeout /t 3 /nobreak >nul

echo.
echo ✅ All services started!
echo.
echo Service URLs:
echo - API Gateway: http://localhost:8000
echo - Profile Service: http://localhost:8006  
echo - Resume Analyzer: http://localhost:8003
echo.
echo Press any key to continue...
pause
"""
        else:
            start_all_content = f"""#!/bin/bash
echo "🚀 Starting All StudyMate Services..."
echo "====================================="

echo "Starting Profile Service..."
gnome-terminal -- bash -c "cd '{self.backend_dir}' && '{python_exe}' agents/profile-service/main.py; exec bash"
sleep 2

echo "Starting Resume Analyzer..."
gnome-terminal -- bash -c "cd '{self.backend_dir}' && '{python_exe}' agents/resume-analyzer/main.py; exec bash"
sleep 2

echo "Starting API Gateway..."
gnome-terminal -- bash -c "cd '{self.backend_dir}' && '{python_exe}' api-gateway/main.py; exec bash"

echo "✅ All services started!"
echo ""
echo "Service URLs:"
echo "- API Gateway: http://localhost:8000"
echo "- Profile Service: http://localhost:8006"
echo "- Resume Analyzer: http://localhost:8003"
"""
        
        start_all_file = scripts_dir / f"start_all_services{script_ext}"
        with open(start_all_file, 'w') as f:
            f.write(start_all_content)
        
        if not self.is_windows:
            os.chmod(start_all_file, 0o755)
        
        self.print_success("Service runner scripts created")
    
    def create_test_script(self):
        """Create comprehensive test script"""
        self.print_step(6, "Creating Test Script")
        
        test_content = '''#!/usr/bin/env python3
"""
StudyMate Backend Test Suite
Tests resume upload and profile auto-filling functionality
"""

import requests
import json
import time
from pathlib import Path

def test_resume_upload_and_profile_fill():
    """Test the complete resume upload -> profile filling workflow"""
    print("🧪 Testing Resume Upload and Profile Auto-Fill")
    print("=" * 50)
    
    # Test data
    USER_ID = "test-user-12345"
    API_BASE = "http://localhost:8000"
    PROFILE_SERVICE = "http://localhost:8006"
    
    # Create test resume content
    test_resume = """
JANE SMITH
Senior Software Engineer

Contact Information:
Email: jane.smith@email.com
Phone: (555) 987-6543
Location: New York, NY
LinkedIn: https://linkedin.com/in/janesmith
GitHub: https://github.com/janesmith

Professional Summary:
Experienced full-stack developer with 7+ years in React, Node.js, and AWS cloud services.

Work Experience:
Senior Software Engineer at TechCorp Inc
March 2021 - Present
- Led development of microservices architecture
- Built React applications serving 1M+ users
- Implemented CI/CD pipelines with Docker and AWS
Technologies: React, Node.js, AWS, Docker, PostgreSQL

Software Developer at StartupXYZ
June 2019 - February 2021  
- Developed responsive web applications
- Integrated third-party APIs and payment systems
Technologies: JavaScript, React, Express, MongoDB

Education:
Master of Science in Computer Science
MIT, Cambridge, MA
2017 - 2019
GPA: 3.9

Bachelor of Science in Software Engineering  
Stanford University, Stanford, CA
2013 - 2017
GPA: 3.8

Projects:
E-Commerce Platform
Full-stack e-commerce solution with React frontend and Node.js backend
Technologies: React, Node.js, MongoDB, Stripe API
GitHub: https://github.com/janesmith/ecommerce-platform

Real-Time Chat Application
WebSocket-based chat application with real-time messaging
Technologies: React, Socket.io, Express, Redis
GitHub: https://github.com/janesmith/chat-app

Skills:
Programming Languages: JavaScript, Python, TypeScript, Java
Frontend: React, Vue.js, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express, Django, FastAPI
Databases: PostgreSQL, MongoDB, Redis
Cloud: AWS, Docker, Kubernetes
Tools: Git, Jenkins, Jira

Certifications:
AWS Certified Solutions Architect
Issued: 2022
Credential ID: AWS-SAA-789012

Google Cloud Professional Developer
Issued: 2021
Credential ID: GCP-PD-345678
"""
    
    # Create temporary resume file
    resume_file = Path("test_resume.txt")
    with open(resume_file, 'w') as f:
        f.write(test_resume)
    
    try:
        # Step 1: Test service health
        print("\\n1. 🔍 Checking service health...")
        health_response = requests.get(f"{PROFILE_SERVICE}/health", timeout=5)
        if health_response.status_code == 200:
            print("✅ Profile Service is healthy")
        else:
            print("❌ Profile Service is not healthy")
            return False
        
        # Step 2: Upload resume for extraction
        print("\\n2. 📤 Uploading resume for extraction...")
        with open(resume_file, 'rb') as f:
            files = {'resume': ('test_resume.txt', f, 'text/plain')}
            data = {'user_id': USER_ID}
            
            extraction_response = requests.post(
                f"{PROFILE_SERVICE}/extract-profile",
                files=files,
                data=data,
                timeout=30
            )
        
        if extraction_response.status_code == 200:
            extraction_data = extraction_response.json()
            print(f"✅ Resume extraction successful!")
            print(f"📊 Confidence Score: {extraction_data.get('confidence_score', 0)}%")
            
            # Display extracted data
            extracted = extraction_data.get('extracted_data', {})
            personal_info = extracted.get('personalInfo', {})
            
            print(f"👤 Name: {personal_info.get('fullName', 'Not found')}")
            print(f"📧 Email: {personal_info.get('email', 'Not found')}")
            print(f"📱 Phone: {personal_info.get('phone', 'Not found')}")
            print(f"🎯 Skills: {len(extracted.get('skills', []))}")
            print(f"💼 Experience: {len(extracted.get('experience', []))}")
            print(f"🎓 Education: {len(extracted.get('education', []))}")
            
        else:
            print(f"❌ Resume extraction failed: {extraction_response.status_code}")
            print(f"Error: {extraction_response.text}")
            return False
        
        # Step 3: Check if profile was auto-filled
        print("\\n3. 👤 Checking auto-filled profile...")
        time.sleep(2)  # Wait for processing
        
        profile_response = requests.get(f"{PROFILE_SERVICE}/profile/{USER_ID}", timeout=10)
        
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
            print("✅ Profile retrieved successfully!")
            
            # Check if profile was filled from resume
            if profile_data.get('full_name'):
                print(f"✅ Profile auto-filled from resume!")
                print(f"👤 Name: {profile_data.get('full_name')}")
                print(f"📧 Email: {profile_data.get('email')}")
                print(f"📊 Completion: {profile_data.get('completion_percentage', 0)}%")
                
                return True
            else:
                print("⚠️ Profile exists but wasn't auto-filled from resume")
                return False
        else:
            print(f"❌ Failed to retrieve profile: {profile_response.status_code}")
            return False
    
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False
    
    finally:
        # Cleanup
        if resume_file.exists():
            resume_file.unlink()

def main():
    print("🧪 StudyMate Backend Test Suite")
    print("=" * 50)
    
    # Test the main workflow
    success = test_resume_upload_and_profile_fill()
    
    print("\\n" + "=" * 50)
    if success:
        print("🎉 All tests passed! Resume upload and profile auto-fill working correctly.")
    else:
        print("⚠️ Tests failed. Check the error messages above.")
        print("\\nTroubleshooting:")
        print("1. Make sure all services are running")
        print("2. Check .env file has correct API keys")
        print("3. Verify Groq API key is valid")

if __name__ == "__main__":
    main()
'''
        
        test_file = self.backend_dir / "test_complete_workflow.py"
        with open(test_file, 'w') as f:
            f.write(test_content)
        
        self.print_success("Test script created")
    
    def verify_setup(self):
        """Verify the setup is working"""
        self.print_step(7, "Verifying Setup")
        
        # Check virtual environment
        if not self.venv_dir.exists():
            self.print_error("Virtual environment not found")
            return False
        
        # Check .env file
        env_file = self.backend_dir / ".env"
        if not env_file.exists():
            self.print_error(".env file not found")
            return False
        
        # Test import of key packages
        if self.is_windows:
            python_exe = self.venv_dir / "Scripts" / "python.exe"
        else:
            python_exe = self.venv_dir / "bin" / "python"
        
        try:
            subprocess.run([
                str(python_exe), "-c", 
                "import fastapi, uvicorn, groq, asyncpg, supabase; print('✅ All packages importable')"
            ], check=True, capture_output=True, text=True)
            
            self.print_success("Setup verification successful")
            return True
            
        except subprocess.CalledProcessError as e:
            self.print_error(f"Package import test failed: {e}")
            return False
    
    def print_instructions(self):
        """Print final instructions"""
        self.print_step(8, "Setup Complete!")
        
        print("🎉 StudyMate Backend setup completed successfully!")
        print("\\n📋 Next Steps:")
        print("\\n1. 🔑 Configure API Keys:")
        print("   Edit .env file with your actual keys:")
        print("   - Groq API Key: https://groq.com/")
        print("   - Supabase credentials from your project")
        
        print("\\n2. 🚀 Start Services:")
        if self.is_windows:
            print("   - All services: scripts\\start_all_services.bat")
            print("   - Profile only: scripts\\start_profile_service.bat")
            print("   - Resume analyzer: scripts\\start_resume_analyzer.bat")
            print("   - API Gateway: scripts\\start_api_gateway.bat")
        else:
            print("   - All services: ./scripts/start_all_services.sh")
            print("   - Profile only: ./scripts/start_profile_service.sh")
            print("   - Resume analyzer: ./scripts/start_resume_analyzer.sh")
            print("   - API Gateway: ./scripts/start_api_gateway.sh")
        
        print("\\n3. 🧪 Test Resume Upload & Profile Auto-Fill:")
        if self.is_windows:
            python_exe = self.venv_dir / "Scripts" / "python.exe"
        else:
            python_exe = self.venv_dir / "bin" / "python"
        print(f"   {python_exe} test_complete_workflow.py")
        
        print("\\n4. 📖 Access Documentation:")
        print("   - API Gateway: http://localhost:8000/docs")
        print("   - Profile Service: http://localhost:8006/docs")
        print("   - Resume Analyzer: http://localhost:8003/docs")
        
        print("\\n5. ✨ Key Features Available:")
        print("   - 📄 Resume upload (.pdf, .docx, .txt)")
        print("   - 🧠 AI-powered profile extraction")
        print("   - 👤 Automatic profile filling")
        print("   - 📊 Confidence scoring")
        print("   - 🔄 Real-time processing")
    
    def run_setup(self):
        """Run the complete setup process"""
        try:
            self.check_python_version()
            self.setup_virtual_environment()
            self.install_dependencies()
            self.create_environment_file()
            self.create_service_runners()
            self.create_test_script()
            
            if self.verify_setup():
                self.print_instructions()
            else:
                self.print_error("Setup verification failed")
                sys.exit(1)
                
        except KeyboardInterrupt:
            print("\\n\\n⚠️ Setup interrupted by user")
            sys.exit(1)
        except Exception as e:
            self.print_error(f"Unexpected error: {e}")
            sys.exit(1)

def main():
    setup = BackendSetup()
    setup.run_setup()

if __name__ == "__main__":
    main()