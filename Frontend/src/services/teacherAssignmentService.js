import api from './api';

export const getTeacherAssignments = async () => {
    return await api.get('/admin/teacher-assignments');
};

export const getTeacherAssignmentById = async (id) => {
    return await api.get(`/admin/teacher-assignments/${id}`);
};

export const createTeacherAssignment = async (data) => {
    return await api.post('/admin/teacher-assignments', data);
};

export const updateTeacherAssignment = async (id, data) => {
    return await api.put(`/admin/teacher-assignments/${id}`, data);
};

export const deleteTeacherAssignment = async (id) => {
    return await api.delete(`/admin/teacher-assignments/${id}`);
};
