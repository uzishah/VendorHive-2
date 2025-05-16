# VendorHive - Separated Mode

This project has been configured to run in two different modes:

## Integrated Mode (Original)
In this mode, the frontend and backend are served from a single server on port 5000.
```bash
npm run dev
```

## Separated Mode (New)
In this mode, the backend API runs on port 5000 and the frontend runs on port 3000. This is useful for development scenarios where you want to simulate a production-like environment with CORS.

```bash
./run_separated.sh
```

This will start:
- The backend API server on http://localhost:5000/api
- The frontend application on http://localhost:3000

### Running Services Individually

If you need to run only one of the services:

1. To run only the backend API server:
```bash
./run_api.sh
```

2. To run only the frontend:
```bash
./run_frontend_dev.sh
```

## Implementation Details

### Backend (API Server)
- Express server running on port 5000
- CORS is configured to allow requests from http://localhost:3000
- All API endpoints are available at http://localhost:5000/api/...

### Frontend
- React application running on port 3000
- Uses CORS to communicate with the backend API
- API requests are configured to go to http://localhost:5000/api/...