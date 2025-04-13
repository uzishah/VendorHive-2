import { 
  users, type User, type InsertUser,
  vendors, type Vendor, type InsertVendor,
  services, type Service, type InsertService,
  bookings, type Booking, type InsertBooking,
  reviews, type Review, type InsertReview
} from "@shared/schema";
import { Client } from '@neondatabase/serverless';

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

export const storage = new MemStorage();
