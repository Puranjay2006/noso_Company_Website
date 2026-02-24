import apiClient from './client';
import type { CartSummary, CartItem } from '../types';

export const cartApi = {
    get: async (): Promise<CartSummary> => {
        const response = await apiClient.get('/cart/');
        return response.data;
    },
    add: async (serviceId: string, quantity: number = 1): Promise<CartItem> => {
        const response = await apiClient.post('/cart/', { service_id: serviceId, quantity });
        return response.data;
    },
    update: async (itemId: string, quantity: number): Promise<CartItem> => {
        const response = await apiClient.put(`/cart/${itemId}/`, { quantity });
        return response.data;
    },
    remove: async (itemId: string): Promise<void> => {
        await apiClient.delete(`/cart/${itemId}/`);
    },
    clear: async (): Promise<void> => {
        await apiClient.delete('/cart/');
    }
};
