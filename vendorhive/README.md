# VendorHive

A comprehensive MERN stack application that provides a robust authentication system for vendors and users, with role-based access and dynamic routing. The platform focuses on creating a seamless, secure vendor management ecosystem with advanced authentication and collaboration capabilities.

## Project Structure

```
vendorhive/
├── backend/          # Express.js backend
│   ├── src/
│   └── package.json
├── frontend/         # React.js frontend
│   ├── src/
│   └── package.json
├── shared/           # Shared code between frontend and backend
│   └── schema.ts
├── .env              # Environment variables
├── package.json      # Root package.json
├── run.sh            # Script to run both frontend and backend
├── run_backend.sh    # Script to run only backend
└── run_frontend.sh   # Script to run only frontend
```

## Technology Stack

- **Frontend**: React.js with TypeScript, Tailwind CSS, shadcn UI components
- **Backend**: Express.js with TypeScript, MongoDB via Mongoose ORM
- **Authentication**: JWT with Passport.js
- **File Storage**: Cloudinary
- **Payment Processing**: Stripe

## Running the Application

### Development Mode

To run both frontend and backend in development mode:

```
npm run dev
```

This will start:
- Backend server on port 4000
- Frontend development server on port 3000

### CORS Configuration

The application uses CORS for communication between frontend and backend:

- Frontend makes direct HTTP requests to `http://localhost:4000/api/*`
- Backend has CORS configured to accept requests from the frontend domain
- Authentication tokens are passed in the Authorization header
- Cookies are supported with `credentials: 'include'`

This setup allows for true separation of concerns, with frontend and backend operating as independent services.

### Running Individual Components

To run only the frontend:

```
npm run dev:frontend
```

To run only the backend:

```
npm run dev:backend
```

## Building for Production

```
npm run build
```

This builds both frontend and backend for production deployment.

## Deployment

The application can be deployed using:

```
npm run start
```

This starts the backend server which also serves the built frontend files.