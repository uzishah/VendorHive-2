import { apiRequest } from '@/lib/queryClient';
import { Service, Vendor } from '@shared/schema';

// Interface for a service with optional vendor information
export interface ServiceWithVendor extends Service {
  vendorInfo?: {
    id: number;
    businessName: string;
    category: string;
    rating: number;
    coverImage?: string;
  };
}

// Get all vendors
export const getVendors = async (searchQuery?: string) => {
  const endpoint = searchQuery ? `/api/vendors?search=${encodeURIComponent(searchQuery)}` : '/api/vendors';
  const response = await apiRequest('GET', endpoint);
  if (!response.ok) {
    throw new Error('Failed to fetch vendors');
  }
  return response.json();
};

// Get a single vendor by ID
export const getVendorById = async (id: number) => {
  const response = await apiRequest('GET', `/api/vendors/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch vendor');
  }
  return response.json();
};

// Get vendor by user ID
export const getVendorByUserId = async (userId: number) => {
  try {
    const response = await apiRequest('GET', `/api/vendors/user/${userId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get vendor by user ID');
    }
    return response.json();
  } catch (error) {
    console.error('Failed to get vendor by user ID:', error);
    throw error;
  }
};

// Get all services for a vendor
export const getVendorServices = async (vendorId: number) => {
  const response = await apiRequest('GET', `/api/vendors/${vendorId}/services`);
  if (!response.ok) {
    throw new Error('Failed to fetch vendor services');
  }
  return response.json();
};

// Create a new service
export const createService = async (serviceData: Partial<Service>) => {
  const response = await apiRequest('POST', '/api/services', serviceData);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create service');
  }
  return response.json();
};

// Update a service
export const updateService = async (id: number, serviceData: Partial<Service>) => {
  const response = await apiRequest('PUT', `/api/services/${id}`, serviceData);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update service');
  }
  return response.json();
};

// Delete a service
export const deleteService = async (id: number) => {
  const response = await apiRequest('DELETE', `/api/services/${id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete service');
  }
  return true;
};

// Get all services from all vendors
export const getAllServices = async (): Promise<ServiceWithVendor[]> => {
  try {
    // First get all vendors
    const vendors = await getVendors();
    
    // For each vendor, get their services
    const servicesPromises = vendors.map(async (vendor: any) => {
      const services = await getVendorServices(vendor.id);
      
      // Add vendor info to each service for display
      return services.map((service: Service): ServiceWithVendor => ({
        ...service,
        vendorInfo: {
          id: vendor.id,
          businessName: vendor.businessName,
          category: vendor.category,
          rating: vendor.rating,
          coverImage: vendor.coverImage
        }
      }));
    });
    
    // Combine all services
    const allServicesArrays = await Promise.all(servicesPromises);
    const allServices = allServicesArrays.flat();
    
    return allServices;
  } catch (error) {
    console.error('Error fetching all services:', error);
    return [];
  }
};

// Repair a vendor profile when it's missing for a vendor user
export const repairVendorProfile = async () => {
  try {
    const response = await apiRequest('GET', '/api/vendors/repair');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to repair vendor profile');
    }
    return response.json();
  } catch (error) {
    console.error('Failed to repair vendor profile:', error);
    throw error;
  }
};

// Create a booking
export const createBooking = async (bookingData: any) => {
  try {
    const response = await apiRequest('POST', '/api/bookings', bookingData);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create booking');
    }
    return response.json();
  } catch (error) {
    console.error('Failed to create booking:', error);
    throw error;
  }
};

// Create a review
export const createReview = async (reviewData: any) => {
  try {
    const response = await apiRequest('POST', '/api/reviews', reviewData);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create review');
    }
    return response.json();
  } catch (error) {
    console.error('Failed to create review:', error);
    throw error;
  }
};

// Get user bookings
export const getUserBookings = async () => {
  try {
    const response = await apiRequest('GET', '/api/bookings/user');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch user bookings');
    }
    return response.json();
  } catch (error) {
    console.error('Failed to fetch user bookings:', error);
    throw error;
  }
};

// Get vendor bookings
export const getVendorBookings = async () => {
  try {
    const response = await apiRequest('GET', '/api/bookings/vendor');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch vendor bookings');
    }
    return response.json();
  } catch (error) {
    console.error('Failed to fetch vendor bookings:', error);
    throw error;
  }
};

// Update booking status
export const updateBookingStatus = async (id: number, status: string, reason?: string) => {
  try {
    const response = await apiRequest('PUT', `/api/bookings/${id}/status`, { status, reason });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update booking status');
    }
    return response.json();
  } catch (error) {
    console.error('Failed to update booking status:', error);
    throw error;
  }
};

// Get vendor reviews
export const getVendorReviews = async (vendorId: number) => {
  try {
    const response = await apiRequest('GET', `/api/vendors/${vendorId}/reviews`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch vendor reviews');
    }
    return response.json();
  } catch (error) {
    console.error('Failed to fetch vendor reviews:', error);
    throw error;
  }
};

// Type definitions
export interface Booking {
  id: number;
  userId: number;
  vendorId: number;
  serviceId?: number;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  userName?: string;
  serviceName?: string;
  vendorBusinessName?: string;
  serviceDetails?: string;
  time?: string;
  location?: string;
}

// Types
export type { Service };