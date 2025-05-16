#!/bin/bash
# This script runs the frontend and backend as separate services

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

echo "Starting VendorHive with separate frontend and backend..."
echo "---------------------------------------------------------"
echo "Backend API: http://localhost:5000/api"
echo "Frontend: http://localhost:3000"
echo "---------------------------------------------------------"

# Start API server
echo "Starting backend API server on port 5000..."
./run_api.sh &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend server on port 3000..."
./run_frontend_dev.sh &
FRONTEND_PID=$!

echo "Both services are now running!"
echo "Press Ctrl+C to stop all services"

# Wait for processes to finish or be terminated
wait $BACKEND_PID $FRONTEND_PID