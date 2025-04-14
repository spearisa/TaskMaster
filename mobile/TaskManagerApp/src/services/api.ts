import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual deployed API URL
const API_URL = 'https://yourdomain.replit.app';

// Create axios instance with baseURL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to handle authentication
api.interceptors.request.use(
  async (config) => {
    try {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        // We're using cookie-based authentication, 
        // so we don't need to set any headers here.
        // The cookie will be sent automatically with the request.
      }
    } catch (error) {
      console.error('Error accessing AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the session
        const response = await api.get('/api/user');
        
        if (response.status === 200) {
          // Session is still valid, retry the request
          return api(originalRequest);
        } else {
          // Session is invalid, clear user data
          await AsyncStorage.removeItem('user');
          throw error;
        }
      } catch (refreshError) {
        // Clear user data
        await AsyncStorage.removeItem('user');
        throw error;
      }
    }

    return Promise.reject(error);
  }
);

// Task APIs
export const TaskAPI = {
  getTasks: () => api.get('/api/tasks'),
  getTaskById: (id: number) => api.get(`/api/tasks/${id}`),
  createTask: (taskData: any) => api.post('/api/tasks', taskData),
  updateTask: (id: number, taskData: any) => api.put(`/api/tasks/${id}`, taskData),
  deleteTask: (id: number) => api.delete(`/api/tasks/${id}`),
  completeTask: (id: number) => api.post(`/api/tasks/${id}/complete`),
  setTaskPublic: (id: number, isPublic: boolean) => api.post(`/api/tasks/${id}/public`, { isPublic }),
  assignTask: (taskId: number, userId: number) => api.post(`/api/tasks/${taskId}/assign`, { userId }),
};

// Task Template APIs
export const TemplateAPI = {
  getTemplates: () => api.get('/api/templates'),
  getTemplateById: (id: number) => api.get(`/api/templates/${id}`),
  createTemplate: (templateData: any) => api.post('/api/templates', templateData),
  updateTemplate: (id: number, templateData: any) => api.put(`/api/templates/${id}`, templateData),
  deleteTemplate: (id: number) => api.delete(`/api/templates/${id}`),
  setTemplatePublic: (id: number, isPublic: boolean) => api.post(`/api/templates/${id}/public`, { isPublic }),
  createTaskFromTemplate: (templateId: number, dueDate?: string) => 
    api.post(`/api/templates/${templateId}/create-task`, { dueDate }),
};

// Messenger APIs
export const MessengerAPI = {
  getConversations: () => api.get('/api/conversations'),
  getMessages: (userId: number) => api.get(`/api/messages/${userId}`),
  sendMessage: (userId: number, content: string) => 
    api.post('/api/messages', { receiverId: userId, content }),
  markAsRead: (userId: number) => api.post(`/api/messages/${userId}/read`),
  searchUsers: (query: string) => api.get(`/api/users/search?q=${query}`),
};

// AI Assistant APIs
export const AiAPI = {
  getTaskSuggestions: () => api.get('/api/ai/suggestions'),
  delegateTask: (taskId: number, context?: string) => 
    api.post(`/api/ai/delegate/${taskId}`, { context }),
  generateDailySchedule: () => api.get('/api/ai/schedule'),
};

// User APIs
export const UserAPI = {
  getUserProfile: (userId: number) => api.get(`/api/users/${userId}/profile`),
  updateProfile: (profileData: any) => api.put('/api/users/profile', profileData),
};

export default api;