import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';

// Extend Express request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Authentication middleware to verify JWT token
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('Auth middleware received token:', token ? 'Yes (token present)' : 'No token');
    console.log('Auth header:', authHeader);
    
    if (!token) {
      console.log('Rejecting request: Missing token');
      return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }
    
    const user = verifyToken(token);
    
    if (!user) {
      console.log('Rejecting request: Invalid token');
      return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
    }
    
    console.log('Authentication successful for user:', user.id, user.username, 'Role:', user.role);
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication error occurred' });
  }
};

// Role-based authorization middleware
export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

// Vendor authorization middleware - ensures vendor can only modify their own data
export const authorizeVendor = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: Authentication required' });
  }
  
  if (req.user.role !== 'vendor') {
    return res.status(403).json({ message: 'Forbidden: Vendor access required' });
  }
  
  // Check if the vendor ID in the request params matches the user ID
  const vendorId = parseInt(req.params.id);
  if (isNaN(vendorId) || vendorId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden: You can only modify your own vendor profile' });
  }
  
  next();
};
