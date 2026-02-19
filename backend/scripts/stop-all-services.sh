#!/bin/bash

echo "🛑 Stopping All StudyMate Backend Services..."
echo "============================================"

# Function to stop processes by pattern
stop_service() {
    local pattern="$1"
    local service_name="$2"
    
    echo "🔍 Looking for $service_name processes..."
    
    # Find and kill processes
    pids=$(pgrep -f "$pattern")
    
    if [ -n "$pids" ]; then
        echo "📡 Stopping $service_name (PIDs: $pids)..."
        echo "$pids" | xargs kill -TERM
        sleep 2
        
        # Force kill if still running
        remaining_pids=$(pgrep -f "$pattern")
        if [ -n "$remaining_pids" ]; then
            echo "🔨 Force killing $service_name (PIDs: $remaining_pids)..."
            echo "$remaining_pids" | xargs kill -KILL
        fi
        
        echo "✅ $service_name stopped"
    else
        echo "ℹ️  No $service_name processes found"
    fi
}

# Stop each service
stop_service "python.*api-gateway.*main.py" "API Gateway"
stop_service "python.*profile-service.*main.py" "Profile Service"  
stop_service "python.*resume-analyzer.*main.py" "Resume Analyzer"
stop_service "python.*dsa-service.*main.py" "DSA Service"

# General cleanup for any Python main.py processes in backend
stop_service "python.*main.py" "Remaining Backend Services"

echo ""
echo "🎉 All StudyMate backend services stopped!"
echo ""
echo "To verify all processes are stopped:"
echo "ps aux | grep 'python.*main.py'"
echo ""
echo "To start services again:"
echo "./scripts/start-all-services.sh"
echo "============================================"