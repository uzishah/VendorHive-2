import mongoose from 'mongoose';
import { z } from 'zod';

// Booking Mongoose Schema
const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
  serviceId: { 
    type: Number,
    validate: {
      validator: function(v: number): boolean {
        return !isNaN(v) && v > 0;
      },
      message: (props: any) => `${props.value} is not a valid service ID!`
    }
  },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  notes: String,
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

// TypeScript interface for Booking
export interface Booking {
  id: number;
  userId: number;
  vendorId: number;
  serviceId?: number;
  date: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
}

// Zod validation schema
export const bookingSchema_Zod = z.object({
  userId: z.number(),
  vendorId: z.number(),
  serviceId: z.number().optional(),
  date: z.date(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).default("pending"),
  notes: z.string().optional(),
});

// Type for insert operations
export type InsertBooking = z.infer<typeof bookingSchema_Zod>;

// Export Mongoose model
export const BookingModel = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default BookingModel;