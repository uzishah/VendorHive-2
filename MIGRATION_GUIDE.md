# VendorHive Migration Guide

This document outlines the steps taken to restructure the VendorHive codebase from a monolithic structure to a more modular architecture with clear separation between frontend and backend components.

## Completed Tasks

### Directory Structure
- Created dedicated `backend/` and `frontend/` directories with their respective package.json files
- Moved and refactored code from the root `server/` and `client/` directories
- Created execution scripts (`run.sh`, `run_backend.sh`, `run_frontend.sh`) to make development easier

### Backend Restructuring
- Created individual model files in `backend/src/models/` for each entity:
  - `User.ts`
  - `Vendor.ts`
  - `Service.ts`
  - `Booking.ts`
  - `Review.ts`
- Created `models/index.ts` to export all models for easier importing
- Separated database configuration into `config/database.ts`
- Restructured the main application entry point into `app.ts` and `index.ts`
- Added CORS support for running backend separately from frontend
- Updated backend to run on port 4000 when in separate mode

### Code Organization
- Each model now contains:
  - Mongoose schema definition
  - TypeScript interface
  - Zod validation schema
  - Export of the Mongoose model

## Next Steps

### Backend
- [ ] Copy and adapt `server/routes.ts` to use the new model structure
- [ ] Copy and adapt `server/storage.ts` to use the new model structure
- [ ] Copy and adapt authentication functionality
- [ ] Test database connections and CRUD operations with new models

### Frontend
- [x] Created API service in `frontend/src/services/api.ts` to connect to backend API
- [x] Configured Vite server to run on port 3000 for the frontend
- [ ] Copy React components from `client` to `frontend` 
- [ ] Test all frontend functionality against the new backend

### Integration
- [ ] Update workflow configuration to use the new structure
- [ ] Create comprehensive tests for the new structure
- [ ] Switch gradually from the old structure to the new one to ensure smooth transition

## How to Test the New Structure

To test the new backend structure (runs on port 4000):
```bash
# Run the backend server separately
./run.sh backend-only
```

To test the new frontend structure (runs on port 3000):
```bash
# Run the frontend application separately
./run.sh frontend-only
```

To run both in combined mode (original structure, port 5000):
```bash
# Run in combined mode (uses current server/index.ts)
./run.sh
```

To run both in separate mode (backend on port 4000, frontend on port 3000):
```bash
# Run backend and frontend as separate processes with CORS enabled
./run.sh separate
```

## Troubleshooting

If you encounter issues with the restructured codebase:

1. Check the console logs for error messages
2. Verify that all dependencies are correctly installed in both frontend and backend directories
3. Ensure that environment variables (including database connection strings) are available
4. Compare the model structures with the original schemas to identify any discrepancies