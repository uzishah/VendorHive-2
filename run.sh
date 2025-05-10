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

# Check if we need to run in combined mode or separate mode
if [ "$1" == "separate" ]; then
  # Run backend and frontend in separate terminals
  echo "Starting backend server..."
  ./run_backend.sh &
  BACKEND_PID=$!
  
  echo "Starting frontend application..."
  ./run_frontend.sh &
  FRONTEND_PID=$!
  
  wait $BACKEND_PID $FRONTEND_PID
else
  # Run in combined mode using the main server/index.ts entry point
  echo "Starting application in combined mode..."
  NODE_ENV=development tsx server/index.ts
fi

# Wait for all background processes
wait