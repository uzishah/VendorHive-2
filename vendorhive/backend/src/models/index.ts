// Export all models and their types from a single file for easier imports

// User exports
export { default as UserModel } from './User';
export type { User, InsertUser } from './User';

// Vendor exports
export { default as VendorModel } from './Vendor';
export type { Vendor, InsertVendor } from './Vendor';

// Service exports
export { default as ServiceModel } from './Service';
export type { Service, InsertService } from './Service';

// Booking exports
export { default as BookingModel } from './Booking';
export type { Booking, InsertBooking } from './Booking';

// Review exports
export { default as ReviewModel } from './Review';
export type { Review, InsertReview } from './Review';

// Also export the Zod schemas for validation
export { userSchema_Zod } from './User';
export { vendorSchema_Zod } from './Vendor';
export { serviceSchema_Zod } from './Service';
export { bookingSchema_Zod } from './Booking';
export { reviewSchema_Zod } from './Review';