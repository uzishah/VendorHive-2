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

echo "Starting VendorHive application in separated mode..."

# Now we always run in separated mode with CORS
echo "Backend API server running on port 5000"
echo "Frontend will be available at http://localhost:3000"

echo "Starting backend API server..."
./run_api.sh &
BACKEND_PID=$!

echo "Starting frontend application..."
./run_frontend.sh &
FRONTEND_PID=$!

# Wait for both processes to finish or be terminated
wait $BACKEND_PID $FRONTEND_PID