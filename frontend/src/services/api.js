import axios from 'axios';

// Create a new axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// This function will run on *every* request before it's sent
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Add the token to the 'Authentication-Token' header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
