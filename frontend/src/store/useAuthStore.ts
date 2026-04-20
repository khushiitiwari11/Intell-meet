import { create } from 'zustand';

// 1. Define what a User looks like
export interface User {
  _id: string; // or id, depending on your backend
  name: string;
  email: string;
}

// 2. Define what the API sends back upon login
interface AuthResponse {
  user: User;
  accessToken: string;
}

// 3. Define the Store State
interface AuthState {
  user: User | null;
  token: string | null;
  login: (data: AuthResponse) => void; // <--- This was the fix!
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  
  // Now TypeScript knows 'data' contains both 'user' and 'accessToken'
  login: (data) => {
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.accessToken);
    set({ user: data.user, token: data.accessToken });
  },
  
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));