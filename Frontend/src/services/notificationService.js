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

export const deleteNotification = (id) => {
    return api.delete(`/notifications/${id}`);
};

export const clearAllNotifications = () => {
    return api.delete('/notifications');
};
