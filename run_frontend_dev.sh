#!/bin/bash
# This script starts the frontend on port 3000

cd client
echo "Starting frontend development server on port 3000..."
echo "Frontend will be available at http://localhost:3000"
npx vite --port 3000 --host