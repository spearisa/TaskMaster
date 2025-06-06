import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface ApiRequestOptions {
  redirectToAuthOnUnauthorized?: boolean;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: ApiRequestOptions
): Promise<Response> {
  console.log(`[API] Making ${method} request to ${url}`, data ? { dataKeys: Object.keys(data) } : 'no data');
  
  // Prepare headers
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(options?.headers || {})
  };
  
  // Create timeout controller if timeout is specified but no signal is provided
  let timeoutController: AbortController | undefined;
  let timeoutId: number | undefined;
  
  if (options?.timeout && !options?.signal) {
    timeoutController = new AbortController();
    timeoutId = window.setTimeout(() => timeoutController?.abort(), options.timeout);
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: options?.credentials || "include",
      cache: options?.cache || "default",
      signal: options?.signal || timeoutController?.signal
    });

    console.log(`[API] Response from ${url}:`, { status: res.status, statusText: res.statusText });
    
    // Skip throwing errors if redirectToAuthOnUnauthorized is false and we get a 401
    if (!(options?.redirectToAuthOnUnauthorized === false && res.status === 401)) {
      try {
        await throwIfResNotOk(res);
      } catch (error) {
        console.error(`[API] Error in request to ${url}:`, error);
        throw error;
      }
    }
    
    return res;
  } catch (error) {
    console.error(`[API] Fetch error in request to ${url}:`, error);
    
    // Enhance error message for timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new Error(`Request to ${url} timed out after ${options?.timeout || 'unknown'} ms`);
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }
    
    throw error;
  } finally {
    // Clean up timeout if it was created
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`[QueryFn] Fetching ${url} (on401: ${unauthorizedBehavior})`);
    
    const res = await fetch(url, {
      credentials: "include",
    });
    
    console.log(`[QueryFn] Response from ${url}:`, { status: res.status, statusText: res.statusText });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`[QueryFn] Returning null for 401 response from ${url}`);
      return null;
    }

    try {
      await throwIfResNotOk(res);
      const data = await res.json();
      console.log(`[QueryFn] Successfully fetched data from ${url}`);
      return data;
    } catch (error) {
      console.error(`[QueryFn] Error in query to ${url}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 60000, // Refetch every minute
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 30000, // Consider data stale after 30 seconds
      retry: 1, // Retry once on failure
    },
    mutations: {
      retry: 1, // Retry once on failure
    },
  },
});
