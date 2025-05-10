import app from './app';
import { connectMongoose } from './config/database';
import { setupVite, serveStatic } from './vite';
import { Server } from 'http';
import { registerRoutes } from './routes';

const PORT = process.env.PORT || 5000;

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

  // Setup Vite for development or static files for production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start the server
  server.listen({
    port: PORT,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`Server running on port ${PORT}`);
  });
})().catch(err => {
  console.error('Server startup error:', err);
  process.exit(1);
});