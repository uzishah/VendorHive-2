import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePassword, generateToken } from "./auth";
import { authenticateToken, authorizeRole, authorizeVendor } from "./middleware";
import { upload, uploadImage } from "./cloudinary";
import { VendorModel, ServiceModel, UserModel } from "./db";
import { 
  userSchema, 
  vendorSchema, 
  serviceSchema, 
  bookingSchema, 
  reviewSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Helper function to safely get the next available vendor ID
async function getNextVendorId(): Promise<number> {
  try {
    const lastVendor = await VendorModel.findOne().sort({ id: -1 });
    let vendorId = 1; // Default start ID
    
    if (lastVendor && lastVendor.id && !isNaN(Number(lastVendor.id))) {
      vendorId = Number(lastVendor.id) + 1;
    }
    
    console.log(`Calculated vendor ID: ${vendorId} (type: ${typeof vendorId})`);
    return vendorId;
  } catch (error) {
    console.error('Error calculating next vendor ID:', error);
    return 1; // Fallback to ID 1 if there's an error
  }
}

// Helper function to safely get the next available service ID
async function getNextServiceId(): Promise<number> {
  try {
    const lastService = await ServiceModel.findOne().sort({ id: -1 });
    let serviceId = 1; // Default start ID
    
    if (lastService && lastService.id && !isNaN(Number(lastService.id))) {
      serviceId = Number(lastService.id) + 1;
    }
    
    console.log(`Calculated service ID: ${serviceId} (type: ${typeof serviceId})`);
    return serviceId;
  } catch (error) {
    console.error('Error calculating next service ID:', error);
    return 1; // Fallback to ID 1 if there's an error
  }
}

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
      console.log('Registration request body:', req.body);
      
      // CRITICAL FIX: Force role to 'vendor' if vendor data is present
      if (req.body.vendor) {
        console.log('VENDOR DATA DETECTED - Setting role to "vendor" regardless of what was sent');
        req.body.role = 'vendor';
      }
      
      // Log the raw role from the request for debugging
      console.log('USER ROLE FROM REQUEST:', {
        rawRole: req.body.role,
        isVendorSelected: req.body.role === 'vendor',
        hasVendorData: !!req.body.vendor
      });
      
      const userData = userSchema.parse(req.body);
      console.log('Parsed user data:', userData);
      
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
      console.log('Created user with role:', user.role);
      
      // If user is registering as a vendor, create vendor profile
      let vendorProfile = null;
      console.log('Checking vendor condition:', {
        isVendorRole: userData.role === 'vendor', 
        hasVendorData: !!req.body.vendor,
        vendorInfo: req.body.vendor
      });
      
      // CRITICAL FIX: Verify role is correctly set to vendor and create vendor profile
      if (userData.role === 'vendor') {
        try {
          // Create default vendor data if missing
          if (!req.body.vendor) {
            console.log('Missing vendor data for vendor role, creating default data');
            req.body.vendor = {
              businessName: user.name + "'s Business",
              category: "General Services",
              description: "A new vendor on VendorHive"
            };
          }
          
          console.log('Creating vendor profile with data:', JSON.stringify(req.body.vendor, null, 2));
          console.log('User ID for vendor creation:', user.id, typeof user.id);
          
          try {
            const vendorData = vendorSchema.parse(req.body.vendor);
            
            // Get the next available vendor ID to ensure it's unique and not null
            const lastVendor = await VendorModel.findOne().sort({ id: -1 });
            const vendorId = lastVendor ? lastVendor.id + 1 : 1;
            
            vendorProfile = await storage.createVendor({
              ...vendorData,
              userId: user.id,
              id: vendorId  // Explicitly set the numeric ID
            });
            
            console.log(`Vendor created successfully with ID: ${vendorId}`);
            console.log('Vendor profile created:', JSON.stringify(vendorProfile, null, 2));
            
            // CRITICAL FIX: Verify user still has vendor role
            if (user.role !== 'vendor') {
              console.log('Ensuring user role is vendor after profile creation');
              const updatedUser = await storage.updateUser(user.id, { role: 'vendor' });
              if (updatedUser) {
                Object.assign(user, updatedUser); // Update the user object in-place
              }
            }
          } catch (parseError) {
            console.error('Error parsing vendor data:', parseError);
            // If validation fails, create a minimal valid vendor profile
            // Get the next available vendor ID to ensure it's unique and not null
            const lastVendor = await VendorModel.findOne().sort({ id: -1 });
            const vendorId = lastVendor ? lastVendor.id + 1 : 1;
            
            vendorProfile = await storage.createVendor({
              businessName: user.name + "'s Business",
              category: "General Services",
              description: "A new vendor on VendorHive",
              userId: user.id,
              id: vendorId  // Explicitly set the numeric ID
            });
            
            console.log(`Fallback vendor created with ID: ${vendorId}`);
            console.log('Created fallback vendor profile:', JSON.stringify(vendorProfile, null, 2));
          }
        } catch (vendorError) {
          console.error('Error creating vendor profile:', vendorError);
          // Update the user role to 'user' since vendor creation failed
          await storage.updateUser(user.id, { role: 'user' });
          console.log('Changed user role to user due to vendor creation failure');
        }
      } else if (req.body.vendor) {
        // If vendor data was included but role isn't vendor, fix this inconsistency
        console.log('CRITICAL FIX: Vendor data provided but role is not vendor - updating role to vendor');
        await storage.updateUser(user.id, { role: 'vendor' });
        user.role = 'vendor'; // Update local object
        
        try {
          const vendorData = vendorSchema.parse(req.body.vendor);
          
          // Get the next available vendor ID to ensure it's unique and not null
          const lastVendor = await VendorModel.findOne().sort({ id: -1 });
          const vendorId = lastVendor ? lastVendor.id + 1 : 1;
          
          vendorProfile = await storage.createVendor({
            ...vendorData,
            userId: user.id,
            id: vendorId
          });
          
          console.log(`Vendor created successfully with ID: ${vendorId}`);
          console.log('Vendor profile created after role fix:', JSON.stringify(vendorProfile, null, 2));
        } catch (error) {
          console.error('Error creating vendor profile after role fix:', error);
          // Get the next available vendor ID to ensure it's unique and not null
          const lastVendor = await VendorModel.findOne().sort({ id: -1 });
          const vendorId = lastVendor ? lastVendor.id + 1 : 1;
          
          vendorProfile = await storage.createVendor({
            businessName: user.name + "'s Business",
            category: "General Services",
            description: "A new vendor on VendorHive",
            userId: user.id,
            id: vendorId
          });
          
          console.log(`Emergency fallback vendor created with ID: ${vendorId}`);
        }
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Return user info (without password), token, and vendor profile if applicable
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ 
        user: userWithoutPassword, 
        token, 
        vendorProfile 
      });
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
      
      // Check if user is a vendor and get vendor profile
      let vendorProfile = null;
      if (user.role === 'vendor') {
        vendorProfile = await storage.getVendorByUserId(user.id);
      }
      
      // Return user info (without password), token, and vendor profile if applicable
      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword, 
        token,
        vendorProfile
      });
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
      console.log('Updating user profile:', req.user.id, 'Type:', typeof req.user.id, 'with data:', userData);
      
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
      
      // Direct MongoDB update since we're using MongoDB ObjectId
      const mongoUser = await UserModel.findByIdAndUpdate(
        req.user.id,
        { $set: userData },
        { new: true }
      );
      
      if (!mongoUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Convert MongoDB user to our schema format
      const updatedUser = {
        id: mongoUser._id.toString(),
        name: mongoUser.name,
        username: mongoUser.username,
        email: mongoUser.email,
        password: mongoUser.password,
        role: mongoUser.role,
        profileImage: mongoUser.profileImage,
        phone: mongoUser.phone,
        bio: mongoUser.bio,
        location: mongoUser.location,
        joinedAt: mongoUser.joinedAt || new Date()
      };
      
      // Return updated user info (without password)
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user:', error);
      next(error);
    }
  });
  
  // Profile image upload route
  app.post('/api/users/profile-image', authenticateToken, upload.single('profileImage'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Use the helper function to upload to Cloudinary
      const imageUrl = await uploadImage(req.file);
      
      if (!imageUrl) {
        return res.status(500).json({ message: 'Failed to upload image' });
      }
      
      console.log('Uploaded profile image to Cloudinary:', imageUrl);
      console.log('Attempting to update user profile for user ID:', req.user.id);
      console.log('User ID type:', typeof req.user.id);
      
      // We need to directly update the MongoDB document using the _id field
      // Since we're using Mongoose, we can directly use findByIdAndUpdate
      try {
        // First try to find the user to verify they exist
        const user = await UserModel.findById(req.user.id);
        
        if (!user) {
          console.error(`User not found with MongoDB _id: ${req.user.id}`);
          return res.status(404).json({ message: 'User not found' });
        }
        
        console.log(`Found user with MongoDB _id: ${req.user.id}, updating profile image...`);
        
        // Update the user document directly
        const updatedUser = await UserModel.findByIdAndUpdate(
          req.user.id,
          { $set: { profileImage: imageUrl } },
          { new: true }
        );
        
        if (!updatedUser) {
          console.error('Failed to update user profile image:', req.user.id);
          return res.status(500).json({ message: 'Failed to update user profile image' });
        }
        
        console.log('Successfully updated user profile image for MongoDB _id:', req.user.id);
      } catch (error) {
        const updateError = error as Error;
        console.error('Error updating user profile image:', updateError);
        return res.status(500).json({ 
          message: 'Error updating user profile image', 
          error: updateError.message 
        });
      }
      
      console.log('Successfully updated user profile with new image URL');
      
      // Return the updated profile image URL
      res.status(200).json({ profileImage: imageUrl });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      next(error);
    }
  });
  
  // Password update route
  app.put('/api/users/password', authenticateToken, async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }
      
      // Verify current password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const isPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user
      const updatedUser = await storage.updateUser(req.user.id, { 
        password: hashedPassword 
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return success without sensitive data
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  });
  
  // Vendor Profile Repair endpoint is defined further below
  
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
  
  app.get('/api/vendors/user/:userId', async (req, res, next) => {
    try {
      const userId = req.params.userId;
      
      console.log(`Fetching vendor for user ID: ${userId}`);
      const vendor = await storage.getVendorByUserId(userId);
      if (!vendor) {
        console.log(`No vendor found for user ID: ${userId}`);
        return res.status(404).json({ message: 'Vendor not found for this user' });
      }
      
      console.log(`Found vendor for user ID ${userId}:`, vendor);
      res.json(vendor);
    } catch (error) {
      console.error(`Error fetching vendor for user:`, error);
      next(error);
    }
  });
  
  // Removing repair endpoint as we'll handle vendor profile creation automatically during service creation
  
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
      console.log('Updating vendor for user ID:', req.user.id, 'with data:', req.body);
      const vendorData = req.body;
      
      // Get vendor by user ID
      const vendor = await storage.getVendorByUserId(req.user.id);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor profile not found' });
      }
      
      console.log('Found vendor profile with ID:', vendor.id);
      
      // Direct MongoDB update
      const updatedMongoVendor = await VendorModel.findOneAndUpdate(
        { id: vendor.id },
        { $set: vendorData },
        { new: true }
      );
      
      if (!updatedMongoVendor) {
        return res.status(404).json({ message: 'Failed to update vendor profile' });
      }
      
      console.log('Updated vendor in MongoDB:', updatedMongoVendor);
      
      // Convert to our schema format
      const updatedVendor = {
        id: updatedMongoVendor.id,
        userId: updatedMongoVendor.userId.toString(),
        businessName: updatedMongoVendor.businessName,
        category: updatedMongoVendor.category,
        description: updatedMongoVendor.description,
        services: updatedMongoVendor.services || [],
        businessHours: updatedMongoVendor.businessHours || {},
        coverImage: updatedMongoVendor.coverImage,
        rating: updatedMongoVendor.rating,
        reviewCount: updatedMongoVendor.reviewCount
      };
      
      console.log('Sending updated vendor back to client:', updatedVendor);
      res.json(updatedVendor);
    } catch (error) {
      console.error('Error updating vendor:', error);
      next(error);
    }
  });
  
  // Vendor cover image upload route
  app.post('/api/vendors/cover-image', authenticateToken, authorizeRole(['vendor']), upload.single('coverImage'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Use the helper function to upload to Cloudinary
      const imageUrl = await uploadImage(req.file);
      
      if (!imageUrl) {
        return res.status(500).json({ message: 'Failed to upload image' });
      }
      
      console.log('Uploaded vendor cover image to Cloudinary:', imageUrl);
      console.log('Attempting to update vendor profile for user ID:', req.user.id);
      console.log('User ID type:', typeof req.user.id);
      
      try {
        // First find the vendor document by userId (which is a MongoDB ObjectId)
        const vendor = await VendorModel.findOne({ userId: req.user.id });
        
        if (!vendor) {
          console.error(`Vendor not found with userId: ${req.user.id}`);
          return res.status(404).json({ message: 'Vendor profile not found' });
        }
        
        console.log(`Found vendor with ID: ${vendor.id}, updating cover image...`);
        
        // Update the vendor document directly using Mongoose
        const updatedVendor = await VendorModel.findByIdAndUpdate(
          vendor._id,
          { $set: { coverImage: imageUrl } },
          { new: true }
        );
        
        if (!updatedVendor) {
          console.error('Failed to update vendor cover image:', vendor._id);
          return res.status(500).json({ message: 'Failed to update vendor cover image' });
        }
        
        console.log('Successfully updated vendor cover image for vendor ID:', vendor.id);
      } catch (error) {
        const updateError = error as Error;
        console.error('Error updating vendor cover image:', updateError);
        return res.status(500).json({ 
          message: 'Error updating vendor cover image', 
          error: updateError.message 
        });
      }
      
      console.log('Successfully updated vendor profile with new cover image URL');
      
      // Return the updated cover image URL
      res.status(200).json({ coverImage: imageUrl });
    } catch (error) {
      console.error('Error uploading vendor cover image:', error);
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
      console.log('Request to create service from user:', req.user.id, req.user.username);

      // Get vendor by user ID first (to ensure user is a vendor and get the vendorId)
      // Pass the MongoDB ObjectId string directly if that's what we have
      const vendor = await storage.getVendorByUserId(req.user.id);
      
      if (!vendor) {
        console.log('No vendor profile found for user ID:', req.user.id);
        
        // Create a vendor profile if it doesn't exist but user has vendor role
        if (req.user.role === 'vendor') {
          console.log('User has vendor role but no vendor profile, creating one now...');
          
          try {
            // Create a default vendor profile
            // Get the next available vendor ID to ensure it's unique and valid
            const lastVendor = await VendorModel.findOne().sort({ id: -1 });
            const nextVendorId = lastVendor && !isNaN(lastVendor.id) ? Number(lastVendor.id) + 1 : 1;
            
            console.log(`Creating new vendor with explicitly set ID: ${nextVendorId}`);
            
            const newVendor = await storage.createVendor({
              // Explicitly set numeric ID and ensure it's a valid number
              userId: req.user.id,
              businessName: req.user.name ? `${req.user.name}'s Business` : 'New Business',
              category: 'General Services',
              description: 'A new vendor on VendorHive'
            });
            
            console.log('Created vendor profile automatically:', newVendor);
            
            // Continue with this new vendor profile
            const serviceData = serviceSchema.parse({
              ...req.body,
              vendorId: Number(newVendor.id) // Force proper numeric type
            });
            
            // Create service with the new vendor ID
            const serviceId = await getNextServiceId();
            const serviceDataToCreate = {
              ...serviceData,
              id: serviceId
            };
            
            console.log('Creating service for new vendor with data:', JSON.stringify(serviceDataToCreate, null, 2));
            
            const service = await storage.createService(serviceDataToCreate);
            console.log('Service created successfully with ID:', service.id);
            return res.status(201).json(service);
          } catch (error) {
            const vendorCreationError = error as Error;
            console.error('Failed to create vendor profile automatically:', vendorCreationError);
            return res.status(404).json({ 
              message: 'Vendor profile not found and automatic creation failed',
              details: vendorCreationError.message 
            });
          }
        } else {
          return res.status(404).json({ message: 'Vendor profile not found and user is not a vendor' });
        }
      }
      
      console.log(`Found vendor with ID: ${vendor.id} (type: ${typeof vendor.id})`);
      
      // Make sure vendorId is set to the numeric vendor ID
      const serviceData = serviceSchema.parse({
        ...req.body,
        vendorId: Number(vendor.id) // Force proper numeric type
      });
      
      console.log(`Parsed service data with vendorId: ${serviceData.vendorId} (type: ${typeof serviceData.vendorId})`);
      
      // Double-check the vendorId matches
      if (serviceData.vendorId !== Number(vendor.id)) {
        return res.status(403).json({ message: 'You can only create services for your own vendor profile' });
      }
      
      // Get the next available service ID
      const serviceId = await getNextServiceId();
      
      // Create service object with explicit ID
      const serviceDataToCreate = {
        ...serviceData,
        id: serviceId
      };
      
      // Log the complete service data for debugging
      console.log('Creating service with data:', JSON.stringify(serviceDataToCreate, null, 2));
      
      // Create service
      try {
        const service = await storage.createService(serviceDataToCreate);
        console.log('Service created successfully with ID:', service.id);
        res.status(201).json(service);
      } catch (serviceError) {
        console.error('Error creating service:', serviceError);
        throw serviceError;
      }
    } catch (error) {
      console.error('Service creation failed with error:', error);
      next(error);
    }
  });
  
  // Get services for the current vendor (authenticated user)
  // Get all services (public endpoint for browsing)
  app.get('/api/services', async (req, res, next) => {
    try {
      // Get all services from all vendors
      // First get all vendors
      const vendors = await storage.getAllVendors();
      
      // Then collect all services
      let allServices = [];
      for (const vendor of vendors) {
        const services = await storage.getServicesByVendorId(vendor.id);
        // Add vendor info to services
        const servicesWithVendor = services.map(service => ({
          ...service,
          vendor: {
            id: vendor.id,
            businessName: vendor.businessName,
            category: vendor.category,
            rating: vendor.rating,
            reviewCount: vendor.reviewCount,
            user: {
              name: vendor.user.name,
              profileImage: vendor.user.profileImage
            }
          }
        }));
        
        allServices = [...allServices, ...servicesWithVendor];
      }
      
      res.json(allServices);
    } catch (error) {
      next(error);
    }
  });
  
  // Get services by vendor ID (public endpoint, no auth required)
  app.get('/api/services/vendor/:vendorId', async (req, res, next) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      if (isNaN(vendorId)) {
        return res.status(400).json({ message: 'Invalid vendor ID' });
      }
      
      const services = await storage.getServicesByVendorId(vendorId);
      res.json(services);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/api/services/vendor', authenticateToken, authorizeRole(['vendor']), async (req, res, next) => {
    try {
      console.log('Fetching services for current vendor user:', req.user.id);
      
      // Get vendor profile by user ID
      const vendor = await storage.getVendorByUserId(req.user.id);
      
      if (!vendor) {
        console.log('No vendor profile found for user:', req.user.id);
        return res.status(404).json({ message: 'Vendor profile not found' });
      }
      
      // Get services for this vendor
      const services = await storage.getServicesByVendorId(vendor.id);
      console.log(`Found ${services.length} services for vendor ID ${vendor.id}`);
      
      return res.json(services);
    } catch (error) {
      console.error('Error fetching vendor services:', error);
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
      
      // Ensure vendor owns the service (comparing numeric IDs)
      if (Number(service.vendorId) !== Number(vendor.id)) {
        console.log(`Service vendorId: ${service.vendorId} (${typeof service.vendorId}) doesn't match vendor.id: ${vendor.id} (${typeof vendor.id})`);
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
      
      // Ensure vendor owns the service (comparing numeric IDs)
      if (Number(service.vendorId) !== Number(vendor.id)) {
        console.log(`Service vendorId: ${service.vendorId} (${typeof service.vendorId}) doesn't match vendor.id: ${vendor.id} (${typeof vendor.id})`);
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
      console.log('Booking request received');
      console.log('Body:', req.body);
      console.log('Auth user:', req.user.id, req.user.username);
      
      // Get the vendor ID from the request
      let vendorId = req.body.vendorId;
      if (typeof vendorId === 'string') {
        vendorId = parseInt(vendorId, 10);
      }
      console.log('Vendor ID for booking:', vendorId);
      
      // First check if user is trying to book their own vendor service
      try {
        // Get the user's vendor profile if they are a vendor
        const userVendor = await storage.getVendorByUserId(req.user.id);
        console.log('User vendor profile:', userVendor);
        
        if (userVendor && userVendor.id === vendorId) {
          console.log('Vendor tried to book their own service - not allowed');
          return res.status(403).json({ message: 'Vendors cannot book their own services' });
        }
      } catch (error) {
        console.log('Error checking if user is vendor:', error);
        // Not a vendor, that's fine - continue
      }

      // Create a fresh booking object with correctly typed values 
      const bookingData = {
        userId: req.user.id,
        vendorId: vendorId,
        serviceId: req.body.serviceId ? (typeof req.body.serviceId === 'string' ? parseInt(req.body.serviceId, 10) : req.body.serviceId) : undefined,
        date: req.body.date instanceof Date ? req.body.date : new Date(req.body.date),
        status: 'pending' as 'pending' | 'confirmed' | 'completed' | 'cancelled', // Type assertion
        notes: req.body.notes || '',
      };
      
      // Create booking
      const booking = await storage.createBooking(bookingData);
      
      res.status(201).json(booking);
    } catch (error) {
      console.error('Booking creation error:', error);
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
  // Get reviews for a vendor
  app.get('/api/reviews/vendor/:vendorId', async (req, res, next) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      if (isNaN(vendorId)) {
        return res.status(400).json({ message: 'Invalid vendor ID' });
      }
      
      const reviews = await storage.getReviewsByVendorId(vendorId);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/api/reviews', authenticateToken, async (req, res, next) => {
    try {
      // Use the authenticated user's ID
      const transformedData = {
        ...req.body,
        userId: req.user.id,
      };
      
      console.log('Review data:', transformedData);
      
      // Fix reviewSchema usage (not insertReviewSchema)
      const reviewData = reviewSchema.parse(transformedData);
      
      // Check if the vendor is trying to review their own business
      const vendorId = reviewData.vendorId;
      
      try {
        // Check if user is the vendor they're trying to review
        const vendor = await storage.getVendorByUserId(req.user.id);
        console.log('Review check - Is vendor:', { vendor, vendorId });
        
        if (vendor && vendor.id === vendorId) {
          console.log('Vendor tried to review their own business');
          return res.status(403).json({ message: 'You cannot review your own business' });
        }
      } catch (err) {
        console.log('Error checking vendor status for review:', err);
        // Continue if there's an error checking vendor status
      }
      
      // Create review
      const review = await storage.createReview(reviewData);
      
      res.status(201).json(review);
    } catch (error) {
      console.error('Review creation error:', error);
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
