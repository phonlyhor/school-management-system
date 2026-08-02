import api from './api';

// Admin endpoints
export const getAllAttendances = async () => {
    return await api.get('/attendances');
};

export const getStudentAttendanceReport = async (studentId) => {
    return await api.get(`/attendance/report/student/${studentId}`);
};

export const getStudentAttendanceReportBySubject = async (studentId) => {
    return await api.get(`/attendance/report/student/${studentId}/subjects`);
};

// Teacher endpoints
export const getTeacherAttendanceHistory = async (params) => {
    return await api.get('/teacher/attendance/history', { params });
};

export const bulkStoreAttendance = async (data) => {
    return await api.post('/teacher/attendance/bulk', data);
};

export const updateTeacherAttendance = async (id, data) => {
    return await api.put(`/teacher/attendance/${id}`, data);
};
