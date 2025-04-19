import { 
  type User, type InsertUser,
  type Vendor, type InsertVendor,
  type Service, type InsertService,
  type Booking, type InsertBooking,
  type Review, type InsertReview
} from "@shared/schema";
import { 
  UserModel, 
  VendorModel, 
  ServiceModel, 
  BookingModel, 
  ReviewModel, 
  connectMongoose 
} from './db';

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Vendor related methods
  getVendor(id: number): Promise<(Vendor & { user: User }) | undefined>;
  getVendorByUserId(userId: number): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  getAllVendors(): Promise<(Vendor & { user: User })[]>;
  searchVendors(query: string): Promise<(Vendor & { user: User })[]>;
  
  // Service related methods
  createService(service: InsertService): Promise<Service>;
  getServiceById(id: number): Promise<Service | undefined>;
  getServicesByVendorId(vendorId: number): Promise<Service[]>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  
  // Booking related methods
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingsByUserId(userId: number): Promise<Booking[]>;
  getBookingsByVendorId(vendorId: number): Promise<Booking[]>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  
  // Review related methods
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByVendorId(vendorId: number): Promise<(Review & { user: User })[]>;
  getAverageRatingByVendorId(vendorId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vendors: Map<number, Vendor>;
  private services: Map<number, Service>;
  private bookings: Map<number, Booking>;
  private reviews: Map<number, Review>;
  
  private userIdCounter: number;
  private vendorIdCounter: number;
  private serviceIdCounter: number;
  private bookingIdCounter: number;
  private reviewIdCounter: number;

  constructor() {
    this.users = new Map();
    this.vendors = new Map();
    this.services = new Map();
    this.bookings = new Map();
    this.reviews = new Map();
    
    this.userIdCounter = 1;
    this.vendorIdCounter = 1;
    this.serviceIdCounter = 1;
    this.bookingIdCounter = 1;
    this.reviewIdCounter = 1;
  }

  // User related methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const joinedAt = new Date();
    
    const user: User = { ...insertUser, id, joinedAt };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Vendor related methods
  async getVendor(id: number): Promise<(Vendor & { user: User }) | undefined> {
    const vendor = this.vendors.get(id);
    if (!vendor) return undefined;
    
    const user = this.users.get(vendor.userId);
    if (!user) return undefined;
    
    return { ...vendor, user };
  }

  async getVendorByUserId(userId: number): Promise<Vendor | undefined> {
    return Array.from(this.vendors.values()).find(
      (vendor) => vendor.userId === userId
    );
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const id = this.vendorIdCounter++;
    const vendor: Vendor = { ...insertVendor, id, rating: 0, reviewCount: 0 };
    this.vendors.set(id, vendor);
    return vendor;
  }

  async updateVendor(id: number, vendorData: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const existingVendor = this.vendors.get(id);
    if (!existingVendor) return undefined;
    
    const updatedVendor = { ...existingVendor, ...vendorData };
    this.vendors.set(id, updatedVendor);
    return updatedVendor;
  }

  async getAllVendors(): Promise<(Vendor & { user: User })[]> {
    const vendors: (Vendor & { user: User })[] = [];
    
    for (const vendor of this.vendors.values()) {
      const user = this.users.get(vendor.userId);
      if (user) {
        vendors.push({ ...vendor, user });
      }
    }
    
    return vendors;
  }

  async searchVendors(query: string): Promise<(Vendor & { user: User })[]> {
    const lowercaseQuery = query.toLowerCase();
    const vendors: (Vendor & { user: User })[] = [];
    
    for (const vendor of this.vendors.values()) {
      const user = this.users.get(vendor.userId);
      if (!user) continue;
      
      if (
        vendor.businessName.toLowerCase().includes(lowercaseQuery) ||
        vendor.category.toLowerCase().includes(lowercaseQuery) ||
        vendor.description.toLowerCase().includes(lowercaseQuery) ||
        user.name.toLowerCase().includes(lowercaseQuery)
      ) {
        vendors.push({ ...vendor, user });
      }
    }
    
    return vendors;
  }

  // Service related methods
  async createService(insertService: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const service: Service = { ...insertService, id };
    this.services.set(id, service);
    return service;
  }

  async getServiceById(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async getServicesByVendorId(vendorId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(
      (service) => service.vendorId === vendorId
    );
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const existingService = this.services.get(id);
    if (!existingService) return undefined;
    
    const updatedService = { ...existingService, ...serviceData };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }

  // Booking related methods
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.bookingIdCounter++;
    const booking: Booking = { ...insertBooking, id };
    this.bookings.set(id, booking);
    return booking;
  }

  async getBookingsByUserId(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.userId === userId
    );
  }

  async getBookingsByVendorId(vendorId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.vendorId === vendorId
    );
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, status };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Review related methods
  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const createdAt = new Date();
    
    const review: Review = { ...insertReview, id, createdAt };
    this.reviews.set(id, review);
    
    // Update vendor rating
    const vendorReviews = await this.getReviewsByVendorId(insertReview.vendorId);
    const vendor = this.vendors.get(insertReview.vendorId);
    
    if (vendor) {
      const reviewCount = vendorReviews.length + 1;
      const totalRating = vendorReviews.reduce((sum, review) => sum + review.rating, 0) + insertReview.rating;
      const averageRating = Math.round(totalRating / reviewCount);
      
      this.vendors.set(insertReview.vendorId, {
        ...vendor,
        rating: averageRating,
        reviewCount
      });
    }
    
    return review;
  }

  async getReviewsByVendorId(vendorId: number): Promise<(Review & { user: User })[]> {
    const vendorReviews = Array.from(this.reviews.values()).filter(
      (review) => review.vendorId === vendorId
    );
    
    return vendorReviews.map(review => {
      const user = this.users.get(review.userId);
      return { ...review, user: user! };
    }).filter(review => review.user !== undefined) as (Review & { user: User })[];
  }

  async getAverageRatingByVendorId(vendorId: number): Promise<number> {
    const vendorReviews = await this.getReviewsByVendorId(vendorId);
    
    if (vendorReviews.length === 0) return 0;
    
    const totalRating = vendorReviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round(totalRating / vendorReviews.length);
  }
}

// MongoDB Storage Implementation
export class MongoDBStorage implements IStorage {
  constructor() {
    // Connect to MongoDB when the storage is initialized
    connectMongoose().catch(err => console.error('Failed to connect to MongoDB:', err));
  }

  // User related methods
  async getUser(id: number | string): Promise<User | undefined> {
    try {
      // Try to find by numeric id first
      let user = await UserModel.findOne({ id });
      
      // If not found and the id is a string that looks like a MongoDB ObjectId
      if (!user && typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
        user = await UserModel.findById(id);
      }
      
      return user ? this.mongoUserToUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ email });
      return user ? this.mongoUserToUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ username });
      return user ? this.mongoUserToUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Get the next available user ID
      const lastUser = await UserModel.findOne().sort({ id: -1 });
      const id = lastUser ? lastUser.id + 1 : 1;

      const newUser = new UserModel({
        ...insertUser,
        id,
        joinedAt: new Date()
      });

      await newUser.save();
      return this.mongoUserToUser(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const updatedUser = await UserModel.findOneAndUpdate(
        { id },
        { $set: userData },
        { new: true }
      );
      return updatedUser ? this.mongoUserToUser(updatedUser) : undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Vendor related methods
  async getVendor(id: number): Promise<(Vendor & { user: User }) | undefined> {
    try {
      console.log(`Looking up vendor with ID: ${id}`);
      const vendor = await VendorModel.findOne({ id });
      if (!vendor) {
        console.log(`No vendor found with ID: ${id}`);
        return undefined;
      }
      
      console.log(`Found vendor, looking up user with userId: ${vendor.userId}`);
      
      // Try different strategies to find the user
      let user;
      
      // Try MongoDB ObjectId reference first
      try {
        if (vendor.userId && String(vendor.userId).length === 24) {
          console.log(`Trying to find user by MongoDB _id: ${vendor.userId}`);
          user = await UserModel.findById(vendor.userId);
          if (user) {
            console.log('Found user by MongoDB _id');
          }
        }
      } catch (err) {
        console.log('Error looking up by MongoDB ObjectId:', err);
      }
      
      // Try numeric ID lookup
      if (!user && typeof vendor.userId === 'number') {
        console.log(`Trying to find user with numeric ID: ${vendor.userId}`);
        user = await UserModel.findOne({ id: vendor.userId });
        if (user) {
          console.log('Found user by numeric ID');
        }
      }
      
      // Try string value of the userId
      if (!user && vendor.userId) {
        console.log(`Trying to find user with ID string: ${String(vendor.userId)}`);
        user = await UserModel.findOne({ id: String(vendor.userId) });
        if (user) {
          console.log('Found user by string ID');
        }
      }
      
      if (!user) {
        console.log(`No user found for vendor with ID: ${id} (userId: ${vendor.userId})`);
        
        // Last resort: Get the most recent user 
        console.log('Getting most recently created user as fallback');
        user = await UserModel.findOne().sort({ createdAt: -1 });
        
        if (!user) {
          console.log('No users found in database, vendor has no associated user');
          return undefined;
        }
        
        console.log(`Using most recent user (ID: ${user.id}) as fallback`);
      }

      return {
        ...this.mongoVendorToVendor(vendor),
        user: this.mongoUserToUser(user)
      };
    } catch (error) {
      console.error('Error getting vendor:', error);
      return undefined;
    }
  }

  async getVendorByUserId(userId: number | string): Promise<Vendor | undefined> {
    try {
      console.log(`Looking up vendor for user ID ${userId} (type: ${typeof userId})`);
      
      // Check if userId is a MongoDB ObjectId string
      let mongoObjectId: string | null = null;
      let numericId: number | null = null;
      
      if (typeof userId === 'string' && userId.length === 24) {
        // This looks like a MongoDB ObjectId
        mongoObjectId = userId;
        console.log(`User ID appears to be a MongoDB ObjectId: ${mongoObjectId}`);
      } else if (typeof userId === 'number' || !isNaN(Number(userId))) {
        // This is a numeric ID or can be converted to one
        numericId = Number(userId);
        console.log(`User ID appears to be a numeric ID: ${numericId}`);
      }
      
      // Try various strategies to find the vendor
      let vendor = null;
      let user = null;
      
      // Strategy 1: Try to find vendor directly by MongoDB ObjectId
      if (mongoObjectId) {
        try {
          console.log(`Trying to find vendor by user._id: ${mongoObjectId}`);
          vendor = await VendorModel.findOne({ userId: mongoObjectId });
          if (vendor) {
            console.log('Found vendor by MongoDB ObjectId');
          }
        } catch (err) {
          console.log('Error looking up vendor by MongoDB ObjectId:', err);
        }
      }
      
      // Strategy 2: Try to find user first, then use that to find vendor
      if (!vendor && numericId) {
        user = await UserModel.findOne({ id: numericId });
        if (user) {
          console.log('Found user with numeric ID:', user);
          vendor = await VendorModel.findOne({ userId: user._id });
          if (vendor) {
            console.log('Found vendor by user._id after looking up user');
          }
        }
      }
      
      // Strategy 3: Try looking up the vendor by string ID if it's stored that way
      if (!vendor && mongoObjectId) {
        try {
          user = await UserModel.findById(mongoObjectId);
          if (user) {
            console.log('Found user by MongoDB _id lookup:', user);
            vendor = await VendorModel.findOne({ userId: user._id });
            if (vendor) {
              console.log('Found vendor by user._id after looking up user by _id');
            }
          }
        } catch (err) {
          console.log('Error looking up user by MongoDB ObjectId:', err);
        }
      }
      
      // Strategy 4: Try finding vendor by numeric ID directly
      if (!vendor && numericId) {
        console.log(`Trying to find vendor with userId as numeric value: ${numericId}`);
        vendor = await VendorModel.findOne({ userId: numericId });
        if (vendor) {
          console.log('Found vendor by numeric userId');
        }
      }
      
      if (!vendor) {
        console.log(`No vendor found for user with ID ${userId} after trying all strategies`);
        
        // Last resort: Attempt to find the vendors collection and show what's there
        console.log('Available vendors in database:');
        const allVendors = await VendorModel.find({}).limit(5);
        console.log(`Found ${allVendors.length} vendors:`);
        allVendors.forEach(v => console.log(`Vendor ID: ${v.id}, UserID: ${v.userId}, BusinessName: ${v.businessName}`));
        
        return undefined;
      }
      
      // Store the user ID for reference
      const vendorData = vendor.toObject();
      if (numericId) {
        vendorData.userIdNumber = numericId;
      }
      
      console.log(`Found vendor for user ID ${userId}:`, vendorData);
      return this.mongoVendorToVendor(vendorData);
    } catch (error) {
      console.error('Error getting vendor by user ID:', error);
      return undefined;
    }
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    try {
      // Always get the next available vendor ID to avoid ID conflicts and NaN issues
      const lastVendor = await VendorModel.findOne().sort({ id: -1 });
      
      // Safely get the next ID, ensuring it's a valid number
      let nextId = 1; // Default to 1 if no vendors exist
      
      if (lastVendor) {
        const lastId = Number(lastVendor.id);
        nextId = !isNaN(lastId) ? lastId + 1 : 1;
      }
      
      console.log(`Generated new vendor ID: ${nextId}`);
      
      // CRITICAL FIX: Handle both string and number IDs
      console.log('Looking up user with ID:', insertVendor.userId, 'Type:', typeof insertVendor.userId);
      
      let user = null;
      
      // If userId is a MongoDB ObjectId string, try that first
      if (typeof insertVendor.userId === 'string' && insertVendor.userId.length === 24) {
        console.log('MongoDB ObjectId detected, looking up by _id directly');
        try {
          user = await UserModel.findById(insertVendor.userId);
          if (user) {
            console.log('Found user by MongoDB ObjectId:', user._id);
          }
        } catch (err) {
          console.log('Error finding by MongoDB ObjectId:', err);
        }
      }
      
      // If not found and userId looks numeric, try by numeric ID
      if (!user && (typeof insertVendor.userId === 'number' || !isNaN(Number(insertVendor.userId)))) {
        const numericId = Number(insertVendor.userId);
        console.log(`Trying to find user by numeric ID: ${numericId}`);
        user = await UserModel.findOne({ id: numericId });
        if (user) {
          console.log('Found user by numeric ID:', user.id);
        }
      }
      
      // If still not found, try string comparison with ID field
      if (!user && typeof insertVendor.userId === 'string') {
        console.log('Attempting to find user by string ID comparison');
        user = await UserModel.findOne({ id: { $eq: insertVendor.userId } });
        if (user) {
          console.log('Found user by string ID comparison:', user.id);
        }
      }
      
      if (!user) {
        // One last attempt - find the most recently created user
        console.log('CRITICAL RECOVERY: User not found by ID, attempting to find most recent user');
        user = await UserModel.findOne().sort({ createdAt: -1 });
        
        if (!user) {
          throw new Error(`User with ID ${insertVendor.userId} not found and no fallback available`);
        }
        console.log('Using most recently created user as fallback:', user.id);
      }
      
      // Ensure vendor data has required fields with default values if not provided
      const vendorData = {
        ...insertVendor,
        userId: user._id, // Use MongoDB ObjectId for the reference
        id: nextId, // Use the safely generated ID
        rating: 0,
        reviewCount: 0,
        services: insertVendor.services || [],
        businessHours: insertVendor.businessHours || {}
      };
      
      console.log('Creating vendor with data:', {
        ...vendorData,
        userIdProvided: insertVendor.userId,
        userIdUsed: user._id,
        userIdNumeric: user.id,
        vendorId: nextId
      });

      const newVendor = new VendorModel(vendorData);
      await newVendor.save();
      
      console.log('Vendor saved successfully:', newVendor);
      return this.mongoVendorToVendor(newVendor);
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  }

  async updateVendor(id: number, vendorData: Partial<InsertVendor>): Promise<Vendor | undefined> {
    try {
      const updatedVendor = await VendorModel.findOneAndUpdate(
        { id },
        { $set: vendorData },
        { new: true }
      );
      return updatedVendor ? this.mongoVendorToVendor(updatedVendor) : undefined;
    } catch (error) {
      console.error('Error updating vendor:', error);
      return undefined;
    }
  }

  async getAllVendors(): Promise<(Vendor & { user: User })[]> {
    try {
      console.log("Fetching all vendors");
      const vendors = await VendorModel.find();
      console.log(`Found ${vendors.length} vendors in database`);
      
      const results: (Vendor & { user: User })[] = [];

      for (const vendor of vendors) {
        console.log(`Processing vendor ${vendor.id} with userId: ${vendor.userId}`);
        
        // Try different strategies to find the user
        let user;
        
        // Strategy 1: If userId is a MongoDB ObjectId, try to find by _id
        if (typeof vendor.userId === 'object' || 
            (typeof vendor.userId === 'string' && vendor.userId.length === 24)) {
          try {
            console.log(`Looking up user with MongoDB _id: ${vendor.userId}`);
            user = await UserModel.findById(vendor.userId);
            if (user) {
              console.log(`Found user by MongoDB _id: ${user._id}`);
            }
          } catch (err) {
            console.log('Error looking up by MongoDB ObjectId:', err);
          }
        }
        
        // Strategy 2: Try numeric ID lookup
        if (!user && typeof vendor.userId === 'number') {
          console.log(`Looking up user with numeric ID: ${vendor.userId}`);
          user = await UserModel.findOne({ id: vendor.userId });
          if (user) {
            console.log('Found user by numeric ID');
          }
        }
        
        // Strategy 3: Try string value of the userId
        if (!user && vendor.userId) {
          console.log(`Looking up user with ID string: ${String(vendor.userId)}`);
          user = await UserModel.findOne({ id: String(vendor.userId) });
          if (user) {
            console.log('Found user by string ID');
          }
        }
        
        if (user) {
          console.log(`Adding vendor ${vendor.businessName} with user ${user.username} to results`);
          results.push({
            ...this.mongoVendorToVendor(vendor),
            user: this.mongoUserToUser(user)
          });
        } else {
          console.log(`WARNING: No user found for vendor ${vendor.id} with userId ${vendor.userId}`);
        }
      }

      console.log(`Returning ${results.length} vendors with user data`);
      return results;
    } catch (error) {
      console.error('Error getting all vendors:', error);
      return [];
    }
  }

  async searchVendors(query: string): Promise<(Vendor & { user: User })[]> {
    try {
      console.log(`Searching vendors with query: "${query}"`);
      const searchRegex = new RegExp(query, 'i');
      const vendors = await VendorModel.find({
        $or: [
          { businessName: searchRegex },
          { category: searchRegex },
          { description: searchRegex }
        ]
      });
      console.log(`Found ${vendors.length} vendors matching search query`);

      const results: (Vendor & { user: User })[] = [];

      for (const vendor of vendors) {
        console.log(`Processing vendor ${vendor.id} with userId: ${vendor.userId}`);
        
        // Try different strategies to find the user (same as getAllVendors)
        let user;
        
        // Strategy 1: If userId is a MongoDB ObjectId, try to find by _id
        if (typeof vendor.userId === 'object' || 
            (typeof vendor.userId === 'string' && vendor.userId.length === 24)) {
          try {
            console.log(`Looking up user with MongoDB _id: ${vendor.userId}`);
            user = await UserModel.findById(vendor.userId);
            if (user) {
              console.log(`Found user by MongoDB _id: ${user._id}`);
            }
          } catch (err) {
            console.log('Error looking up by MongoDB ObjectId:', err);
          }
        }
        
        // Strategy 2: Try numeric ID lookup
        if (!user && typeof vendor.userId === 'number') {
          console.log(`Looking up user with numeric ID: ${vendor.userId}`);
          user = await UserModel.findOne({ id: vendor.userId });
          if (user) {
            console.log('Found user by numeric ID');
          }
        }
        
        // Strategy 3: Try string value of the userId
        if (!user && vendor.userId) {
          console.log(`Looking up user with ID string: ${String(vendor.userId)}`);
          user = await UserModel.findOne({ id: String(vendor.userId) });
          if (user) {
            console.log('Found user by string ID');
          }
        }
        
        if (user) {
          console.log(`Adding vendor ${vendor.businessName} with user ${user.username} to search results`);
          results.push({
            ...this.mongoVendorToVendor(vendor),
            user: this.mongoUserToUser(user)
          });
        }
      }

      // Also search in users' names and add their vendors
      console.log("Also searching in user names...");
      const users = await UserModel.find({ name: searchRegex });
      console.log(`Found ${users.length} users matching search query`);
      
      for (const user of users) {
        console.log(`Looking for vendor with userId: ${user.id}`);
        
        // Try different strategies to find the vendor for this user
        let vendor;
        
        // Strategy 1: Try by numeric ID
        vendor = await VendorModel.findOne({ userId: user.id });
        if (vendor) {
          console.log(`Found vendor by numeric userId`);
        }
        
        // Strategy 2: Try by MongoDB ObjectId
        if (!vendor && user._id) {
          vendor = await VendorModel.findOne({ userId: user._id });
          if (vendor) {
            console.log(`Found vendor by MongoDB _id reference`);
          }
        }
        
        // Strategy 3: Try string comparison
        if (!vendor && user.id) {
          vendor = await VendorModel.findOne({ userId: String(user.id) });
          if (vendor) {
            console.log(`Found vendor by string userId comparison`);
          }
        }
        
        if (vendor) {
          // Check if this vendor is already in results
          const exists = results.some(r => r.id === vendor.id);
          if (!exists) {
            console.log(`Adding vendor ${vendor.businessName} from user ${user.username} search`);
            results.push({
              ...this.mongoVendorToVendor(vendor),
              user: this.mongoUserToUser(user)
            });
          }
        }
      }

      console.log(`Returning ${results.length} total search results`);
      return results;
    } catch (error) {
      console.error('Error searching vendors:', error);
      return [];
    }
  }

  // Service related methods
  async createService(insertService: InsertService): Promise<Service> {
    try {
      // Get the next available service ID
      const lastService = await ServiceModel.findOne().sort({ id: -1 });
      const id = lastService ? lastService.id + 1 : 1;
      
      console.log('Creating service with data:', JSON.stringify({
        ...insertService,
        id
      }, null, 2));

      // Ensure vendorId is a number
      const vendorId = Number(insertService.vendorId);
      if (isNaN(vendorId)) {
        throw new Error(`Invalid vendor ID: ${insertService.vendorId}`);
      }

      const newService = new ServiceModel({
        ...insertService,
        vendorId, // Ensure numeric type
        id
      });

      await newService.save();
      console.log('Service created successfully with ID:', id);
      return this.mongoServiceToService(newService);
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async getServiceById(id: number): Promise<Service | undefined> {
    try {
      const service = await ServiceModel.findOne({ id });
      return service ? this.mongoServiceToService(service) : undefined;
    } catch (error) {
      console.error('Error getting service by ID:', error);
      return undefined;
    }
  }

  async getServicesByVendorId(vendorId: number): Promise<Service[]> {
    try {
      const services = await ServiceModel.find({ vendorId });
      return services.map(service => this.mongoServiceToService(service));
    } catch (error) {
      console.error('Error getting services by vendor ID:', error);
      return [];
    }
  }
  
  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    try {
      const updatedService = await ServiceModel.findOneAndUpdate(
        { id },
        { $set: serviceData },
        { new: true }
      );
      return updatedService ? this.mongoServiceToService(updatedService) : undefined;
    } catch (error) {
      console.error('Error updating service:', error);
      return undefined;
    }
  }
  
  async deleteService(id: number): Promise<boolean> {
    try {
      const result = await ServiceModel.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting service:', error);
      return false;
    }
  }

  // Booking related methods
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    try {
      // Get the next available booking ID
      const lastBooking = await BookingModel.findOne().sort({ id: -1 });
      const id = lastBooking ? lastBooking.id + 1 : 1;

      // Ensure vendorId and serviceId are numbers
      const vendorId = Number(insertBooking.vendorId);
      if (isNaN(vendorId)) {
        throw new Error(`Invalid vendor ID: ${insertBooking.vendorId}`);
      }

      let serviceId = null;
      if (insertBooking.serviceId) {
        serviceId = Number(insertBooking.serviceId);
        if (isNaN(serviceId)) {
          throw new Error(`Invalid service ID: ${insertBooking.serviceId}`);
        }
      }

      const newBooking = new BookingModel({
        ...insertBooking,
        vendorId, // Ensure numeric type
        serviceId, // Ensure numeric type or null
        id
      });

      await newBooking.save();
      console.log('Booking created successfully with ID:', id);
      return this.mongoBookingToBooking(newBooking);
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  async getBookingsByUserId(userId: number): Promise<Booking[]> {
    try {
      const bookings = await BookingModel.find({ userId });
      return bookings.map(booking => this.mongoBookingToBooking(booking));
    } catch (error) {
      console.error('Error getting bookings by user ID:', error);
      return [];
    }
  }

  async getBookingsByVendorId(vendorId: number): Promise<Booking[]> {
    try {
      const bookings = await BookingModel.find({ vendorId });
      return bookings.map(booking => this.mongoBookingToBooking(booking));
    } catch (error) {
      console.error('Error getting bookings by vendor ID:', error);
      return [];
    }
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    try {
      const updatedBooking = await BookingModel.findOneAndUpdate(
        { id },
        { $set: { status } },
        { new: true }
      );
      return updatedBooking ? this.mongoBookingToBooking(updatedBooking) : undefined;
    } catch (error) {
      console.error('Error updating booking status:', error);
      return undefined;
    }
  }

  // Review related methods
  async createReview(insertReview: InsertReview): Promise<Review> {
    try {
      // Get the next available review ID
      const lastReview = await ReviewModel.findOne().sort({ id: -1 });
      const id = lastReview ? lastReview.id + 1 : 1;

      // Ensure vendorId is a number
      const vendorId = Number(insertReview.vendorId);
      if (isNaN(vendorId)) {
        throw new Error(`Invalid vendor ID: ${insertReview.vendorId}`);
      }

      const newReview = new ReviewModel({
        ...insertReview,
        vendorId, // Ensure numeric type
        id,
        createdAt: new Date()
      });

      await newReview.save();
      console.log('Review created successfully with ID:', id);

      // Update vendor rating and review count
      const vendorReviews = await this.getReviewsByVendorId(vendorId);
      const vendor = await VendorModel.findOne({ id: vendorId });
      
      if (vendor) {
        const reviewCount = vendorReviews.length + 1;
        const totalRating = vendorReviews.reduce((sum, review) => sum + review.rating, 0) + insertReview.rating;
        const averageRating = Math.round(totalRating / reviewCount);
        
        await VendorModel.findOneAndUpdate(
          { id: vendorId },
          { $set: { rating: averageRating, reviewCount } }
        );
        console.log(`Updated vendor ${vendorId} rating to ${averageRating} (${reviewCount} reviews)`);
      }

      return this.mongoReviewToReview(newReview);
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  async getReviewsByVendorId(vendorId: number): Promise<(Review & { user: User })[]> {
    try {
      const reviews = await ReviewModel.find({ vendorId });
      const results: (Review & { user: User })[] = [];

      for (const review of reviews) {
        const user = await UserModel.findOne({ id: review.userId });
        if (user) {
          results.push({
            ...this.mongoReviewToReview(review),
            user: this.mongoUserToUser(user)
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error getting reviews by vendor ID:', error);
      return [];
    }
  }

  async getAverageRatingByVendorId(vendorId: number): Promise<number> {
    try {
      const reviews = await ReviewModel.find({ vendorId });
      
      if (reviews.length === 0) return 0;
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      return Math.round(totalRating / reviews.length);
    } catch (error) {
      console.error('Error getting average rating by vendor ID:', error);
      return 0;
    }
  }

  // Helper methods to convert MongoDB documents to TypeScript types
  private mongoUserToUser(mongoUser: any): User {
    return {
      id: mongoUser.id || mongoUser._id.toString(), // Use MongoDB _id if id is not present
      name: mongoUser.name,
      username: mongoUser.username,
      email: mongoUser.email,
      password: mongoUser.password,
      role: mongoUser.role || 'user', // Default to 'user' if role is not set
      profileImage: mongoUser.profileImage || null,
      phone: mongoUser.phone || null,
      bio: mongoUser.bio || null,
      location: mongoUser.location || null,
      joinedAt: mongoUser.joinedAt || new Date() // Default to current date if not set
    };
  }

  private async findUserIdFromObjectId(objectId: any): Promise<number | undefined> {
    try {
      // If it's already a number, return it directly
      if (typeof objectId === 'number') return objectId;
      
      // If it's a MongoDB ObjectId, find the corresponding user
      const user = await UserModel.findOne({ _id: objectId });
      if (user) {
        return user.id;
      }
      return undefined;
    } catch (error) {
      console.error('Error finding user ID from ObjectId:', error);
      return undefined;
    }
  }

  private mongoVendorToVendor(mongoVendor: any): Vendor {
    let userId = mongoVendor.userId;
    
    // Convert ObjectId to a string if it's an object
    if (typeof userId === 'object' && userId !== null) {
      // If it's a MongoDB ObjectId, we'll use numerical userId in the response
      // and find the corresponding user in the methods that need it
      userId = mongoVendor.userIdNumber || userId.toString();
    }
    
    // Return the standard structure with properties from schema
    return {
      id: mongoVendor.id,
      userId: userId,
      businessName: mongoVendor.businessName,
      category: mongoVendor.category,
      description: mongoVendor.description,
      services: mongoVendor.services || null,
      businessHours: mongoVendor.businessHours || null,
      coverImage: mongoVendor.coverImage || null,  // Include coverImage field
      rating: mongoVendor.rating || 0,
      reviewCount: mongoVendor.reviewCount || 0
    };
  }

  private mongoServiceToService(mongoService: any): Service {
    return {
      id: mongoService.id,
      vendorId: mongoService.vendorId,
      name: mongoService.name,
      category: mongoService.category || '',
      description: mongoService.description,
      price: mongoService.price,
      duration: mongoService.duration || null,
      location: mongoService.location || null,
      imageUrl: mongoService.imageUrl || null,
      timeSlots: mongoService.timeSlots || [],
      availableDates: mongoService.availableDates || [],
      availability: mongoService.availability !== false,
      createdAt: mongoService.createdAt || new Date()
    };
  }

  private mongoBookingToBooking(mongoBooking: any): Booking {
    return {
      id: mongoBooking.id,
      userId: mongoBooking.userId,
      vendorId: mongoBooking.vendorId,
      serviceId: mongoBooking.serviceId || null,
      date: mongoBooking.date,
      status: mongoBooking.status,
      notes: mongoBooking.notes || null
    };
  }

  private mongoReviewToReview(mongoReview: any): Review {
    return {
      id: mongoReview.id,
      userId: mongoReview.userId,
      vendorId: mongoReview.vendorId,
      rating: mongoReview.rating,
      comment: mongoReview.comment || null,
      createdAt: mongoReview.createdAt
    };
  }
}

// Use MongoDB Storage exclusively
export const storage = new MongoDBStorage();
