import api from './api';

export const getAssessments = async () => {
    return await api.get('/assessments');
};

export const getAssessmentById = async (id) => {
    return await api.get(`/assessments/${id}`);
};

export const createAssessment = async (data) => {
    return await api.post('/assessments', data);
};

export const updateAssessment = async (id, data) => {
    return await api.put(`/assessments/${id}`, data);
};

export const deleteAssessment = async (id) => {
    return await api.delete(`/assessments/${id}`);
};
