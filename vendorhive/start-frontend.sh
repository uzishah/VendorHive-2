#!/bin/bash
# Script to run the frontend server independently

# Make the script exit if any command fails
set -e

echo "Starting VendorHive Frontend Server..."

# Change to the frontend directory
cd frontend

# Make sure all dependencies are installed
echo "Installing dependencies..."
npm install

# Start the frontend server on port 3000
echo "Starting frontend server on port 3000..."
npm run dev