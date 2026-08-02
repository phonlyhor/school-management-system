import api from './api';

export const getSubjects = async () => {
    return await api.get('/subjects');
};

export const getSubjectById = async (id) => {
    return await api.get(`/admin/subjects/${id}`);
};

export const createSubject = async (data) => {
    return await api.post('/admin/subjects', data);
};

export const updateSubject = async (id, data) => {
    return await api.put(`/admin/subjects/${id}`, data);
};

export const deleteSubject = async (id) => {
    return await api.delete(`/admin/subjects/${id}`);
};
