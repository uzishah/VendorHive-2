import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { repairVendorProfile as apiRepairVendorProfile } from '@/services/api';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: 'user' | 'vendor';
  profileImage?: string;
  phone?: string;
  bio?: string;
  location?: string;
}

interface VendorProfile {
  id: number;
  userId: number;
  businessName: string;
  category: string;
  description: string;
  services?: string[];
  businessHours?: Record<string, any>;
  coverImage?: string;
  rating: number;
  reviewCount: number;
}

interface AuthContextType {
  user: User | null;
  vendorProfile: VendorProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any, isVendor: boolean, vendorData?: any) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  updateVendorProfile: (vendorData: Partial<VendorProfile>) => Promise<void>;
  repairVendorProfile: () => Promise<VendorProfile | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  vendorProfile: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateProfile: async () => {},
  updateVendorProfile: async () => {},
  repairVendorProfile: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Load user from localStorage on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedVendorProfile = localStorage.getItem('vendorProfile');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      if (storedVendorProfile) {
        setVendorProfile(JSON.parse(storedVendorProfile));
      }
    }
    
    setIsLoading(false);
  }, []);

  // Fetch user profile when token changes
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setVendorProfile(data.vendorProfile || null);
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.vendorProfile) {
          localStorage.setItem('vendorProfile', JSON.stringify(data.vendorProfile));
        } else {
          localStorage.removeItem('vendorProfile');
        }
      } else if (response.status === 401) {
        // Token expired or invalid
        logout();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      const data = await response.json();
      
      setUser(data.user);
      setToken(data.token);
      setVendorProfile(data.vendorProfile || null);
      
      // Save login timestamp to prevent redirect loops
      const timestamp = new Date().getTime().toString();
      localStorage.setItem('registeredAt', timestamp);
      
      // Save to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.vendorProfile) {
        localStorage.setItem('vendorProfile', JSON.stringify(data.vendorProfile));
        console.log('Vendor profile saved during login:', data.vendorProfile);
      }
      
      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.user.name}!`,
      });
      
      // Redirect to appropriate dashboard based on user role and profile
      if (data.user.role === 'vendor' && data.vendorProfile) {
        console.log('Redirecting to vendor dashboard after login');
        window.location.href = '/dashboard';
      } else {
        console.log('Redirecting to home page after login');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any, isVendor: boolean, vendorData?: any) => {
    setIsLoading(true);
    
    try {
      // CRITICAL FIX: Always force role to be 'vendor' if isVendor flag is true
      // This ensures the server receives the correct role regardless of what's in userData
      const registerData = {
        ...userData,
        role: isVendor ? 'vendor' : 'user', // Override whatever role is in userData
      };
      
      console.log('Registration data being sent to server:', {
        originalRole: userData.role,
        correctedRole: registerData.role,
        isVendorFlag: isVendor,
        hasVendorData: !!vendorData
      });
      
      // CRITICAL FIX: Always include vendor data for vendor registrations
      // This ensures vendor profile creation on the server
      if (isVendor) {
        // Use provided vendor data or create default data
        registerData.vendor = vendorData || {
          businessName: userData.name + "'s Business",
          category: "General Services",
          description: "A new vendor on VendorHive"
        };
      }
      
      const response = await apiRequest('POST', '/api/auth/register', registerData);
      const data = await response.json();
      
      console.log('Registration response from server:', {
        receivedUserRole: data.user.role,
        hasVendorProfile: !!data.vendorProfile
      });
      
      setUser(data.user);
      setToken(data.token);
      setVendorProfile(data.vendorProfile || null);
      
      // Save registration timestamp to prevent redirect loops
      const timestamp = new Date().getTime().toString();
      localStorage.setItem('registeredAt', timestamp);
      
      // Save to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.vendorProfile) {
        localStorage.setItem('vendorProfile', JSON.stringify(data.vendorProfile));
        console.log('Vendor profile saved:', data.vendorProfile);
      }
      
      toast({
        title: 'Registration successful',
        description: `Welcome to VendorHive, ${data.user.name}!`,
      });
      
      // CRITICAL FIX: Use isVendor flag as the primary indicator for redirection,
      // rather than relying solely on the server response which might be inconsistent
      if (isVendor) {
        console.log('Redirecting to vendor dashboard (based on isVendor flag)');
        window.location.href = '/dashboard';
      } else if (data.user.role === 'vendor') {
        console.log('Redirecting to vendor dashboard (based on server response)');
        window.location.href = '/dashboard'; 
      } else {
        console.log('Redirecting to user home page');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Could not create account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setVendorProfile(null);
    
    // Remove from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('vendorProfile');
    
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
    });
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!token) {
      toast({
        title: 'Authentication error',
        description: 'Please login to update your profile',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData),
        credentials: 'include'
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser);
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify({ ...user, ...updatedUser }));
        
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Could not update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Could not update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateVendorProfile = async (vendorData: Partial<VendorProfile>) => {
    if (!token || !user || user.role !== 'vendor') {
      toast({
        title: 'Authentication error',
        description: 'Vendor authorization required',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/vendors/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(vendorData),
        credentials: 'include'
      });
      
      if (response.ok) {
        const updatedVendorProfile = await response.json();
        setVendorProfile(prev => prev ? { ...prev, ...updatedVendorProfile } : updatedVendorProfile);
        
        // Update localStorage
        localStorage.setItem('vendorProfile', JSON.stringify({ ...vendorProfile, ...updatedVendorProfile }));
        
        toast({
          title: 'Vendor profile updated',
          description: 'Your vendor profile has been updated successfully',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Could not update vendor profile');
      }
    } catch (error) {
      console.error('Update vendor profile error:', error);
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Could not update vendor profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Special function to repair or create a vendor profile when missing
  const repairVendorProfile = async (): Promise<VendorProfile | null> => {
    if (!token || !user || user.role !== 'vendor') {
      toast({
        title: 'Authentication error',
        description: 'Vendor authorization required',
        variant: 'destructive',
      });
      return null;
    }
    
    setIsLoading(true);
    console.log('Attempting to repair vendor profile for user:', user.id, user.username);
    
    try {
      // Use the repair API endpoint
      const result = await apiRepairVendorProfile();
      
      if (result.vendor) {
        // Update local state with the new vendor profile
        setVendorProfile(result.vendor);
        
        // Update localStorage
        localStorage.setItem('vendorProfile', JSON.stringify(result.vendor));
        
        toast({
          title: result.message || 'Vendor profile created',
          description: 'Your vendor profile has been successfully created/repaired.',
        });
        
        return result.vendor;
      }
      
      return null;
    } catch (error) {
      console.error('Vendor profile repair error:', error);
      toast({
        title: 'Repair failed',
        description: error instanceof Error ? error.message : 'Could not repair vendor profile',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      vendorProfile,
      token, 
      isLoading, 
      isAuthenticated: !!user,
      login, 
      register, 
      logout,
      updateProfile,
      updateVendorProfile,
      repairVendorProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
