import api from './api';

export const getParents = async () => {
    return await api.get('/admin/parents');
};

export const getParentById = async (id) => {
    return await api.get(`/admin/parents/${id}`);
};

export const createParent = async (data) => {
    return await api.post('/admin/parents', data);
};

export const updateParent = async (id, data) => {
    return await api.put(`/admin/parents/${id}`, data);
};

export const deleteParent = async (id) => {
    return await api.delete(`/admin/parents/${id}`);
};
