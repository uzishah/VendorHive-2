import { z } from "zod";

// Type definitions based on MongoDB models
// These types serve as interfaces to maintain compatibility with existing code

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  password: string;
  role: "vendor" | "user";
  profileImage?: string;
  phone?: string;
  bio?: string;
  location?: string;
  joinedAt: Date;
}

export interface Vendor {
  id: number;
  userId: number | string;
  businessName: string;
  category: string;
  description: string;
  services?: string[];
  businessHours?: Record<string, any>;
  coverImage?: string;
  rating: number;
  reviewCount: number;
}

export interface Service {
  id: number;
  vendorId: number;
  name: string;
  category: string;
  description: string;
  price: string;
  duration?: string;
  location?: string;
  imageUrl?: string;
  timeSlots?: Record<string, any>;
  availableDates?: Record<string, any>;
  availability: boolean;
  createdAt: Date;
}

export interface Booking {
  id: number;
  userId: number;
  vendorId: number;
  serviceId?: number;
  date: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
}

export interface Review {
  id: number;
  userId: number;
  vendorId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// Validation schemas using Zod
export const userSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["vendor", "user"]).default("user"),
  profileImage: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
});

export const vendorSchema = z.object({
  userId: z.union([z.number(), z.string()]),
  businessName: z.string().min(2),
  category: z.string(),
  description: z.string().min(10),
  services: z.array(z.string()).optional(),
  businessHours: z.record(z.any()).optional(),
  coverImage: z.string().optional(),
});

export const serviceSchema = z.object({
  vendorId: z.number(),
  name: z.string().min(2),
  category: z.string(),
  description: z.string().min(10),
  price: z.string(),
  duration: z.string().optional(),
  location: z.string().optional(),
  imageUrl: z.string().optional(),
  timeSlots: z.record(z.any()).optional(),
  availableDates: z.record(z.any()).optional(),
  availability: z.boolean().default(true),
});

export const bookingSchema = z.object({
  userId: z.number(),
  vendorId: z.number(),
  serviceId: z.number().optional(),
  date: z.date(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).default("pending"),
  notes: z.string().optional(),
});

export const reviewSchema = z.object({
  userId: z.number(),
  vendorId: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// Export type aliases for insert operations
export type InsertUser = z.infer<typeof userSchema>;
export type InsertVendor = z.infer<typeof vendorSchema>;
export type InsertService = z.infer<typeof serviceSchema>;
export type InsertBooking = z.infer<typeof bookingSchema>;
export type InsertReview = z.infer<typeof reviewSchema>;
