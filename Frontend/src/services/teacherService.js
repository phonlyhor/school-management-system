import api from './api';

// Teacher Portal Functions
export const getTeacherSchedule = async () => {
    return await api.get('/teacher/schedule');
};

export const getTeacherHomeroomSchedule = async () => {
    return await api.get('/teacher/homeroom-schedule');
};

export const getTeacherClasses = async () => {
    return await api.get('/teacher/classes');
};

export const getTeacherClassStudents = async (classId, date = '') => {
    const config = date ? { params: { date } } : {};
    return await api.get(`/teacher/classes/${classId}/students`, config);
};

export const getClassStudents = getTeacherClassStudents;

export const updateStudentPosition = async (studentId, position) => {
    return await api.put(`/teacher/students/${studentId}/position`, { class_position: position });
};

// Admin Teacher Management Functions
export const getTeachers = async () => {
    return await api.get('/admin/teachers');
};

export const getTeacherById = async (id) => {
    return await api.get(`/admin/teachers/${id}`);
};

export const createTeacher = async (data) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return await api.post('/admin/teachers', data, config);
};

export const updateTeacher = async (id, data) => {
    if (data instanceof FormData) {
        data.append('_method', 'PUT');
        return await api.post(`/admin/teachers/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
    return await api.put(`/admin/teachers/${id}`, data);
};

export const deleteTeacher = async (id) => {
    return await api.delete(`/admin/teachers/${id}`);
};
