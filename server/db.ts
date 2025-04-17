import { MongoClient, ServerApiVersion } from 'mongodb';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection URI (from environment variable)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined');
  throw new Error('Please define the MONGODB_URI environment variable');
}

// MongoDB Client setup
export const client = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// For direct MongoDB client usage
export const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db('vendorhive');
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw error;
  }
};

// For Mongoose ORM usage
export const connectMongoose = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Mongoose connected to MongoDB');
  } catch (error) {
    console.error('Mongoose failed to connect', error);
    throw error;
  }
};

// Define Mongoose models
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

const vendorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  services: [String],
  businessHours: Object,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
});

const serviceSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
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
  createdAt: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  notes: String
});

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  rating: { type: Number, required: true },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

// Only define the models if they don't already exist
export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export const VendorModel = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);
export const ServiceModel = mongoose.models.Service || mongoose.model('Service', serviceSchema);
export const BookingModel = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema);

// Helper function to disconnect from MongoDB
export const disconnect = async () => {
  await mongoose.disconnect();
  await client.close();
};