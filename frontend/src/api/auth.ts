import apiClient from './client';

export const authApi = {
    login: async (credentials: any) => {
        const response = await apiClient.post('/auth/login', credentials);
        return response.data;
    },
    register: async (userData: any) => {
        const response = await apiClient.post('/auth/register', userData);
        return response.data;
    },
    registerPartner: async (partnerData: any) => {
        const response = await apiClient.post('/auth/register/partner', partnerData);
        return response.data;
    },
    getMe: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },
};
