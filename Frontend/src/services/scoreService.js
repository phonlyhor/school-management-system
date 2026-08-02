import api from './api';

export const getStudentScores = async () => {
    return await api.get('/student-scores');
};

export const createStudentScore = async (data) => {
    return await api.post('/student-scores', data);
};

export const updateStudentScore = async (id, data) => {
    return await api.put(`/student-scores/${id}`, data);
};

export const deleteStudentScore = async (id) => {
    return await api.delete(`/student-scores/${id}`);
};
