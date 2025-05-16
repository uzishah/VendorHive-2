import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectMongoose } from "./db";
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure CORS for all origins during development
app.use(cors({
  origin: true, // This allows all origins
  credentials: true // Allow cookies and authentication headers
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Force JSON content type for API routes with format=json query parameter
  if (path.startsWith('/api') && req.query.format === 'json') {
    res.setHeader('Content-Type', 'application/json');
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Connect to MongoDB (required)
  try {
    await connectMongoose();
    log("Connected to MongoDB successfully");
  } catch (error) {
    log(`Failed to connect to MongoDB: ${error}`);
    process.exit(1); // Exit if MongoDB connection fails
  }
  
  const server = await registerRoutes(app);
  
  // Add a 404 handler for API routes BEFORE setting up Vite
  app.use('/api/*', (req, res) => {
    res.status(404).json({ 
      message: `API endpoint not found: ${req.originalUrl}`,
      status: 404
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the API on port 5000
  // The frontend will be served separately on port 3000
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`API server running on port ${port}`);
  });
})();
