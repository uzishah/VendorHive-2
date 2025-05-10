import app, { allowedOrigins } from './app';
import { connectMongoose } from './config/database';
import { Server } from 'http';
import { registerRoutes } from './routes';

// Using a different port for the backend API
const BACKEND_PORT = process.env.BACKEND_PORT || 4000;

(async () => {
  // Connect to MongoDB (required)
  try {
    await connectMongoose();
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error}`);
    process.exit(1); // Exit if MongoDB connection fails
  }

  // Create HTTP server
  const server = new Server(app);
  
  // Register API routes
  await registerRoutes(app);

  // Start the server - API only, no Vite integration
  server.listen({
    port: BACKEND_PORT,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`Backend API server running on http://localhost:${BACKEND_PORT}`);
    console.log('CORS enabled for frontend origins: ', allowedOrigins.join(', '));
  });
})().catch(err => {
  console.error('Server startup error:', err);
  process.exit(1);
});