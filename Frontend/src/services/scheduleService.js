import api from './api';

export const getSchedules = async () => {
    return await api.get('/admin/schedules');
};

export const getScheduleById = async (id) => {
    return await api.get(`/admin/schedules/${id}`);
};

export const createSchedule = async (data) => {
    return await api.post('/admin/schedules', data);
};

export const batchCreateSchedules = async (data) => {
    return await api.post('/admin/schedules/batch', data);
};

export const updateSchedule = async (id, data) => {
    return await api.put(`/admin/schedules/${id}`, data);
};

export const deleteSchedule = async (id) => {
    return await api.delete(`/admin/schedules/${id}`);
};
