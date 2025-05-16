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

// Import models from separate files
import { 
  UserModel, 
  VendorModel, 
  ServiceModel, 
  BookingModel, 
  ReviewModel 
} from './models';

// Re-export models
export { 
  UserModel, 
  VendorModel, 
  ServiceModel, 
  BookingModel, 
  ReviewModel 
};

// Helper function to disconnect from MongoDB
export const disconnect = async () => {
  await mongoose.disconnect();
  await client.close();
};