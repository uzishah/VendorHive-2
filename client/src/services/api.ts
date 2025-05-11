// API service for communicating with the backend

// Backend API URL (running on different port)
export const API_BASE_URL = 'http://localhost:4000/api';

// Type definition for Service with Vendor information
export interface ServiceWithVendor {
  id: number;
  vendorId: number;
  name: string;
  category: string;
  description: string;
  price: string;
  duration?: string;
  location?: string;
  imageUrl?: string;
  timeSlots?: Record<string, any>;
  availableDates?: Record<string, any>;
  availability: boolean;
  createdAt: Date;
  vendor?: {
    id: number;
    businessName: string;
    category: string;
    rating: number;
    reviewCount: number;
    user: {
      name: string;
      profileImage?: string;
    };
  };
}

// Export individual functions to maintain compatibility with existing code
export const getVendorById = async (id: number) => {
  return api.vendors.getById(id);
};

export const getVendorByUserId = async (userId: number | string) => {
  // Special endpoint to get vendor data by user ID
  return fetchWithErrorHandling(`${API_BASE_URL}/vendors/user/${userId}`, {
    headers: getAuthHeaders(),
  });
};

export const getVendorServices = async (vendorId: number) => {
  return api.services.getByVendorId(vendorId);
};

export const getVendors = async (searchQuery?: string) => {
  if (searchQuery && searchQuery.trim() !== '') {
    return api.vendors.search(searchQuery);
  }
  return api.vendors.getAll();
};

export const getAllServices = async (): Promise<ServiceWithVendor[]> => {
  // Fetch all services from various vendors
  const response = await fetchWithErrorHandling(`${API_BASE_URL}/services`, {
    headers: getAuthHeaders(),
  });
  
  // The backend should be returning services with associated vendor data
  return response;
};

export const getUserBookings = async () => {
  return api.bookings.getByUserId();
};

export const getVendorBookings = async () => {
  return api.bookings.getByVendorId();
};

export const updateBookingStatus = async (id: number, status: string) => {
  return api.bookings.updateStatus(id, status);
};

export const createService = async (serviceData: any) => {
  return api.services.create(serviceData);
};

export const createBooking = async (bookingData: any) => {
  return api.bookings.create(bookingData);
};

export const createReview = async (reviewData: any) => {
  return api.reviews.create(reviewData);
};

export const repairVendorProfile = async (vendorId: number, profileData: any) => {
  // This function does not exist in the original API, so we need to implement it
  return fetchWithErrorHandling(`${API_BASE_URL}/vendors/${vendorId}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });
};

// Generic fetch function with error handling
async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, options);
    
    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'An unknown error occurred'
      }));
      
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }
    
    // Parse JSON response
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Function to include authentication token in requests
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('authToken');
  // Always return a valid Record<string, string>, even if empty
  return token ? { 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' };
}

// API functions
export const api = {
  // Auth endpoints
  auth: {
    login: async (email: string, password: string) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
    },
    
    register: async (userData: any) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
    },
    
    logout: async () => {
      localStorage.removeItem('authToken');
      return { success: true };
    }
  },
  
  // Vendor endpoints
  vendors: {
    getAll: async () => {
      return fetchWithErrorHandling(`${API_BASE_URL}/vendors`, {
        headers: getAuthHeaders(),
      });
    },
    
    getById: async (id: number) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/vendors/${id}`, {
        headers: getAuthHeaders(),
      });
    },
    
    search: async (query: string) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/vendors/search?q=${encodeURIComponent(query)}`, {
        headers: getAuthHeaders(),
      });
    }
  },
  
  // Service endpoints
  services: {
    getByVendorId: async (vendorId: number) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/services/vendor/${vendorId}`, {
        headers: getAuthHeaders(),
      });
    },
    
    create: async (serviceData: any) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });
    },
    
    update: async (id: number, serviceData: any) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/services/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });
    },
    
    delete: async (id: number) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/services/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    }
  },
  
  // Booking endpoints
  bookings: {
    getByUserId: async () => {
      return fetchWithErrorHandling(`${API_BASE_URL}/bookings/user`, {
        headers: getAuthHeaders(),
      });
    },
    
    getByVendorId: async () => {
      return fetchWithErrorHandling(`${API_BASE_URL}/bookings/vendor`, {
        headers: getAuthHeaders(),
      });
    },
    
    create: async (bookingData: any) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
    },
    
    updateStatus: async (id: number, status: string) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
    }
  },
  
  // Review endpoints
  reviews: {
    getByVendorId: async (vendorId: number) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/reviews/vendor/${vendorId}`, {
        headers: getAuthHeaders(),
      });
    },
    
    create: async (reviewData: any) => {
      return fetchWithErrorHandling(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
    }
  }
};

export default api;