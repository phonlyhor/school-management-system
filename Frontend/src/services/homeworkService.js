import api from './api';

export const getHomeworkList = async () => {
    return await api.get('/homework');
};

export const createHomework = async (data) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return await api.post('/homework', data, config);
};

export const deleteHomework = async (id) => {
    return await api.delete(`/homework/${id}`);
};
