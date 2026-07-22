import { create } from "zustand";
import { api, ApiError } from "@/lib/api";

export interface User {
  id: string;
  username: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post<{ status: string; data: { user: User } }>("/api/auth/login", {
        username,
        password,
      });
      set({ user: data.data.user, isLoading: false });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Login failed. Please try again.";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post<{ status: string; data: { user: User } }>("/api/auth/register", {
        username,
        password,
      });
      set({ user: data.data.user, isLoading: false });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Registration failed. Please try again.";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      set({ user: null, isLoading: false, error: null });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<{ status: string; data: { user: User } }>("/api/auth/me");
      set({ user: data.data.user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
