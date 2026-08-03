import api from './api';

export const getStudentReportCard = async (studentId, academicYear = '', semesterId = '') => {
    const params = new URLSearchParams();
    if (academicYear) params.append('academic_year', academicYear);
    if (semesterId) params.append('semester_id', semesterId);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await api.get(`/report-card/${studentId}${queryString}`);
};

export const getClassSummaryReportCard = async (classId, academicYear = '', semesterId = '') => {
    const params = new URLSearchParams();
    if (academicYear) params.append('academic_year', academicYear);
    if (semesterId) params.append('semester_id', semesterId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await api.get(`/report-cards/class/${classId}${queryString}`);
};
