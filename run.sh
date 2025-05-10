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
if [ "$1" == "separate" ]; then
  # Run backend and frontend in separate terminals with CORS
  echo "Starting in separate mode (backend on port 4000, frontend on port 3000)..."
  echo "Backend API will be available at http://localhost:4000/api"
  echo "Frontend will be available at http://localhost:3000"
  
  echo "Starting backend server..."
  ./run_backend.sh &
  BACKEND_PID=$!
  
  echo "Starting frontend application..."
  ./run_frontend.sh &
  FRONTEND_PID=$!
  
  wait $BACKEND_PID $FRONTEND_PID
elif [ "$1" == "backend-only" ]; then
  # Run only the backend
  echo "Starting backend-only mode on port 4000..."
  ./run_backend.sh
elif [ "$1" == "frontend-only" ]; then
  # Run only the frontend
  echo "Starting frontend-only mode on port 3000..."
  ./run_frontend.sh
else
  # Run in combined mode using the main server/index.ts entry point
  echo "Starting application in combined mode (default)..."
  echo "Application will be available at http://localhost:5000"
  NODE_ENV=development tsx server/index.ts
fi

# Wait for all background processes
wait