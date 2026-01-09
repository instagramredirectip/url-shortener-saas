import axios from 'axios';

// Create an Axios instance with default settings
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Pointing to our backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically add the Token to headers
// This means you don't have to manually add "Bearer token" for every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;