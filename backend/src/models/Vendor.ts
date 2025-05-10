import mongoose from 'mongoose';
import { z } from 'zod';

// Vendor Mongoose Schema
const vendorSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
  },
  businessName: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  services: [String],
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  coverImage: String,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  id: { 
    type: Number, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v: number): boolean {
        return !isNaN(v) && v > 0;
      },
      message: (props: any) => `${props.value} is not a valid positive numeric ID!`
    }
  }
});

// TypeScript interface for Vendor
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

// Zod validation schema
export const vendorSchema_Zod = z.object({
  userId: z.union([z.string(), z.number()]),
  businessName: z.string().min(2),
  category: z.string(),
  description: z.string().min(10),
  services: z.array(z.string()).optional(),
  businessHours: z.record(z.any()).optional(),
  coverImage: z.string().optional(),
});

// Type for insert operations
export type InsertVendor = z.infer<typeof vendorSchema_Zod>;

// Export Mongoose model
export const VendorModel = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);

export default VendorModel;