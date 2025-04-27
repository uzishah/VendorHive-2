import { MongoClient, ServerApiVersion } from 'mongodb';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from the .env file in the project root
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('No .env file found, loading from process environment');
  dotenv.config();
}

// Log all environment variable names (not values) for debugging
console.log('Available environment variables:', Object.keys(process.env));

// MongoDB connection URI (from environment variable)
// First priority: process.env directly
// Second priority: hardcoded URI from the .env file as a fallback
let MONGODB_URI = process.env.MONGODB_URI;

// Log environment variable status without exposing the value
console.log(`MONGODB_URI environment variable is ${MONGODB_URI ? 'defined' : 'not defined'}`);

// If not found, try a fallback
if (!MONGODB_URI) {
  console.log('Trying fallback MongoDB URI');
  MONGODB_URI = 'mongodb+srv://uzishah708:LTGrR4soDZ41yszv@microfinance.fwfiv.mongodb.net/vendorhive';
  console.log('Using fallback MongoDB URI');
}

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined even after fallback');
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
  } // Numeric ID field for internal references
});

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