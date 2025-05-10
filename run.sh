#!/bin/bash

# This is a simple script to run development server for both frontend and backend
# This script is for development and testing purposes only

# Set NODE_ENV to development
export NODE_ENV=development

# Run the current workflow
# This keeps the current setup working while we transition to the new structure
echo "Starting server using current structure..."
echo "The app is available at port 5000"
npm run dev

# Note: When ready to switch to the new structure, uncomment the following lines
# and comment out the "npm run dev" line above
# echo "Starting backend server..."
# cd backend && NODE_ENV=development tsx src/index.ts &
# BACKEND_PID=$!
# 
# echo "Starting frontend development server..."
# cd frontend && npm run dev &
# FRONTEND_PID=$!
# 
# function cleanup {
#   echo "Stopping servers..."
#   kill $BACKEND_PID
#   kill $FRONTEND_PID
#   exit 0
# }
# 
# trap cleanup SIGINT
# wait