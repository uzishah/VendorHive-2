import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePassword, generateToken } from "./auth";
import { authenticateToken, authorizeRole, authorizeVendor } from "./middleware";
import { upload, uploadImage } from "./cloudinary";
import { 
  insertUserSchema, 
  insertVendorSchema, 
  insertServiceSchema, 
  insertBookingSchema, 
  insertReviewSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware
  const handleErrors = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  };

  // Auth routes
  app.post('/api/auth/register', async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // If user is registering as a vendor, create vendor profile
      if (userData.role === 'vendor' && req.body.vendor) {
        const vendorData = insertVendorSchema.parse(req.body.vendor);
        await storage.createVendor({
          ...vendorData,
          userId: user.id
        });
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Return user info (without password) and token
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Return user info (without password) and token
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      next(error);
    }
  });
  
  // User routes
  app.get('/api/users/me', authenticateToken, async (req, res, next) => {
    try {
      // req.user.id from JWT might be numeric or string (MongoDB ObjectId)
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if user is a vendor and get vendor info
      let vendorProfile = null;
      if (user.role === 'vendor') {
        vendorProfile = await storage.getVendorByUserId(user.id);
      }
      
      // Return user info (without password) and vendor profile if applicable
      const { password, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword,
        vendorProfile 
      });
      
      // For debugging
      console.log('User retrieved successfully:', userWithoutPassword.username);
    } catch (error) {
      console.error('Error in /api/users/me endpoint:', error);
      next(error);
    }
  });
  
  app.put('/api/users/me', authenticateToken, async (req, res, next) => {
    try {
      const userData = req.body;
      
      // Don't allow changing email to one that already exists
      if (userData.email) {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
      
      // Don't allow changing username to one that already exists
      if (userData.username) {
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({ message: 'Username already taken' });
        }
      }
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      // Update user
      const updatedUser = await storage.updateUser(req.user.id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return updated user info (without password)
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Vendor routes
  app.get('/api/vendors', async (req, res, next) => {
    try {
      // Support search query
      const { search } = req.query;
      
      let vendors;
      if (search && typeof search === 'string') {
        vendors = await storage.searchVendors(search);
      } else {
        vendors = await storage.getAllVendors();
      }
      
      // Return vendors with user info (without password)
      const vendorsWithUserInfo = vendors.map(vendor => {
        const { password, ...userWithoutPassword } = vendor.user;
        return {
          ...vendor,
          user: userWithoutPassword
        };
      });
      
      res.json(vendorsWithUserInfo);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/vendors/:id', async (req, res, next) => {
    try {
      const vendorId = parseInt(req.params.id);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ message: 'Invalid vendor ID' });
      }
      
      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      
      // Get vendor services
      const services = await storage.getServicesByVendorId(vendorId);
      
      // Get vendor reviews
      const reviews = await storage.getReviewsByVendorId(vendorId);
      
      // Return vendor with user info (without password), services, and reviews
      const { password, ...userWithoutPassword } = vendor.user;
      res.json({
        ...vendor,
        user: userWithoutPassword,
        services,
        reviews
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/vendors/me', authenticateToken, authorizeRole(['vendor']), async (req, res, next) => {
    try {
      const vendorData = req.body;
      
      // Get vendor by user ID
      const vendor = await storage.getVendorByUserId(req.user.id);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor profile not found' });
      }
      
      // Update vendor
      const updatedVendor = await storage.updateVendor(vendor.id, vendorData);
      if (!updatedVendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      
      res.json(updatedVendor);
    } catch (error) {
      next(error);
    }
  });
  
  // Upload image route
  app.post('/api/upload', authenticateToken, upload.single('image'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const imageUrl = await uploadImage(req.file);
      res.status(201).json({ imageUrl });
    } catch (error) {
      next(error);
    }
  });

  // Service routes
  app.post('/api/services', authenticateToken, authorizeRole(['vendor']), async (req, res, next) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      
      // Get vendor by user ID
      const vendor = await storage.getVendorByUserId(req.user.id);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor profile not found' });
      }
      
      // Ensure vendorId matches the authenticated vendor
      if (serviceData.vendorId !== vendor.id) {
        return res.status(403).json({ message: 'You can only create services for your own vendor profile' });
      }
      
      // Create service
      const service = await storage.createService(serviceData);
      
      res.status(201).json(service);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/vendors/:id/services', async (req, res, next) => {
    try {
      const vendorId = parseInt(req.params.id);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ message: 'Invalid vendor ID' });
      }
      
      const services = await storage.getServicesByVendorId(vendorId);
      
      res.json(services);
    } catch (error) {
      next(error);
    }
  });
  
  // Update service route
  app.put('/api/services/:id', authenticateToken, authorizeRole(['vendor']), async (req, res, next) => {
    try {
      const serviceId = parseInt(req.params.id);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: 'Invalid service ID' });
      }
      
      // Get the service
      const service = await storage.getServiceById(serviceId);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      // Get vendor by user ID
      const vendor = await storage.getVendorByUserId(req.user.id);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor profile not found' });
      }
      
      // Ensure vendor owns the service
      if (service.vendorId !== vendor.id) {
        return res.status(403).json({ message: 'You can only update your own services' });
      }
      
      // Update service
      const updatedService = await storage.updateService(serviceId, req.body);
      if (!updatedService) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      res.json(updatedService);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete service route
  app.delete('/api/services/:id', authenticateToken, authorizeRole(['vendor']), async (req, res, next) => {
    try {
      const serviceId = parseInt(req.params.id);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({ message: 'Invalid service ID' });
      }
      
      // Get the service
      const service = await storage.getServiceById(serviceId);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      // Get vendor by user ID
      const vendor = await storage.getVendorByUserId(req.user.id);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor profile not found' });
      }
      
      // Ensure vendor owns the service
      if (service.vendorId !== vendor.id) {
        return res.status(403).json({ message: 'You can only delete your own services' });
      }
      
      // Delete service
      const deleted = await storage.deleteService(serviceId);
      if (!deleted) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });
  
  // Booking routes
  app.post('/api/bookings', authenticateToken, async (req, res, next) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Ensure userId matches the authenticated user
      if (bookingData.userId !== req.user.id) {
        return res.status(403).json({ message: 'You can only create bookings for yourself' });
      }
      
      // Create booking
      const booking = await storage.createBooking(bookingData);
      
      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/bookings/user', authenticateToken, async (req, res, next) => {
    try {
      const bookings = await storage.getBookingsByUserId(req.user.id);
      
      res.json(bookings);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/bookings/vendor', authenticateToken, authorizeRole(['vendor']), async (req, res, next) => {
    try {
      // Get vendor by user ID
      const vendor = await storage.getVendorByUserId(req.user.id);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor profile not found' });
      }
      
      const bookings = await storage.getBookingsByVendorId(vendor.id);
      
      res.json(bookings);
    } catch (error) {
      next(error);
    }
  });
  
  app.put('/api/bookings/:id/status', authenticateToken, async (req, res, next) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: 'Invalid booking ID' });
      }
      
      if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      // Update booking status
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      if (!updatedBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      res.json(updatedBooking);
    } catch (error) {
      next(error);
    }
  });
  
  // Review routes
  app.post('/api/reviews', authenticateToken, async (req, res, next) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      
      // Ensure userId matches the authenticated user
      if (reviewData.userId !== req.user.id) {
        return res.status(403).json({ message: 'You can only create reviews as yourself' });
      }
      
      // Create review
      const review = await storage.createReview(reviewData);
      
      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/vendors/:id/reviews', async (req, res, next) => {
    try {
      const vendorId = parseInt(req.params.id);
      
      if (isNaN(vendorId)) {
        return res.status(400).json({ message: 'Invalid vendor ID' });
      }
      
      const reviews = await storage.getReviewsByVendorId(vendorId);
      
      // Return reviews with user info (without password)
      const reviewsWithUserInfo = reviews.map(review => {
        const { password, ...userWithoutPassword } = review.user;
        return {
          ...review,
          user: userWithoutPassword
        };
      });
      
      res.json(reviewsWithUserInfo);
    } catch (error) {
      next(error);
    }
  });
  
  // Register error handling middleware
  app.use(handleErrors);

  const httpServer = createServer(app);
  return httpServer;
}
