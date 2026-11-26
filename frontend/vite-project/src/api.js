import axios from 'axios';

export const api = axios.create({ baseURL: '/api', timeout: 15000 });
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export function errorText(error) {
    return error.response?.data?.error || 'Не удалось связаться с сервером. Попробуйте ещё раз.';
}
