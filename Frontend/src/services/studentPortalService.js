import api from './api';

export const getStudentSchedule = async () => {
    return await api.get('/student/schedule');
};

export const getStudentDashboard = async () => {
    return await api.get('/student/dashboard');
};

export const getStudentAttendance = async () => {
    return await api.get('/student/attendance');
};
