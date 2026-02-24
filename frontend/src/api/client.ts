import axios from 'axios';
import { config } from '../config';

const apiClient = axios.create({
    baseURL: config.apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to headers
apiClient.interceptors.request.use(
    (requestConfig) => {
        // If Authorization header is already set (e.g., from direct assignment), use it
        if (requestConfig.headers.Authorization) {
            return requestConfig;
        }

        // Otherwise, try to get token from persisted auth store in localStorage
        const authStorage = localStorage.getItem('auth-storage');

        if (authStorage) {
            try {
                const parsed = JSON.parse(authStorage);

                // Handle both direct token and nested state.token
                const token = parsed.state?.token || parsed.token;

                if (token) {
                    requestConfig.headers.Authorization = `Bearer ${token}`;
                }
            } catch (e) {
                console.error('❌ Failed to parse auth storage', e);
            }
        }

        return requestConfig;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const url = error.config?.url || '';
            console.error('❌ 401 Unauthorized:', url);

            // Only logout and redirect for auth-related endpoints (not cart for guests)
            // Cart 401s are expected for unauthenticated users and handled gracefully
            const isAuthEndpoint = url.includes('/auth/me') || url.includes('/auth/refresh');
            const isProtectedEndpoint = url.includes('/bookings') || url.includes('/users/');

            if (isAuthEndpoint || isProtectedEndpoint) {
                console.warn('🔄 Token expired or invalid. Logging out...');
                localStorage.removeItem('auth-storage');
                localStorage.removeItem('cart-storage');

                // Only reload if not already on login page
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            } else {
                // For cart and other non-critical endpoints, just log the error
                console.warn('⚠️ 401 on non-auth endpoint, not forcing logout');
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
