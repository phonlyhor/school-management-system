import api from './api';

export const getStudentReportCard = async (studentId) => {
    return await api.get(`/report-card/${studentId}`);
};
