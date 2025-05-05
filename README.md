# VendorHive - Service Marketplace

VendorHive is a robust MERN stack application that provides a marketplace connecting service providers (vendors) with customers. The platform enables vendors to create profiles, list their services, and manage bookings, while customers can browse services, view vendor profiles, and book services.

## Features

- **User & Vendor Authentication**: Secure JWT-based authentication with role-based access control
- **Vendor Profiles**: Detailed profiles with business information, services, and ratings
- **Service Listings**: Browse, filter, and search for services
- **Booking System**: Seamless booking process for services with confirmation
- **Reviews & Ratings**: Leave and view reviews for vendors and services
- **Image Upload**: Cloudinary integration for profile and service images
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Project Structure

The project has both a current structure and a planned structure:

### Current Structure (Active)
- `/client` - React frontend
- `/server` - Express backend
- `/shared` - Common types and utilities

### New Structure (In Progress)
- `/vendorhive/frontend` - React frontend
- `/vendorhive/backend` - Express backend  
- `/vendorhive/shared` - Common types and utilities

## Technology Stack

- **Frontend**: React.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **Deployment**: Replit

## Running the Application

The application is started via the "Start application" workflow, which runs:

```
npm run dev
```

This starts both the Express backend server and the Vite development server for the frontend.

## Future Enhancements

- Stripe payment integration for processing service payments
- Enhanced search and filtering capabilities
- Service categorization and tagging
- Notifications system
- Admin dashboard for platform management