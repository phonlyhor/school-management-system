import api from './api';

export const getBuildings = async () => {
    return await api.get('/admin/buildings');
};

export const createBuilding = async (data) => {
    return await api.post('/admin/buildings', data);
};

export const updateBuilding = async (id, data) => {
    return await api.put(`/admin/buildings/${id}`, data);
};

export const deleteBuilding = async (id) => {
    return await api.delete(`/admin/buildings/${id}`);
};
