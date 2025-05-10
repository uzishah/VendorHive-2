import mongoose from 'mongoose';
import { z } from 'zod';

// User Mongoose Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['vendor', 'user'], default: 'user' },
  profileImage: String,
  phone: String,
  bio: String,
  location: String,
  joinedAt: { type: Date, default: Date.now }
});

// TypeScript interface for User
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

// Zod validation schema
export const userSchema_Zod = z.object({
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

// Type for insert operations
export type InsertUser = z.infer<typeof userSchema_Zod>;

// Export Mongoose model
export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

export default UserModel;