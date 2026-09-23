import axios from 'axios';

// Ensure this matches the NestJS backend URL
export const API_URL = 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    // We are running on the client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global 401s (e.g. token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        // Redirect to auth only if not already on it
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      }
    }

    // Global error message normalizer
    if (error.response?.data?.message) {
      const msg = error.response.data.message;
      if (Array.isArray(msg)) {
        error.response.data.message = msg.join(', ');
      } else if (typeof msg === 'string' && msg.includes('Cannot POST')) {
        error.response.data.message = 'This feature is not yet available!';
      } else if (typeof msg === 'string' && msg.includes('Cannot GET')) {
        error.response.data.message = 'The requested resource was not found.';
      }
    } else if (error.response?.status === 404) {
      error.response = { ...error.response, data: { message: 'Endpoint not found on the server.' } };
    }

    return Promise.reject(error);
  }
);
