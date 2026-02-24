const isProduction = import.meta.env.VITE_ENV === 'production';

export const config = {
    apiUrl: isProduction
        ? 'https://nosocompany.com/api'
        : (import.meta.env.VITE_API_URL || 'http://localhost:8080/api'),
    appName: 'noso company',
};
