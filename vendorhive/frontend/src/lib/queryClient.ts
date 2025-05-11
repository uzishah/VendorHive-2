import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
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
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  
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
    
    // Add the backend URL if the URL starts with /api
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('/api') 
      ? `http://localhost:4000${url}` 
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
    return await res.json();
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
