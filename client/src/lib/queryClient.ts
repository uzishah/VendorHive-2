import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Determine API base URL dynamically based on environment
// In development with separated services: use explicit backend URL
// In production or integrated mode: use relative URL
const isProduction = process.env.NODE_ENV === 'production';
const isReplit = typeof window !== 'undefined' && window.location.hostname.includes('.replit.app');

// Default to relative URL which works in integrated mode
let BACKEND_URL = '';

// Only use absolute URL when explicitly running in development mode with separated services
// and not running in the Replit environment
if (!isProduction && !isReplit && typeof window !== 'undefined' && window.location.port === '3000') {
  BACKEND_URL = 'http://localhost:5000';
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    
    // Check if we're getting HTML instead of JSON
    if (contentType && contentType.includes('text/html')) {
      const htmlText = await res.text();
      const preview = htmlText.substring(0, 150) + '...';
      console.error('Received HTML instead of JSON:', preview);
      throw new Error(`${res.status}: Received HTML instead of JSON response. The API endpoint may not exist.`);
    } else {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Set up headers with Content-Type and Authorization if token exists
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    
    if (data) {
      headers["Content-Type"] = "application/json";
    }
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log(`API Request: ${method} ${url}`);
    console.log(`With token: ${token ? 'Yes' : 'No'}`);
    
    // Make sure we're using the API route prefixed with /api
    let fullUrl = url;
    if (!url.startsWith('/api') && !url.startsWith('http')) {
      fullUrl = `/api/${url}`;
    }
    
    // For separated mode in development, prefix with BACKEND_URL
    if (BACKEND_URL && !fullUrl.startsWith('http')) {
      fullUrl = `${BACKEND_URL}${fullUrl}`;
    }
    
    // Explicitly adding a query parameter to make sure we get JSON back
    if (fullUrl.includes('?')) {
      fullUrl += '&format=json';
    } else {
      fullUrl += '?format=json';
    }
    
    console.log(`Making API request to: ${fullUrl}`);
    
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      console.error(`API Error: ${res.status} ${res.statusText}`);
      
      // Check content type to avoid trying to parse HTML as JSON
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const htmlText = await res.text();
        console.error('Received HTML instead of JSON:', htmlText.substring(0, 150) + '...');
        throw new Error(`Received HTML instead of JSON. Server returned ${res.status}: ${res.statusText}`);
      }
    }

    return res;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Set up headers with Authorization if token exists
      const headers: Record<string, string> = {
        'Accept': 'application/json',  // Explicitly request JSON responses
        'Content-Type': 'application/json'
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      console.log(`Query: ${queryKey[0]}`);
      console.log(`With token: ${token ? 'Yes' : 'No'}`);
      
      // Use URL directly if it starts with /api, otherwise prefix it
      const url = queryKey[0] as string;
      
      // Make sure we're using the API route prefixed with /api
      let fullUrl = url;
      if (!url.startsWith('/api') && !url.startsWith('http')) {
        fullUrl = `/api/${url}`;
      }
      
      // For separated mode in development, prefix with BACKEND_URL
      if (BACKEND_URL && !fullUrl.startsWith('http')) {
        fullUrl = `${BACKEND_URL}${fullUrl}`;
      }
      
      console.log(`Making query to: ${fullUrl}`);
      
      // Explicitly adding a query parameter to make sure we get JSON back
      if (fullUrl.includes('?')) {
        fullUrl += '&format=json';
      } else {
        fullUrl += '?format=json';
      }
      
      const res = await fetch(fullUrl, {
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('Query 401 Unauthorized, returning null');
        return null;
      }

      if (!res.ok) {
        console.error(`Query Error: ${res.status} ${res.statusText}`);
        
        // Check content type to avoid trying to parse HTML as JSON
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          const htmlText = await res.text();
          console.error('Received HTML instead of JSON:', htmlText.substring(0, 150) + '...');
          throw new Error(`Received HTML instead of JSON. Server returned ${res.status}: ${res.statusText}`);
        }
      }

      // Check if the response is empty before trying to parse JSON
      const text = await res.text();
      if (!text) {
        console.log('Empty response received');
        return {}; // Return empty object for empty responses
      }
      
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        if (text.includes('<!DOCTYPE html>')) {
          console.error('Received HTML instead of JSON response');
          throw new Error('Received HTML page instead of JSON. The API endpoint might not exist or is not returning valid JSON.');
        } else {
          console.error('Response text:', text.substring(0, 150) + '...');
          throw new Error('Invalid JSON response from server');
        }
      }
    } catch (error) {
      console.error('Query failed:', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
