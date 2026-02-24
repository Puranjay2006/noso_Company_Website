import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import apiClient from '../api/client';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            setAuth: (user, token) => {
                // Set axios default header
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                set({ user, token, isAuthenticated: true });
            },
            logout: () => {
                // Remove axios default header
                delete apiClient.defaults.headers.common['Authorization'];
                set({ user: null, token: null, isAuthenticated: false });
            },
            initializeAuth: () => {
                // Restore auth header on app load if token exists
                const state = get();
                if (state.token) {
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
                }
            },
        }),
        {
            name: 'auth-storage', // localStorage key
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);

// Initialize auth on module load (restore axios header)
const initAuth = () => {
    const state = useAuthStore.getState();
    if (state.token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    }
};
initAuth();
