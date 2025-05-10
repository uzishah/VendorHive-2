#!/bin/bash
# This script runs the backend server in development mode

# Change to the backend directory
cd backend

# Make sure we have the necessary dependencies
echo "Installing backend dependencies..."
npm install

# Start the backend server in development mode on port 4000
echo "Starting backend server on port 4000..."
BACKEND_PORT=4000 NODE_ENV=development tsx src/index.ts