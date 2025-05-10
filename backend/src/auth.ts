import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Environment variables for JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'vendorhive_secret_key';
const JWT_EXPIRY = '24h';

// Generate JWT token
export const generateToken = (user: User): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    username: user.username
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password with hash
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
