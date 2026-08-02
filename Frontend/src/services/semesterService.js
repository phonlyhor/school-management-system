import api from './api';

export const getSemesters = async () => {
    return await api.get('/semesters');
};

export const getSemesterById = async (id) => {
    return await api.get(`/semesters/${id}`);
};

export const createSemester = async (data) => {
    return await api.post('/semesters', data);
};

export const updateSemester = async (id, data) => {
    return await api.put(`/semesters/${id}`, data);
};

export const deleteSemester = async (id) => {
    return await api.delete(`/semesters/${id}`);
};
