import api from './api';

export const getAcademicYears = async () => {
    return await api.get('/academic-years');
};

export const getAcademicYearById = async (id) => {
    return await api.get(`/academic-years/${id}`);
};

export const createAcademicYear = async (data) => {
    return await api.post('/academic-years', data);
};

export const updateAcademicYear = async (id, data) => {
    return await api.put(`/academic-years/${id}`, data);
};

export const deleteAcademicYear = async (id) => {
    return await api.delete(`/academic-years/${id}`);
};
