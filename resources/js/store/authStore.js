import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useAuthStore = create()(persist((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    setAuth: (user, token) => {
        localStorage.setItem('finova_token', token);
        set({ user, token, isAuthenticated: true });
    },
    setUser: (user) => {
        set({ user });
    },
    logout: () => {
        localStorage.removeItem('finova_token');
        set({ user: null, token: null, isAuthenticated: false });
    },
}), {
    name: 'finova_auth',
    partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
    }),
}));
