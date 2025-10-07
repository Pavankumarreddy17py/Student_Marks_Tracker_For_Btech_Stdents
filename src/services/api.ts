import axios from 'axios';

// Use the environment variable injected by Railway/Vite, 
// falling back to localhost for local dev.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'; 

// Create an axios instance with base URL and default config
const api = axios.create({
  baseURL: BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user');
    if (user) {
      const token = JSON.parse(user).token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;