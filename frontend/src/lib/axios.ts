import axios from 'axios';

export const axiosInstance = axios.create({
  // Delete the import.meta.env part and hardcode the live URL:
  baseURL: 'https://intell-meet.onrender.com/api', 
});

// Automatically attach the JWT token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});