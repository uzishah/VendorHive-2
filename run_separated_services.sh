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

# Start API server first (backend)
echo "Starting backend API server on port 5000..."
NODE_ENV=development tsx server/index.ts &
BACKEND_PID=$!

# Give the backend a moment to start
sleep 2

# Start frontend (Vite dev server)
echo "Starting frontend server on port 3000..."
cd client && npx vite --port 3000 --host &
FRONTEND_PID=$!

echo "Both services are now running!"
echo "Press Ctrl+C to stop all services"

# Wait for processes to finish or be terminated
wait $BACKEND_PID $FRONTEND_PID