import { apiRequest } from "@/lib/queryClient";

export interface Vendor {
  id: number;
  userId: number;
  businessName: string;
  category: string;
  description: string;
  services?: string[];
  businessHours?: Record<string, any>;
  rating: number;
  reviewCount: number;
  user: {
    id: number;
    name: string;
    email: string;
    username: string;
    profileImage?: string;
  };
}

export interface Service {
  id: number;
  vendorId: number;
  name: string;
  description: string;
  price: string;
  duration?: string;
  availability: boolean;
}

export interface Booking {
  id: number;
  userId: number;
  vendorId: number;
  serviceId?: number;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Review {
  id: number;
  userId: number;
  vendorId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    username: string;
    profileImage?: string;
  };
}

// Vendor APIs
export const getVendors = async (search?: string): Promise<Vendor[]> => {
  const url = search ? `/api/vendors?search=${encodeURIComponent(search)}` : '/api/vendors';
  const response = await apiRequest('GET', url);
  return response.json();
};

export const getVendorById = async (id: number): Promise<{
  id: number;
  userId: number;
  businessName: string;
  category: string;
  description: string;
  services?: string[];
  businessHours?: Record<string, any>;
  rating: number;
  reviewCount: number;
  user: {
    id: number;
    name: string;
    email: string;
    username: string;
    profileImage?: string;
  };
  services: Service[];
  reviews: Review[];
}> => {
  const response = await apiRequest('GET', `/api/vendors/${id}`);
  return response.json();
};

// Service APIs
export const getVendorServices = async (vendorId: number): Promise<Service[]> => {
  const response = await apiRequest('GET', `/api/vendors/${vendorId}/services`);
  return response.json();
};

export const createService = async (serviceData: Omit<Service, 'id'>): Promise<Service> => {
  const response = await apiRequest('POST', '/api/services', serviceData);
  return response.json();
};

// Booking APIs
export const getUserBookings = async (): Promise<Booking[]> => {
  const response = await apiRequest('GET', '/api/bookings/user');
  return response.json();
};

export const getVendorBookings = async (): Promise<Booking[]> => {
  const response = await apiRequest('GET', '/api/bookings/vendor');
  return response.json();
};

export const createBooking = async (bookingData: Omit<Booking, 'id'>): Promise<Booking> => {
  const response = await apiRequest('POST', '/api/bookings', bookingData);
  return response.json();
};

export const updateBookingStatus = async (id: number, status: string): Promise<Booking> => {
  const response = await apiRequest('PUT', `/api/bookings/${id}/status`, { status });
  return response.json();
};

// Review APIs
export const getVendorReviews = async (vendorId: number): Promise<Review[]> => {
  const response = await apiRequest('GET', `/api/vendors/${vendorId}/reviews`);
  return response.json();
};

export const createReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'user'>): Promise<Review> => {
  const response = await apiRequest('POST', '/api/reviews', reviewData);
  return response.json();
};

// Vendor management APIs
export const getVendorByUserId = async (userId: number): Promise<Vendor | null> => {
  const response = await apiRequest('GET', `/api/vendors/user/${userId}`);
  return response.json();
};

export const updateVendor = async (id: number, vendorData: Partial<Vendor>): Promise<Vendor> => {
  const response = await apiRequest('PUT', `/api/vendors/${id}`, vendorData);
  return response.json();
};
