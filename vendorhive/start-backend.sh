#!/bin/bash
# Script to run the backend server independently

# Make the script exit if any command fails
set -e

echo "Starting VendorHive Backend API Server..."

# Change to the backend directory
cd backend

# Make sure all dependencies are installed
echo "Installing dependencies..."
npm install

# Start the backend server on port 4000
echo "Starting backend server on port 4000..."
NODE_ENV=development BACKEND_PORT=4000 tsx src/index.ts