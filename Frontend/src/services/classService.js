import api from './api';

export const getClasses = async () => {
    return await api.get('/classes');
};

export const getClassById = async (id) => {
    return await api.get(`/admin/classes/${id}`);
};

export const createClass = async (data) => {
    return await api.post('/admin/classes', data);
};

export const updateClass = async (id, data) => {
    return await api.put(`/admin/classes/${id}`, data);
};

export const deleteClass = async (id) => {
    return await api.delete(`/admin/classes/${id}`);
};
