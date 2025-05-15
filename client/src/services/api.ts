// API service for communicating with the backend

// Backend API URL
// In Replit, the backend and frontend are served from the same origin
// So we just use a relative URL
const BACKEND_URL = '';
console.log(`API Service using relative URLs`);

export const API_BASE_URL = `/api`;

// This variable can be toggled for debug mode
const DEBUG_API = true;

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

export const getVendorReviews = async (vendorId: number) => {
  return api.reviews.getByVendorId(vendorId);
};

export const createReview = async (reviewData: any) => {
  return api.reviews.create(reviewData);
};

export const repairVendorProfile = async () => {
  // This function requests the server to repair/create a vendor profile for the current user
  return fetchWithErrorHandling(`${API_BASE_URL}/vendors/repair`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    }
  });
};

// Generic fetch function with error handling
async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  try {
    // Add Accept header to request JSON
    const headers = options.headers || {};
    if (!('Accept' in headers)) {
      headers['Accept'] = 'application/json';
    }
    options.headers = headers;
    
    // Make sure URL is properly prefixed with /api
    if (!url.startsWith('/api') && !url.startsWith('http')) {
      url = `/api/${url}`;
    }
    
    console.log(`Making API request to: ${url}`);
    const response = await fetch(url, options);
    
    // Handle non-2xx responses
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      
      // Check content type to avoid trying to parse HTML as JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        // For HTML responses (like 404 pages), don't try to parse as JSON
        const htmlText = await response.text();
        console.error('Received HTML instead of JSON:', htmlText.substring(0, 150) + '...');
        
        if (DEBUG_API) {
          // In debug mode, extract more details about the error
          const errorMatch = htmlText.match(/<pre>(.*?)<\/pre>/s);
          const errorDetails = errorMatch ? errorMatch[1] : 'Unknown error';
          throw new Error(`Received HTML instead of JSON: ${errorDetails}`);
        } else {
          throw new Error(`Received HTML instead of JSON. Server returned ${response.status}: ${response.statusText}`);
        }
      }
      
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      } catch (jsonError) {
        // If we can't parse the error as JSON, use a generic error message
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
    }
    
    // Parse JSON response
    console.log(`API request to ${url} successful`);
    
    // Check if the response is empty before trying to parse JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.log('Empty response received');
      return {}; // Return empty object for empty responses
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      
      if (text.includes('<!DOCTYPE html>')) {
        console.error('Response text (HTML):', text.substring(0, 150) + '...');
        throw new Error('Received HTML page instead of JSON. The API endpoint might not exist or is not returning valid JSON.');
      } else {
        console.error('Response text:', text.substring(0, 150) + '...');
        throw new Error('Invalid JSON response from server');
      }
    }
  } catch (error) {
    console.error('API request failed:', error);
    // Rethrow with more context if it's a network error
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Network error: Could not connect to API endpoint ${url}. Make sure the server is running.`);
    }
    throw error;
  }
}

// Function to include authentication token in requests
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
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