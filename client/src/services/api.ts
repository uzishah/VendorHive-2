import { apiRequest } from "@/lib/queryClient";

export interface Vendor {
  id: number;
  userId: number;
  businessName: string;
  category: string;
  description: string;
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
  category: string;
  description: string;
  price: string;
  duration?: string;
  location?: string;
  imageUrl?: string;
  timeSlots?: { day: string; startTime: string; endTime: string }[];
  availableDates?: Date[];
  availability: boolean;
  createdAt?: Date;
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
  serviceList: Service[];
  reviews: Review[];
}> => {
  const response = await apiRequest('GET', `/api/vendors/${id}`);
  return response.json();
};

// Service APIs
export const getVendorServices = async (vendorId: number): Promise<Service[]> => {
  try {
    // Use apiRequest helper which handles auth token consistently
    const response = await apiRequest('GET', `/api/vendors/${vendorId}/services`);
    console.log('Get vendor services response:', response.status);
    return response.json();
  } catch (error) {
    console.error('Get vendor services error:', error);
    throw new Error('Failed to fetch vendor services: ' + (error instanceof Error ? error.message : String(error)));
  }
};

export const createService = async (serviceData: Omit<Service, 'id'>): Promise<Service> => {
  try {
    // Use apiRequest helper which handles auth token
    const response = await apiRequest('POST', '/api/services', serviceData);
    console.log('Service creation response:', response.status);
    return response.json();
  } catch (error) {
    console.error('Service creation error:', error);
    throw new Error('Failed to create service: ' + (error instanceof Error ? error.message : String(error)));
  }
};

export const updateService = async (id: number, serviceData: Partial<Service>): Promise<Service> => {
  try {
    // Use apiRequest helper which handles auth token
    const response = await apiRequest('PUT', `/api/services/${id}`, serviceData);
    console.log('Service update response:', response.status);
    return response.json();
  } catch (error) {
    console.error('Service update error:', error);
    throw new Error('Failed to update service: ' + (error instanceof Error ? error.message : String(error)));
  }
};

export const deleteService = async (id: number): Promise<boolean> => {
  try {
    // Use apiRequest helper which handles auth token
    const response = await apiRequest('DELETE', `/api/services/${id}`);
    console.log('Service delete response:', response.status);
    return true;
  } catch (error) {
    console.error('Service delete error:', error);
    throw new Error('Failed to delete service: ' + (error instanceof Error ? error.message : String(error)));
  }
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
