#!/bin/bash

echo "🚀 Starting StudyMate Resume Analyzer Service..."
echo "=============================================="

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_DIR="$BACKEND_DIR/agents/resume-analyzer"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "$BACKEND_DIR/venv" ]; then
    echo "⚠️  Virtual environment not found. Creating one..."
    cd "$BACKEND_DIR"
    python3 -m venv venv
    echo "✅ Virtual environment created."
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source "$BACKEND_DIR/venv/bin/activate"

# Install requirements if needed
if [ ! -f "$BACKEND_DIR/venv/pyvenv.cfg" ] || [ "$BACKEND_DIR/requirements.txt" -nt "$BACKEND_DIR/venv/pyvenv.cfg" ]; then
    echo "📥 Installing dependencies..."
    pip install -r "$BACKEND_DIR/requirements.txt"
fi

# Check if .env file exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "⚠️  .env file not found. Please create one based on .env.example"
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        echo "💡 You can copy .env.example to .env and edit it:"
        echo "   cp $BACKEND_DIR/.env.example $BACKEND_DIR/.env"
    fi
    exit 1
fi

# Change to service directory
cd "$SERVICE_DIR"

# Load environment variables
export $(grep -v '^#' "$BACKEND_DIR/.env" | xargs)

# Check if port is available
if lsof -i :8003 &>/dev/null; then
    echo "⚠️  Port 8003 is already in use. Stopping existing service..."
    pkill -f "resume-analyzer" || true
    sleep 2
fi

echo "🏃 Starting Resume Analyzer Service on port 8003..."
echo "📋 Service will be available at: http://localhost:8003"
echo "📖 API Documentation: http://localhost:8003/docs"
echo "❤️  Health Check: http://localhost:8003/health"
echo ""
echo "Press Ctrl+C to stop the service"
echo "=============================================="

# Start the service
python3 main.py