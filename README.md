# VendorHive

A marketplace platform for connecting service providers (vendors) with customers.

## Project Structure

This project uses a monorepo-like structure with separate frontend and backend directories:

```
/
├── frontend/              # React frontend application
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   └── vite.config.ts     # Vite configuration
│
├── backend/               # Express.js backend application
│   ├── src/               # Source code
│   ├── package.json       # Backend dependencies
│   └── tsconfig.json      # TypeScript configuration
│
├── shared/                # Shared code between frontend and backend
│   └── schema.ts          # Shared data models and validation schemas
│
└── package.json           # Root package.json for running the entire application
```

## Features

- User authentication with role-based access (users and vendors)
- Vendor profiles and service listings
- Service booking and management
- Review and rating system
- Integrated payment processing (Stripe)

## Technology Stack

- **Frontend**: React.js, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Express.js, TypeScript, MongoDB
- **Authentication**: JWT
- **Payments**: Stripe
- **Image Storage**: Cloudinary

## Development

To run the project in development mode:

```bash
npm run dev
```

This will start both the frontend and backend servers.

## Building for Production

```bash
npm run build
npm start
```

## License

MIT