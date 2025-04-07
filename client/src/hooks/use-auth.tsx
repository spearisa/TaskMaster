import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Local storage key for persisting user data
const USER_STORAGE_KEY = "taskManager_user";

// Define our auth-related types
type AuthUser = Omit<SelectUser, "password">;

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"]
});

export { loginSchema, registerSchema };

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<AuthUser, Error, RegisterData>;
  refreshUser: () => Promise<any>; // Use 'any' to fix type compatibility
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [cachedUser, setCachedUser] = useState<AuthUser | null>(null);

  // Initialize from local storage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setCachedUser(parsedUser);
        console.log("Loaded user from local storage:", parsedUser);
      }
    } catch (error) {
      console.error("Error loading user from localStorage:", error);
    }
  }, []);

  // Function to save user to local storage
  const saveUserToStorage = useCallback((user: AuthUser | null) => {
    try {
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        console.log("User saved to local storage:", user);
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
        console.log("User removed from local storage");
      }
    } catch (error) {
      console.error("Error saving user to localStorage:", error);
    }
  }, []);
  
  // Query to get the current authenticated user
  const {
    data: serverUser,
    error,
    isLoading,
    refetch,
  } = useQuery<AuthUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        console.log("Fetching authenticated user");
        const res = await fetch("/api/user", {
          credentials: "include", // Important: include credentials for session cookie
          cache: "no-store", // Ensure we don't use cached responses
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
          }
        });
        
        console.log("User fetch response status:", res.status);
        
        if (res.status === 401) {
          console.log("User not authenticated (401)");
          saveUserToStorage(null); // Clear cached user if server says not authenticated
          return null;
        }
        
        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }
        
        const userData = await res.json();
        console.log("User authenticated:", userData);
        
        // Save to local storage for persistence
        saveUserToStorage(userData);
        
        return userData;
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
    initialData: cachedUser, // Use cached user from localStorage as initial data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Combine server user with cached user for better reliability
  const user = serverUser || cachedUser;
  
  // Effect to sync serverUser to cachedUser state
  useEffect(() => {
    if (serverUser) {
      setCachedUser(serverUser);
    }
  }, [serverUser]);
  
  // Callback to manually refresh user data
  const refreshUser = useCallback(async () => {
    console.log("Manually refreshing user data");
    const result = await refetch();
    return; // Return void to match the type
  }, [refetch]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("[API] Making login request");
      const res = await apiRequest("POST", "/api/login", credentials, {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });
      const data = await res.json();
      console.log("[API] Login response:", data);
      return data;
    },
    onSuccess: (loggedInUser: AuthUser) => {
      queryClient.setQueryData(["/api/user"], loggedInUser);
      saveUserToStorage(loggedInUser);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${loggedInUser.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      // Extract confirm password before sending to API
      const { confirmPassword, ...credentials } = userData;
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (newUser: AuthUser) => {
      queryClient.setQueryData(["/api/user"], newUser);
      saveUserToStorage(newUser);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${newUser.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      saveUserToStorage(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}