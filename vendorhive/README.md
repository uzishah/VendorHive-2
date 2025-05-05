# VendorHive - Service Marketplace

VendorHive is a robust MERN stack application that provides a marketplace connecting service providers (vendors) with customers. The platform enables vendors to manage their profiles, services, and bookings, while customers can browse services, view vendor profiles, and book services.

## Features

- Authentication system for vendors and users with role-based access
- Vendor profiles and service listings
- Service browsing with filtering and sorting capabilities 
- Booking management system
- Review system for services
- Image upload using Cloudinary
- Payment flow (integrated with Stripe)

## Project Structure

The project is organized into three main directories:

- `/frontend` - React-based web client
- `/backend` - Express.js API server
- `/shared` - Common types and utilities shared between frontend and backend

## Quick Start

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables (see .env.example)
4. Start development servers:
   ```
   npm run dev
   ```

## Technology Stack

- **Frontend**: React.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js, MongoDB
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **Payment Processing**: Stripe (in progress)