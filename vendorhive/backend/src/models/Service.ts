import mongoose from 'mongoose';
import { z } from 'zod';

// Service Mongoose Schema
const serviceSchema = new mongoose.Schema({
  vendorId: { 
    type: Number, 
    required: true, 
    validate: {
      validator: function(v: number): boolean {
        return !isNaN(v) && v > 0;
      },
      message: (props: any) => `${props.value} is not a valid vendor ID!`
    }
  },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: String, required: true },
  duration: String,
  location: String,
  imageUrl: String,
  timeSlots: [{ 
    day: String,
    startTime: String,
    endTime: String 
  }],
  availableDates: [Date],
  availability: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
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
  } // Numeric ID field for internal references
});

// TypeScript interface for Service
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

// Zod validation schema
export const serviceSchema_Zod = z.object({
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

// Type for insert operations
export type InsertService = z.infer<typeof serviceSchema_Zod>;

// Export Mongoose model
export const ServiceModel = mongoose.models.Service || mongoose.model('Service', serviceSchema);

export default ServiceModel;