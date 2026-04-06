import axios from 'axios';

export const axiosInstance = axios.create({
  // This must match your backend port!
  baseURL: 'http://localhost:5001/api', 
});

// Automatically attach the JWT token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});