import api from './api';

export const getStudentReportCard = async (studentId, academicYear = '') => {
    const params = academicYear ? `?academic_year=${encodeURIComponent(academicYear)}` : '';
    return await api.get(`/report-card/${studentId}${params}`);
};
