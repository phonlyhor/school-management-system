import api from './api';

export const getHomerooms = async () => {
    return await api.get('/admin/homerooms');
};

export const getHomeroomById = async (id) => {
    return await api.get(`/admin/homerooms/${id}`);
};

export const createHomeroom = async (data) => {
    return await api.post('/admin/homerooms', data);
};

export const updateHomeroom = async (id, data) => {
    return await api.put(`/admin/homerooms/${id}`, data);
};

export const deleteHomeroom = async (id) => {
    return await api.delete(`/admin/homerooms/${id}`);
};
