import apiClient from './client';

export interface Category {
    _id: string;
    name: string;
    description?: string;
    image?: string;
    is_active: boolean;
}

export const categoriesApi = {
    list: async (): Promise<Category[]> => {
        const response = await apiClient.get('/categories');
        return response.data;
    },
    getOne: async (id: string): Promise<Category> => {
        const response = await apiClient.get(`/categories/${id}`);
        return response.data;
    }
};
