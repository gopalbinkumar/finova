import { create } from 'zustand'

export const useAuthStore = create()((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  setAuth: (user) => set({ user, isAuthenticated: true, isInitialized: true }),
  setUser: (user) => set({ user }),
  setGuest: () => set({ user: null, isAuthenticated: false, isInitialized: true }),
  logout: () => set({ user: null, isAuthenticated: false, isInitialized: true }),
}))
