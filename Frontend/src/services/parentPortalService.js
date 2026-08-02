import api from './api';

export const getParentSchedule = async (studentId = null) => {
    const params = studentId ? { student_id: studentId } : {};
    return await api.get('/parent/schedule', { params });
};

export const getParentDashboard = async (studentId = null) => {
    const params = studentId ? { student_id: studentId } : {};
    return await api.get('/parent/dashboard', { params });
};

export const getParentChildren = async () => {
    return await api.get('/parent/children');
};

export const getParentAttendance = async (studentId = null) => {
    const params = studentId ? { student_id: studentId } : {};
    return await api.get('/parent/attendance', { params });
};
