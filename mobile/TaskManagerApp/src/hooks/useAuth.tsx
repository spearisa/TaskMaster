import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Define your API base URL
const API_URL = 'https://yourdomain.replit.app';  // Replace with your actual deployed API URL

// User type definition
interface User {
  id: number;
  username: string;
  displayName: string | null;
  bio: string | null;
  interests: string[];
  skills: string[];
  avatarUrl: string | null;
  createdAt: string | null;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

// Login data validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Register data validation schema
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  interests: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Initialize auth state
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: LoginData) => {
      const response = await axios.post(`${API_URL}/api/login`, { username, password });
      return response.data;
    },
    onSuccess: async (data) => {
      setUser(data);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      Alert.alert('Login Failed', error.response?.data?.message || 'Unable to login');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await axios.post(`${API_URL}/api/register`, userData);
      return response.data;
    },
    onSuccess: async (data) => {
      setUser(data);
      await AsyncStorage.setItem('user', JSON.stringify(data));
    },
    onError: (error: any) => {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Unable to register');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`${API_URL}/api/logout`);
    },
    onSuccess: async () => {
      setUser(null);
      await AsyncStorage.removeItem('user');
      queryClient.clear();
    },
    onError: (error: any) => {
      Alert.alert('Logout Failed', error.response?.data?.message || 'Unable to logout');
    },
  });

  // Login function
  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  // Register function
  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error: loginMutation.error || registerMutation.error || logoutMutation.error || null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};