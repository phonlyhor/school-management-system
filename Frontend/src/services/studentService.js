import api from './api';

export const getStudents = async () => {
    return await api.get('/admin/students');
};

export const getStudentById = async (id) => {
    return await api.get(`/admin/students/${id}`);
};

export const createStudent = async (data) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return await api.post('/admin/students', data, config);
};

export const updateStudent = async (id, data) => {
    if (data instanceof FormData) {
        data.append('_method', 'PUT');
        return await api.post(`/admin/students/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
    return await api.put(`/admin/students/${id}`, data);
};

export const deleteStudent = async (id) => {
    return await api.delete(`/admin/students/${id}`);
};
