#!/bin/bash
# This script starts the frontend on a specific port

# Kill any process running on port 3000
echo "Checking for processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Change to the client directory
cd client

# Start the Vite development server
echo "Starting frontend on port 3000..."
exec npx vite --port 3000 --host