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
  getServicesByVendorId(vendorId: number): Promise<Service[]>;
  
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

  async getServicesByVendorId(vendorId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(
      (service) => service.vendorId === vendorId
    );
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
  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ id });
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
      const vendor = await VendorModel.findOne({ id });
      if (!vendor) return undefined;

      const user = await UserModel.findOne({ id: vendor.userId });
      if (!user) return undefined;

      return {
        ...this.mongoVendorToVendor(vendor),
        user: this.mongoUserToUser(user)
      };
    } catch (error) {
      console.error('Error getting vendor:', error);
      return undefined;
    }
  }

  async getVendorByUserId(userId: number): Promise<Vendor | undefined> {
    try {
      const vendor = await VendorModel.findOne({ userId });
      return vendor ? this.mongoVendorToVendor(vendor) : undefined;
    } catch (error) {
      console.error('Error getting vendor by user ID:', error);
      return undefined;
    }
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    try {
      // Get the next available vendor ID
      const lastVendor = await VendorModel.findOne().sort({ id: -1 });
      const id = lastVendor ? lastVendor.id + 1 : 1;

      const newVendor = new VendorModel({
        ...insertVendor,
        id,
        rating: 0,
        reviewCount: 0
      });

      await newVendor.save();
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
      const vendors = await VendorModel.find();
      const results: (Vendor & { user: User })[] = [];

      for (const vendor of vendors) {
        const user = await UserModel.findOne({ id: vendor.userId });
        if (user) {
          results.push({
            ...this.mongoVendorToVendor(vendor),
            user: this.mongoUserToUser(user)
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error getting all vendors:', error);
      return [];
    }
  }

  async searchVendors(query: string): Promise<(Vendor & { user: User })[]> {
    try {
      const searchRegex = new RegExp(query, 'i');
      const vendors = await VendorModel.find({
        $or: [
          { businessName: searchRegex },
          { category: searchRegex },
          { description: searchRegex }
        ]
      });

      const results: (Vendor & { user: User })[] = [];

      for (const vendor of vendors) {
        const user = await UserModel.findOne({ id: vendor.userId });
        if (user) {
          results.push({
            ...this.mongoVendorToVendor(vendor),
            user: this.mongoUserToUser(user)
          });
        }
      }

      // Also search in users' names and add their vendors
      const users = await UserModel.find({ name: searchRegex });
      for (const user of users) {
        const vendor = await VendorModel.findOne({ userId: user.id });
        if (vendor) {
          // Check if this vendor is already in results
          const exists = results.some(r => r.id === vendor.id);
          if (!exists) {
            results.push({
              ...this.mongoVendorToVendor(vendor),
              user: this.mongoUserToUser(user)
            });
          }
        }
      }

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

      const newService = new ServiceModel({
        ...insertService,
        id
      });

      await newService.save();
      return this.mongoServiceToService(newService);
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
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

  // Booking related methods
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    try {
      // Get the next available booking ID
      const lastBooking = await BookingModel.findOne().sort({ id: -1 });
      const id = lastBooking ? lastBooking.id + 1 : 1;

      const newBooking = new BookingModel({
        ...insertBooking,
        id
      });

      await newBooking.save();
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

      const newReview = new ReviewModel({
        ...insertReview,
        id,
        createdAt: new Date()
      });

      await newReview.save();

      // Update vendor rating and review count
      const vendorReviews = await this.getReviewsByVendorId(insertReview.vendorId);
      const vendor = await VendorModel.findOne({ id: insertReview.vendorId });
      
      if (vendor) {
        const reviewCount = vendorReviews.length + 1;
        const totalRating = vendorReviews.reduce((sum, review) => sum + review.rating, 0) + insertReview.rating;
        const averageRating = Math.round(totalRating / reviewCount);
        
        await VendorModel.findOneAndUpdate(
          { id: insertReview.vendorId },
          { $set: { rating: averageRating, reviewCount } }
        );
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
      id: mongoUser.id,
      name: mongoUser.name,
      username: mongoUser.username,
      email: mongoUser.email,
      password: mongoUser.password,
      role: mongoUser.role,
      profileImage: mongoUser.profileImage || null,
      phone: mongoUser.phone || null,
      bio: mongoUser.bio || null,
      location: mongoUser.location || null,
      joinedAt: mongoUser.joinedAt
    };
  }

  private mongoVendorToVendor(mongoVendor: any): Vendor {
    return {
      id: mongoVendor.id,
      userId: mongoVendor.userId,
      businessName: mongoVendor.businessName,
      category: mongoVendor.category,
      description: mongoVendor.description,
      services: mongoVendor.services || null,
      businessHours: mongoVendor.businessHours || null,
      rating: mongoVendor.rating,
      reviewCount: mongoVendor.reviewCount
    };
  }

  private mongoServiceToService(mongoService: any): Service {
    return {
      id: mongoService.id,
      vendorId: mongoService.vendorId,
      name: mongoService.name,
      description: mongoService.description,
      price: mongoService.price,
      duration: mongoService.duration || null,
      availability: mongoService.availability
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

// Use MongoDB Storage instead of MemStorage
export const storage = new MongoDBStorage();
