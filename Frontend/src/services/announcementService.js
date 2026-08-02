import api from './api';

export const getAnnouncements = async () => {
    return await api.get('/announcements');
};

export const createAnnouncement = async (data) => {
    return await api.post('/announcements', data);
};

export const deleteAnnouncement = async (id) => {
    return await api.delete(`/announcements/${id}`);
};
