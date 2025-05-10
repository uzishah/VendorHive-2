#!/bin/bash
# This script runs the frontend application in development mode

# Change to the frontend directory
cd frontend

# Make sure we have the necessary dependencies
echo "Installing frontend dependencies..."
npm install

# Start the frontend application in development mode
echo "Starting frontend application..."
npm run dev