import apiClient from './client';

export const servicesApi = {
    list: async (params?: any) => {
        const response = await apiClient.get('/services', { params });
        return response.data;
    },
    getOne: async (id: string) => {
        const response = await apiClient.get(`/services/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await apiClient.post('/services', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await apiClient.put(`/services/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        await apiClient.delete(`/services/${id}`);
    },
    uploadImage: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`/services/${id}/upload-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};
