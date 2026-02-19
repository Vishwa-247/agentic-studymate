# 🚀 StudyMate Backend - Local Development Setup

A microservices-based backend system for StudyMate that runs entirely on your local machine without Docker. Features AI-powered profile building, resume analysis, and comprehensive learning analytics.

## 🏗️ Architecture

### Core Services
- **API Gateway** (Port 8000): Central routing and authentication
- **Profile Service** (Port 8006): User profile management and AI-powered resume extraction
- **Resume Analyzer** (Port 8003): Resume analysis and job matching
- **DSA Service** (Port 8004): Data Structures & Algorithms practice tracking

### Technology Stack
- **Backend**: FastAPI + Python 3.8+
- **Database**: Supabase PostgreSQL
- **AI**: Groq API for resume analysis and profile extraction
- **Authentication**: JWT tokens
- **Storage**: Supabase Storage for file uploads

## ⚡ Quick Start

### 1. Prerequisites
- **Python 3.8+** installed
- **Groq API Key** (get free at [groq.com](https://groq.com/))
- **Supabase Project** with service key

### 2. Environment Setup
```bash
# Clone and navigate to backend
cd backend

# Run automated setup
python scripts/setup.py

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your actual API keys
```

### 3. Start Services
```bash
# Option 1: Start all services at once
./scripts/start-all-services.sh        # Linux/macOS
scripts/start-all-services.bat         # Windows

# Option 2: Start individual services
./scripts/start-profile-service.sh     # Profile Service (Port 8006)
./scripts/start-resume-analyzer.sh     # Resume Analyzer (Port 8003)  
./scripts/start-api-gateway.sh         # API Gateway (Port 8000)
```

### 4. Test the Setup
```bash
# Test service health
curl http://localhost:8000/health       # API Gateway
curl http://localhost:8006/health       # Profile Service
curl http://localhost:8003/health       # Resume Analyzer

# Run comprehensive tests
python test_all_services.py
```

## 🔧 Service Details

### API Gateway (Port 8000)
**Purpose**: Central routing, authentication, and request forwarding
- **Endpoints**: `/auth/*`, `/api/profile/*`, `/resume/*`
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Profile Service (Port 8006) 
**Purpose**: AI-powered profile building and management
- **Key Features**:
  - AI resume extraction using Groq
  - Complete profile CRUD operations
  - Education, experience, projects, skills, certifications
- **Documentation**: http://localhost:8006/docs
- **Health Check**: http://localhost:8006/health

### Resume Analyzer (Port 8003)
**Purpose**: Resume analysis and job matching
- **Key Features**:
  - Resume parsing and analysis
  - Job role matching
  - Skills gap analysis
- **Documentation**: http://localhost:8003/docs
- **Health Check**: http://localhost:8003/health

## 📁 Project Structure

```
backend/
├── agents/
│   ├── profile-service/        # Profile management service
│   │   ├── main.py            # Service entry point
│   │   └── requirements.txt   # Service-specific dependencies
│   ├── resume-analyzer/       # Resume analysis service
│   │   ├── main.py           
│   │   └── requirements.txt
│   └── dsa-service/          # DSA practice tracking
│       ├── main.py
│       └── requirements.txt
├── api-gateway/              # Central API gateway
│   ├── main.py              # Gateway entry point
│   └── requirements.txt
├── shared/                   # Common utilities
│   └── database/
│       └── supabase_connection.py  # Database connection layer
├── scripts/                  # Local development scripts
│   ├── setup.py             # Automated environment setup
│   ├── start-all-services.*  # Start all services
│   ├── start-profile-service.*  # Individual service starters
│   └── ...
├── .env.example             # Environment template
├── requirements.txt         # All dependencies
└── README.md               # This file
```

## 🔑 Environment Variables

### Required Variables (.env file)
```env
# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key_here

# Supabase Configuration  
SUPABASE_URL=https://jwmsgrodliegekbrhvgt.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
SUPABASE_DB_URL=postgresql://postgres:[password]@db.jwmsgrodliegekbrhvgt.supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Service URLs (for production/custom setups)
RESUME_ANALYZER_URL=http://localhost:8003
PROFILE_SERVICE_URL=http://localhost:8006
```

### Getting API Keys
1. **Groq API Key**: 
   - Visit [groq.com](https://groq.com/)
   - Sign up for free account
   - Generate API key from dashboard

2. **Supabase Credentials**:
   - Visit [supabase.com](https://supabase.com/)
   - Create new project or use existing
   - Copy credentials from Settings > API

## 🧪 Testing

### Automated Testing
```bash
# Run comprehensive service tests
python test_all_services.py

# Test individual components
python test_service.py          # Legacy profile service tests
```

### Manual Testing
```bash
# Health checks
curl http://localhost:8000/health
curl http://localhost:8006/health  
curl http://localhost:8003/health

# Test profile extraction
curl -X POST "http://localhost:8006/extract-profile" \
  -F "resume=@sample_resume.pdf" \
  -F "user_id=test-123"

# Test through API Gateway
curl -X POST "http://localhost:8000/api/profile/extract-profile" \
  -H "Authorization: Bearer your_jwt_token" \
  -F "resume=@sample_resume.pdf" \
  -F "user_id=test-123"
```

## 🔍 Development Workflow

### Starting Development
1. **Setup Environment**: Run `python scripts/setup.py`
2. **Configure .env**: Add your API keys
3. **Start Services**: Use `start-all-services.*` scripts
4. **Test Setup**: Run `python test_all_services.py`
5. **Start Frontend**: Navigate to frontend and run your React app

### Making Changes
1. **Code Changes**: Edit service files in `agents/*/main.py`
2. **Restart Service**: Ctrl+C and restart individual service
3. **Test Changes**: Use health endpoints and test scripts
4. **Check Logs**: Services output detailed logs to console

### Stopping Services
```bash
# Stop all services gracefully
./scripts/stop-all-services.sh     # Linux/macOS
scripts/stop-all-services.bat      # Windows

# Or manually
pkill -f "python.*main.py"
```

## 🐛 Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Port already in use | Run stop-all-services script or restart terminal |
| Import errors | Check virtual environment activation and dependencies |
| Database connection errors | Verify Supabase credentials in `.env` |
| Groq API errors | Check API key validity and quota |
| Service not responding | Check if all dependencies are installed |

### Debugging Steps
1. **Check Service Health**: Visit health endpoints
2. **Verify Environment**: Ensure `.env` file exists and is configured
3. **Check Logs**: Service logs show detailed error information
4. **Test Dependencies**: Run `pip list` to verify installations
5. **Port Conflicts**: Use `netstat -tulpn | grep :PORT` to check port usage

## 📈 Performance & Scaling

### Local Development Limits
- **Concurrent Users**: 10-50 (development testing)
- **File Upload Size**: 10MB max per resume
- **Request Timeout**: 60 seconds for AI processing
- **Database Connections**: 10 max per service

## 🔒 Security Notes

### Development Security
- Default JWT secret provided (change for production)
- All services accept connections from localhost only
- CORS configured for common frontend ports (3000, 5173)
- No HTTPS required for local development

## 📚 API Documentation

### Interactive Documentation
- **API Gateway**: http://localhost:8000/docs
- **Profile Service**: http://localhost:8006/docs  
- **Resume Analyzer**: http://localhost:8003/docs

### Key Endpoints

#### Profile Service
- `POST /extract-profile` - Extract profile from resume
- `GET /profile/{user_id}` - Get user profile
- `PUT /profile/{user_id}` - Update user profile

#### Resume Analyzer  
- `POST /analyze-resume` - Analyze resume for job matching
- `GET /analysis/{analysis_id}` - Get analysis results

#### API Gateway
- `POST /auth/signin` - User authentication
- `POST /auth/signup` - User registration
- `GET /health` - Overall system health

## 🚀 Next Steps

1. **Complete Setup**: Run `python scripts/setup.py`
2. **Configure Environment**: Edit `.env` with your API keys
3. **Start All Services**: Run `./scripts/start-all-services.sh`
4. **Test Everything**: Run `python test_all_services.py`
5. **Start Frontend**: Connect your React app to `http://localhost:8000`

---

**Need Help?** 
- Check service logs for detailed error messages
- Test individual services using their health endpoints
- Verify all environment variables are correctly configured
- Run the comprehensive test suite to identify issues

**Happy Coding!** 🎉