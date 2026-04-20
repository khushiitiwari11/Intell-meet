import { create } from 'zustand';

// 1. Define the User to accept both id formats
export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
}

// 2. Define the API response
interface AuthResponse {
  user: User;
  accessToken: string;
}

// 3. Define the Store State with isAuthenticated added
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  // Automatically calculate true/false based on token existence
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (data) => {
    // Guarantee an 'id' exists by mapping MongoDB's '_id'
    const processedUser = { 
      ...data.user, 
      id: data.user.id || data.user._id 
    };
    
    localStorage.setItem('user', JSON.stringify(processedUser));
    localStorage.setItem('token', data.accessToken);
    
    set({ 
      user: processedUser, 
      token: data.accessToken, 
      isAuthenticated: true 
    });
  },
  
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));