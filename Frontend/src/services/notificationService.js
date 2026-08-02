import api from './api';

export const getNotifications = () => {
    return api.get('/notifications');
};

export const markNotificationAsRead = (id) => {
    return api.put(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = () => {
    return api.put('/notifications/read-all');
};
