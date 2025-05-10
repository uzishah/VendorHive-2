# Migration Guide: Moving to the New Project Structure

This guide provides step-by-step instructions for switching from the current project structure to the new separated frontend/backend structure.

## Overview of Changes

We've restructured the project to better separate concerns:

- **From**: Combined structure with `/client`, `/server`, and `/shared` directories
- **To**: Separated structure with `/frontend`, `/backend`, and `/shared` directories

The new structure provides better isolation between frontend and backend code, making it easier to develop, test, and deploy each part independently.

## Migration Steps

### 1. Switching to the New Structure

The project is currently set up to continue working with the original structure while allowing a gradual transition to the new structure.

To start using the new structure:

1. Edit the `run.sh` script to uncomment the new structure section and comment out the current one:

```bash
# Comment out this line:
# npm run dev

# Uncomment these lines:
echo "Starting backend server..."
cd backend && NODE_ENV=development tsx src/index.ts &
BACKEND_PID=$!

echo "Starting frontend development server..."
cd frontend && npm run dev &
FRONTEND_PID=$!

function cleanup {
  echo "Stopping servers..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit 0
}

trap cleanup SIGINT
wait
```

2. Rename the new package.json file to replace the current one:
```bash
mv new-package.json package.json
```

3. Use the run script to start the server in the new structure:
```bash
./run.sh
```

### 2. Updating Workflow Configuration

To properly configure Replit workflows for the new structure:

1. Update the `.replit` configuration to use the new structure (through Replit's UI)
2. Create a new workflow for running the separated backend and frontend

### 3. Fixing Remaining TypeScript Issues

The `TYPESCRIPT_ISSUES.md` file documents known TypeScript issues and how to fix them.

### 4. Removing Old Structure Files

Once the new structure is confirmed working correctly, you can remove the old structure files:

```bash
# Be careful with this step! Make sure the new structure is working first
rm -rf client/ server/
```

## Code Updates

Most of the code updates have already been made, including:

1. Updated import paths in the frontend and backend
2. Created proper package.json files for each section
3. Updated TypeScript configurations
4. Fixed critical type issues

## Testing

After migration, thoroughly test all functionality to ensure it works as expected:

1. User authentication and authorization
2. Vendor registration and profiles
3. Service listing and booking
4. Payment processing
5. Review and rating system

## Conclusion

This migration allows for better organization and separation of concerns in the codebase, making it easier to maintain and expand in the future. If you encounter any issues during migration, consult the codebase and documentation for more details.