import axios from 'axios';

// FORCE the live Render URL. Completely ignore environment variables.
export const axiosInstance = axios.create({
  baseURL: 'https://intell-meet.onrender.com/api',
  withCredentials: true, // Crucial for sending authentication cookies
});