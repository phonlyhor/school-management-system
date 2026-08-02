import api from './api';

export const getAdminDashboard = async (date) => {
    const response = await api.get('/admin/dashboard', {
        params: date ? { date } : {}
    });
    return response.data;
};

export const getTeacherDashboard = async () => {
    const response = await api.get('/teacher/dashboard');
    return response.data;
};

export const getStudentDashboard = async () => {
    const response = await api.get('/student/dashboard');
    return response.data;
};

export const getParentDashboard = async () => {
    const response = await api.get('/parent/dashboard');
    return response.data;
};

export const getOrgStructure = async () => {
    const response = await api.get('/admin/org-structure');
    return response.data;
};
