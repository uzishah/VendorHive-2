import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Set up headers with Content-Type and Authorization if token exists
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log(`API Request: ${method} ${url}`);
  console.log(`With token: ${token ? 'Yes' : 'No'}`);
  
  // In Replit, the backend and frontend are served from the same origin
  // So we don't need to add a port or different host
  const BACKEND_URL = '';
  
  console.log(`Using relative URL for API requests`);
  
  // Add the backend URL if the URL starts with /api
  const fullUrl = url.startsWith('/api') 
    ? `${BACKEND_URL}${url}` 
    : url;
    
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    console.error(`API Error: ${res.status} ${res.statusText}`);
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Set up headers with Authorization if token exists
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    console.log(`Query: ${queryKey[0]}`);
    console.log(`With token: ${token ? 'Yes' : 'No'}`);
    
    // In Replit, the backend and frontend are served from the same origin
    // So we don't need to add a port or different host
    const BACKEND_URL = '';
    
    console.log(`Using relative URL for query`);
    
    // Add the backend URL if the URL starts with /api
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('/api') 
      ? `${BACKEND_URL}${url}` 
      : url;
      
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
    }

    await throwIfResNotOk(res);
    
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
      console.error('Response text:', text.substring(0, 150) + '...');
      throw new Error('Invalid JSON response from server');
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
