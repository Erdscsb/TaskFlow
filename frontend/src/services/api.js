import axios from 'axios';
import Cookies from 'js-cookie';

// Create a new axios instance
const api = axios.create({ // API Calls handling
  baseURL: '/api',
  withCredentials: true,
});

// This function will run on *every* request before it's sent
api.interceptors.request.use( // Add CSRF token to headers
  (config) => {

    // Read the CSRF token from the cookie
    const csrfToken = Cookies.get('csrf_access_token');
    if (csrfToken) {
      // Send it back in the X-CSRF-TOKEN header
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
