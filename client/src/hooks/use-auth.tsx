import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
      
      // Save to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.vendorProfile) {
        localStorage.setItem('vendorProfile', JSON.stringify(data.vendorProfile));
      }
      
      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.user.name}!`,
      });
      
      // Redirect to appropriate dashboard based on user role
      if (data.user.role === 'vendor') {
        window.location.href = '/dashboard';
      } else {
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
      const registerData = {
        ...userData,
        role: isVendor ? 'vendor' : 'user',
      };
      
      if (isVendor && vendorData) {
        registerData.vendor = vendorData;
      }
      
      const response = await apiRequest('POST', '/api/auth/register', registerData);
      const data = await response.json();
      
      setUser(data.user);
      setToken(data.token);
      setVendorProfile(data.vendorProfile || null);
      
      // Save to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.vendorProfile) {
        localStorage.setItem('vendorProfile', JSON.stringify(data.vendorProfile));
      }
      
      toast({
        title: 'Registration successful',
        description: `Welcome to VendorHive, ${data.user.name}!`,
      });
      
      // Redirect to appropriate dashboard based on user role
      if (data.user.role === 'vendor') {
        window.location.href = '/dashboard';
      } else {
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
      updateVendorProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
