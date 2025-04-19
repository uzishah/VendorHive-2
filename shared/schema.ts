import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema with role field to distinguish between vendors and regular users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["vendor", "user"] }).notNull().default("user"),
  profileImage: text("profile_image"),
  phone: text("phone"),
  bio: text("bio"),
  location: text("location"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

// Vendor-specific information
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  businessName: text("business_name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  services: text("services").array(),
  businessHours: jsonb("business_hours"),
  coverImage: text("cover_image"),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
});

// Services that vendors offer
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  price: text("price").notNull(),
  duration: text("duration"),
  location: text("location"),
  imageUrl: text("image_url"),
  timeSlots: jsonb("time_slots"),
  availableDates: jsonb("available_dates"),
  availability: boolean("availability").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bookings made by users
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  serviceId: integer("service_id").references(() => services.id),
  date: timestamp("date").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "completed", "cancelled"] }).notNull().default("pending"),
  notes: text("notes"),
});

// Reviews left by users for vendors
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define schemas and types for insertion
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  joinedAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  rating: true,
  reviewCount: true,
});

export const insertServiceSchema = createInsertSchema(services);

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
