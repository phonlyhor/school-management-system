import api from './api';

export const getUsers = async () => {
    return await api.get('/users');
};

export const getUserById = async (id) => {
    return await api.get(`/users/${id}`);
};

export const createUser = async (data) => {
    return await api.post('/users', data);
};

export const updateUser = async (id, data) => {
    if (data instanceof FormData) {
        data.append('_method', 'PUT');
        return await api.post(`/users/${id}`, data);
    }
    return await api.put(`/users/${id}`, data);
};

export const deleteUser = async (id) => {
    return await api.delete(`/users/${id}`);
};
