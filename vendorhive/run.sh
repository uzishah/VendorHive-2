#!/bin/bash
# This script runs both the frontend and backend applications

# Set up error handling
set -e

# Define a function to handle exit
cleanup() {
  echo "Stopping all processes..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}

# Set trap for signals
trap cleanup SIGINT SIGTERM

echo "Starting VendorHive application..."

# Check which mode to run in
if [ "$1" == "backend-only" ]; then
  # Run only the backend
  echo "Starting backend-only mode on port 4000..."
  ./start-backend.sh
elif [ "$1" == "frontend-only" ]; then
  # Run only the frontend
  echo "Starting frontend-only mode on port 3000..."
  ./start-frontend.sh
else
  # Default is to run both with CORS communication
  echo "Starting both backend and frontend with CORS communication..."
  echo "Backend API will be available at http://localhost:4000/api"
  echo "Frontend will be available at http://localhost:3000"
  
  echo "Starting backend server..."
  ./start-backend.sh &
  BACKEND_PID=$!
  
  echo "Starting frontend application..."
  ./start-frontend.sh &
  FRONTEND_PID=$!
  
  wait $BACKEND_PID $FRONTEND_PID
fi

# Wait for all background processes
wait