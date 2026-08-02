import api from './api';

export const getLeaveRequests = async () => {
    return await api.get('/leave-requests');
};

export const createLeaveRequest = async (data) => {
    return await api.post('/leave-requests', data);
};

export const updateLeaveStatus = async (id, status, comment = '') => {
    return await api.put(`/leave-requests/${id}/status`, { status, comment });
};
