import mongoose from 'mongoose';
import { z } from 'zod';

// Review Mongoose Schema
const reviewSchema = new mongoose.Schema({
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
  rating: { type: Number, required: true },
  comment: String,
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
  }
});

// TypeScript interface for Review
export interface Review {
  id: number;
  userId: number;
  vendorId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// Zod validation schema
export const reviewSchema_Zod = z.object({
  userId: z.number(),
  vendorId: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// Type for insert operations
export type InsertReview = z.infer<typeof reviewSchema_Zod>;

// Export Mongoose model
export const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default ReviewModel;