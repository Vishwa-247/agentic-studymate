#!/usr/bin/env python3
"""
StudyMate Backend Setup Script
Automates the setup process for development environment
"""

import os
import shutil
import subprocess
import sys
import venv
from pathlib import Path


def print_step(step_number, description):
    """Print a formatted step"""
    print(f"\n{'='*50}")
    print(f"STEP {step_number}: {description}")
    print(f"{'='*50}")

def check_python_version():
    """Check if Python version is compatible"""
    print_step(1, "Checking Python version")
    
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ is required")
        print(f"Current version: {version.major}.{version.minor}.{version.micro}")
        sys.exit(1)
    
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")

def setup_virtual_environment():
    """Create and setup virtual environment"""
    print_step(2, "Setting up virtual environment")
    
    backend_dir = Path(__file__).parent.parent
    venv_dir = backend_dir / "venv"
    
    if venv_dir.exists():
        print("⚠️ Virtual environment already exists")
        response = input("Do you want to recreate it? (y/N): ")
        if response.lower() == 'y':
            print("🗑️ Removing existing virtual environment...")
            shutil.rmtree(venv_dir)
        else:
            print("✅ Using existing virtual environment")
            return venv_dir
    
    print("📦 Creating virtual environment...")
    venv.create(venv_dir, with_pip=True)
    
    print("✅ Virtual environment created successfully")
    return venv_dir

def install_dependencies(venv_dir):
    """Install Python dependencies"""
    print_step(3, "Installing dependencies")
    
    backend_dir = Path(__file__).parent.parent
    requirements_file = backend_dir / "requirements.txt"
    
    if not requirements_file.exists():
        print("❌ requirements.txt not found")
        sys.exit(1)
    
    # Determine pip executable path
    if sys.platform == "win32":
        pip_exe = venv_dir / "Scripts" / "pip.exe"
    else:
        pip_exe = venv_dir / "bin" / "pip"
    
    print(f"📥 Installing packages from {requirements_file}")
    
    try:
        subprocess.run([
            str(pip_exe), "install", "-r", str(requirements_file)
        ], check=True, capture_output=True, text=True)
        
        print("✅ Dependencies installed successfully")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        print("Error output:", e.stderr)
        sys.exit(1)

def setup_environment_file():
    """Setup environment configuration file"""
    print_step(4, "Setting up environment configuration")
    
    backend_dir = Path(__file__).parent.parent
    env_file = backend_dir / ".env"
    env_example = backend_dir / ".env.example"
    
    if env_file.exists():
        print("✅ .env file already exists")
        return
    
    if env_example.exists():
        print("📋 Copying .env.example to .env")
        shutil.copy2(env_example, env_file)
        print("✅ Environment file created")
        print("⚠️ IMPORTANT: Please edit .env file with your actual API keys and credentials")
    else:
        print("⚠️ .env.example not found, creating basic .env template")
        
        env_content = """# StudyMate Backend Environment Configuration

# Groq AI Configuration (Required)
GROQ_API_KEY=your_groq_api_key_here

# Supabase Configuration (Required) 
SUPABASE_URL=https://jwmsgrodliegekbrhvgt.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Database Configuration (Supabase PostgreSQL)
SUPABASE_DB_URL=postgresql://postgres:[password]@db.jwmsgrodliegekbrhvgt.supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
"""
        
        with open(env_file, 'w') as f:
            f.write(env_content)
        
        print("✅ Basic .env file created")
        print("⚠️ IMPORTANT: Please edit .env file with your actual values")

def verify_setup():
    """Verify the setup is working"""
    print_step(5, "Verifying setup")
    
    backend_dir = Path(__file__).parent.parent
    venv_dir = backend_dir / "venv"
    
    # Check virtual environment
    if not venv_dir.exists():
        print("❌ Virtual environment not found")
        return False
    
    # Check .env file
    env_file = backend_dir / ".env"
    if not env_file.exists():
        print("❌ .env file not found")
        return False
    
    # Test import of required modules
    if sys.platform == "win32":
        python_exe = venv_dir / "Scripts" / "python.exe"
    else:
        python_exe = venv_dir / "bin" / "python"
    
    try:
        subprocess.run([
            str(python_exe), "-c", 
            "import fastapi, uvicorn, groq, asyncpg, supabase; print('✅ All required packages are importable')"
        ], check=True, capture_output=True, text=True)
        
        print("✅ Setup verification successful")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Package import test failed: {e}")
        return False

def print_next_steps():
    """Print next steps for the user"""
    print_step(6, "Next Steps")
    
    print("🎉 Setup completed successfully!")
    print("\nTo start using the backend:")
    print("1. 📝 Edit the .env file with your actual API keys:")
    print("   - Get Groq API key from: https://groq.com/")
    print("   - Get Supabase credentials from your project dashboard")
    
    print("\n2. 🚀 Start the Profile Service:")
    if sys.platform == "win32":
        print("   scripts\\start-profile-service.bat")
    else:
        print("   ./scripts/start-profile-service.sh")
    
    print("\n3. 🧪 Test the service:")
    print("   python test_service.py")
    
    print("\n4. 📖 Access API documentation:")
    print("   http://localhost:8006/docs")
    
    print("\n5. ❤️ Check service health:")
    print("   http://localhost:8006/health")
    
    print("\n📚 For more details, see: README.md")

def main():
    """Main setup function"""
    print("🚀 StudyMate Backend Setup")
    print("This script will set up your development environment")
    
    try:
        check_python_version()
        venv_dir = setup_virtual_environment()
        install_dependencies(venv_dir)
        setup_environment_file()
        
        if verify_setup():
            print_next_steps()
        else:
            print("\n❌ Setup verification failed. Please check the errors above.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️ Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error during setup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
