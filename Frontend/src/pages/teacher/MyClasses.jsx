import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { getTeacherSchedule, getClassStudents, updateStudentPosition } from '../../services/teacherService';
import { bulkStoreAttendance } from '../../services/attendanceService';
import { exportToCSV } from '../../utils/excelExporter';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MyClasses = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [updatingPositionId, setUpdatingPositionId] = useState(null);
    const [viewingStudent, setViewingStudent] = useState(null);

    // Quick Homeroom Attendance Modal States
    const [attendanceClass, setAttendanceClass] = useState(null);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceList, setAttendanceList] = useState([]);
    const [attendanceState, setAttendanceState] = useState({});
    const [savingAttendance, setSavingAttendance] = useState(false);

    // Homeroom Class Report Modal States
    const [reportClass, setReportClass] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true);
            try {
                const res = await getTeacherSchedule();
                setSchedule(res.data.schedule || []);
            } catch (err) {
                console.error("Failed to load classes:", err);
                toast.error("Failed to load assigned classes.");
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, []);

    const getImageUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
        return `${baseUrl}/${photo.replace(/^\//, '')}`;
    };

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return isNaN(age) || age < 0 ? 'N/A' : `${age} ឆ្នាំ (Years)`;
    };

    const formatGrade = (gl) => {
        if (!gl) return '';
        return gl.toLowerCase().startsWith('grade') ? gl : `Grade ${gl}`;
    };

    // Extract unique classes from the schedule
    const classMap = new Map();
    schedule.forEach(item => {
        if (item.class && !classMap.has(item.class.id)) {
            classMap.set(item.class.id, {
                ...item.class,
                is_homeroom: item.class.is_homeroom || false,
                subjects: [item.subject?.name].filter(Boolean)
            });
        } else if (item.class) {
            const existing = classMap.get(item.class.id);
            if (item.class.is_homeroom) {
                existing.is_homeroom = true;
            }
            if (item.subject?.name && !existing.subjects.includes(item.subject.name)) {
                existing.subjects.push(item.subject.name);
            }
        }
    });

    const uniqueClasses = Array.from(classMap.values());

    const [isHomeroom, setIsHomeroom] = useState(false);
    const [todayAttendances, setTodayAttendances] = useState([]);

    const handleViewStudents = async (cls) => {
        setSelectedClass(cls);
        setLoadingStudents(true);
        try {
            const res = await getClassStudents(cls.id);
            setStudents(res.data.students || []);
            setIsHomeroom(res.data.is_homeroom || false);
            setTodayAttendances(res.data.today_attendances || []);
        } catch (err) {
            console.error("Failed to load students:", err);
            toast.error("Failed to load student roster.");
        } finally {
            setLoadingStudents(false);
        }
    };

    const handlePositionChange = async (studentId, newPosition) => {
        setUpdatingPositionId(studentId);
        try {
            await updateStudentPosition(studentId, newPosition);
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, class_position: newPosition } : s));
            toast.success("Class position updated!");
        } catch (err) {
            console.error("Failed to update position:", err);
            toast.error("Failed to update position: " + (err.response?.data?.message || err.message));
        } finally {
            setUpdatingPositionId(null);
        }
    };

    const handleOpenAttendanceModal = async (cls) => {
        setAttendanceClass(cls);
        try {
            const res = await getClassStudents(cls.id);
            const stList = res.data.students || [];
            setAttendanceList(stList);
            const initState = {};
            stList.forEach(s => { initState[s.id] = 'present'; });
            setAttendanceState(initState);
        } catch (err) {
            console.error("Failed to load students for attendance:", err);
            toast.error("Failed to load student list.");
        }
    };

    const handleSaveQuickAttendance = async () => {
        if (!attendanceClass || attendanceList.length === 0) return;
        setSavingAttendance(true);
        try {
            await bulkStoreAttendance({
                class_id: attendanceClass.id,
                subject_id: 'homeroom',
                date: attendanceDate,
                students: Object.keys(attendanceState).map(stId => ({
                    student_id: stId,
                    status: attendanceState[stId],
                    note: ''
                }))
            });
            toast.success(`🎉 រក្សាទុកវត្តមានសិស្សថ្នាក់ ${attendanceClass.name} បានជោគជ័យ!`);
            setAttendanceClass(null);
        } catch (err) {
            console.error("Failed to save attendance:", err);
            toast.error("Failed to save attendance: " + (err.response?.data?.message || err.message));
        } finally {
            setSavingAttendance(false);
        }
    };

    const handleOpenReportModal = async (cls) => {
        setReportClass(cls);
        setLoadingReport(true);
        try {
            const res = await api.get(`/attendance/report/class/${cls.id}`);
            setReportData(res.data);
        } catch (err) {
            console.error("Failed to load class report:", err);
            toast.error("Failed to load class attendance report.");
        } finally {
            setLoadingReport(false);
        }
    };

    const handleExportClassStudentsExcel = () => {
        if (!students || students.length === 0) {
            toast.error("មិនទាន់មានបញ្ជីសិស្សសម្រាប់ទាញយកទេ! (No students loaded)");
            return;
        }

        const className = selectedClass?.name || 'Class';

        const exportCols = [
            { header: 'កូដសិស្ស (Student ID)', accessor: 'student_code' },
            { header: 'ឈ្មោះសិស្ស (Student Name)', renderText: (s) => s.user?.name || s.name || '' },
            { header: 'អ៊ីមែល (Email)', renderText: (s) => s.user?.email || '-' },
            { header: 'ថ្នាក់រៀន (Class)', renderText: () => className },
            { header: 'តួនាទីក្នុងថ្នាក់ (Position)', renderText: (s) => s.class_position || 'Member' },
            { header: 'ភេទ (Gender)', renderText: (s) => s.gender || 'N/A' },
            { header: 'ថ្ងៃខែឆ្នាំកំណើត (DOB)', renderText: (s) => s.date_of_birth || 'N/A' },
            { header: 'លេខទូរស័ព្ទសិស្ស (Phone)', renderText: (s) => s.phone_number || 'N/A' },
            { header: 'ឈ្មោះឪពុក (Father Name)', renderText: (s) => s.father_name || 'N/A' },
            { header: 'លេខទូរស័ព្ទឪពុក (Father Phone)', renderText: (s) => s.father_phone || 'N/A' },
            { header: 'ឈ្មោះម្តាយ (Mother Name)', renderText: (s) => s.mother_name || 'N/A' },
            { header: 'លេខទូរស័ព្ទម្តាយ (Mother Phone)', renderText: (s) => s.mother_phone || 'N/A' },
            { header: 'អាសយដ្ឋាន (Address)', renderText: (s) => s.address || 'N/A' },
        ];

        exportToCSV(`Homeroom_Class_${className}_Students_${new Date().toISOString().slice(0, 10)}.csv`, exportCols, students);
    };

    const studentColumns = [
        { header: 'Student Code', accessor: 'student_code' },
        { 
            header: 'Name', 
            render: (row) => {
                const img = getImageUrl(row.photo);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {img ? (
                            <img src={img} alt={row.user?.name} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                {row.user?.name?.charAt(0) || 'S'}
                            </div>
                        )}
                        <strong>{row.user?.name || 'N/A'}</strong>
                    </div>
                );
            }
        },
        { 
            header: 'Class Position (តួនាទីក្នុងថ្នាក់)', 
            render: (row) => (
                isHomeroom ? (
                    <select
                        value={row.class_position || 'Member'}
                        disabled={updatingPositionId === row.id}
                        onChange={(e) => handlePositionChange(row.id, e.target.value)}
                        style={{
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            backgroundColor: row.class_position === 'Class Monitor' ? '#fef3c7' : row.class_position === 'Vice Monitor' ? '#e0e7ff' : '#ffffff',
                            color: row.class_position === 'Class Monitor' ? '#92400e' : row.class_position === 'Vice Monitor' ? '#4338ca' : '#334155'
                        }}
                    >
                        <option value="Member">Member (សមាជិក)</option>
                        <option value="Class Monitor">👑 Class Monitor (ប្រធានថ្នាក់)</option>
                        <option value="Vice Monitor">⭐ Vice Monitor (អនុប្រធានថ្នាក់)</option>
                        <option value="Treasurer">💰 Treasurer (បេឡា)</option>
                        <option value="Secretary">📝 Secretary (លេខា)</option>
                    </select>
                ) : (
                    <span style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        backgroundColor: row.class_position === 'Class Monitor' ? '#fef3c7' : row.class_position === 'Vice Monitor' ? '#e0e7ff' : '#f1f5f9',
                        color: row.class_position === 'Class Monitor' ? '#92400e' : row.class_position === 'Vice Monitor' ? '#4338ca' : '#475569',
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem'
                    }}>
                        {row.class_position === 'Class Monitor' ? '👑 ប្រធានថ្នាក់' : row.class_position === 'Vice Monitor' ? '⭐ អនុប្រធានថ្នាក់' : row.class_position === 'Treasurer' ? '💰 បេឡា' : row.class_position === 'Secretary' ? '📝 លេខា' : '👤 សមាជិក'}
                    </span>
                )
            )
        },
        { 
            header: 'Age / Gender', 
            render: (row) => `${calculateAge(row.date_of_birth)} (${row.gender || 'N/A'})` 
        },
        { 
            header: 'Parent Contact (អាណាព្យាបាល)', 
            render: (row) => (
                <div>
                    <div><strong>{row.student_parent?.user?.name || row.father_name || row.mother_name || 'N/A'}</strong></div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.student_parent?.phone || row.phone || 'N/A'}</div>
                </div>
            ) 
        },
        {
            header: 'Actions',
            render: (row) => (
                <Button 
                    size="small" 
                    variant="secondary" 
                    onClick={() => setViewingStudent(row)}
                    title="View All Details"
                >
                    👁️ View Details
                </Button>
            )
        }
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">My Assigned Classes (ថ្នាក់រៀនរបស់ខ្ញុំ)</h1>
            </div>

            {loading ? (
                <p>Loading assigned classes...</p>
            ) : uniqueClasses.length === 0 ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>No Classes Assigned</h3>
                        <p style={{ margin: 0 }}>You do not have any active class assignments for this schedule period.</p>
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {uniqueClasses.map(cls => (
                        <Card key={cls.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px', flexWrap: 'wrap' }}>
                                        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>{cls.name}</h3>
                                        {cls.is_homeroom ? (
                                            <span style={{
                                                padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem',
                                                fontWeight: '700', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a'
                                            }}>
                                                👑 ថ្នាក់បន្ទុករបស់ខ្ញុំ (Homeroom)
                                            </span>
                                        ) : (
                                            <span style={{
                                                padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem',
                                                fontWeight: '700', backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe'
                                            }}>
                                                📘 ថ្នាក់បង្រៀនមុខវិជ្ជា (Subject Class)
                                            </span>
                                        )}
                                    </div>
                                    <span style={{
                                        padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem',
                                        fontWeight: '600', backgroundColor: '#f1f5f9', color: '#475569'
                                    }}>
                                        Grade {cls.grade_level}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <Button size="small" variant="secondary" onClick={() => handleOpenAttendanceModal(cls)}>
                                        📝 ស្រង់វត្តមាន
                                    </Button>
                                    {cls.is_homeroom && (
                                        <Button size="small" variant="secondary" onClick={() => handleOpenReportModal(cls)} style={{ backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#ffedd5' }}>
                                            📊 របាយការណ៍
                                        </Button>
                                    )}
                                    <Button size="small" onClick={() => handleViewStudents(cls)}>
                                        {cls.is_homeroom ? '👑 គ្រប់គ្រងថ្នាក់ & តួនាទី' : '👥 មើលបញ្ជីឈ្មោះសិស្ស'}
                                    </Button>
                                </div>
                            </div>

                            <div style={{ fontSize: '0.88rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <p style={{ margin: 0 }}>
                                    <strong style={{ color: '#334155' }}>👨‍🏫 គ្រូបន្ទុកថ្នាក់ (Homeroom Teacher) ៖</strong>{' '}
                                    <span style={{ fontWeight: '700', color: cls.homeroom_teacher_name ? '#0f172a' : '#94a3b8' }}>
                                        {cls.homeroom_teacher_name || 'មិនទាន់បានចាត់តាំង (Unassigned)'}
                                    </span>
                                </p>
                                <p style={{ margin: 0 }}>
                                    <strong style={{ color: '#334155' }}>📘 មុខវិជ្ជាបង្រៀន (Taught Subjects) ៖</strong> {cls.subjects.join(', ') || 'N/A'}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Quick Homeroom Attendance Modal */}
            <Modal
                isOpen={!!attendanceClass}
                onClose={() => setAttendanceClass(null)}
                title={`📝 ស្រង់វត្តមានសិស្សប្រចាំថ្ងៃ - ${attendanceClass?.name || ''}`}
                maxWidth="750px"
                footer={
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={() => setAttendanceClass(null)}>Cancel</Button>
                        <Button 
                            onClick={handleSaveQuickAttendance}
                            disabled={savingAttendance || attendanceList.length === 0}
                            style={{ backgroundColor: '#16a34a' }}
                        >
                            {savingAttendance ? 'Saving...' : '💾 រក្សាទុកវត្តមាន (Save Attendance)'}
                        </Button>
                    </div>
                }
            >
                {attendanceClass && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #bbf7d0', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                                <strong style={{ color: '#15803d', fontSize: '0.95rem' }}>📅 កាលបរិច្ឆេទស្រង់វត្តមាន ៖</strong>
                                <input 
                                    type="date"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                    style={{ marginLeft: '0.5rem', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '600' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <Button size="small" variant="secondary" onClick={() => {
                                    const allP = {};
                                    attendanceList.forEach(s => allP[s.id] = 'present');
                                    setAttendanceState(allP);
                                }}>
                                    ✅ វត្តមានទាំងអស់
                                </Button>
                            </div>
                        </div>

                        {attendanceList.length === 0 ? (
                            <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem' }}>គ្មានសិស្សក្នុងថ្នាក់នេះនៅឡើយទេ។</p>
                        ) : (
                            <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                            <th style={{ padding: '0.6rem 0.8rem' }}>#</th>
                                            <th style={{ padding: '0.6rem 0.8rem' }}>Student Code</th>
                                            <th style={{ padding: '0.6rem 0.8rem' }}>Student Name</th>
                                            <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Attendance Status (វត្តមាន)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceList.map((st, idx) => (
                                            <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                                <td style={{ padding: '0.6rem 0.8rem', color: '#64748b' }}>{idx + 1}</td>
                                                <td style={{ padding: '0.6rem 0.8rem', fontWeight: '600', color: '#475569' }}>{st.student_code}</td>
                                                <td style={{ padding: '0.6rem 0.8rem' }}>
                                                    <strong>{st.user?.name}</strong>
                                                    {st.class_position && st.class_position !== 'Member' && (
                                                        <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: '#b45309', fontWeight: '700' }}>({st.class_position})</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setAttendanceState(prev => ({ ...prev, [st.id]: 'present' }))}
                                                            style={{
                                                                padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem',
                                                                backgroundColor: attendanceState[st.id] === 'present' ? '#22c55e' : '#f1f5f9',
                                                                color: attendanceState[st.id] === 'present' ? '#ffffff' : '#64748b'
                                                            }}
                                                        >
                                                            ✅ Present
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setAttendanceState(prev => ({ ...prev, [st.id]: 'absent' }))}
                                                            style={{
                                                                padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem',
                                                                backgroundColor: attendanceState[st.id] === 'absent' ? '#ef4444' : '#f1f5f9',
                                                                color: attendanceState[st.id] === 'absent' ? '#ffffff' : '#64748b'
                                                            }}
                                                        >
                                                            ❌ Absent
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setAttendanceState(prev => ({ ...prev, [st.id]: 'late' }))}
                                                            style={{
                                                                padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem',
                                                                backgroundColor: attendanceState[st.id] === 'late' ? '#eab308' : '#f1f5f9',
                                                                color: attendanceState[st.id] === 'late' ? '#ffffff' : '#64748b'
                                                            }}
                                                        >
                                                            ⏰ Late
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setAttendanceState(prev => ({ ...prev, [st.id]: 'permission' }))}
                                                            style={{
                                                                padding: '0.3rem 0.6rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem',
                                                                backgroundColor: attendanceState[st.id] === 'permission' ? '#3b82f6' : '#f1f5f9',
                                                                color: attendanceState[st.id] === 'permission' ? '#ffffff' : '#64748b'
                                                            }}
                                                        >
                                                            📝 Permission
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Student Roster Modal */}
            <Modal 
                isOpen={!!selectedClass} 
                onClose={() => setSelectedClass(null)}
                title={`Class Roster & Student Positions - ${selectedClass?.name || ''}`}
                maxWidth="900px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Button variant="secondary" onClick={handleExportClassStudentsExcel} disabled={students.length === 0}>
                            📥 Export Excel (ទាញយកបញ្ជីសិស្ស)
                        </Button>
                        <Button variant="secondary" onClick={() => setSelectedClass(null)}>Close</Button>
                    </div>
                }
            >
                <div style={{ marginBottom: '1rem', color: '#475569', fontSize: '0.9rem', background: isHomeroom ? '#f8fafc' : '#f0f9ff', padding: '0.75rem', borderRadius: '8px', border: isHomeroom ? '1px solid #e2e8f0' : '1px solid #bae6fd' }}>
                    {isHomeroom ? (
                        <span>💡 <strong>Homeroom Teacher Portal:</strong> You can assign <strong>Class Monitor (ប្រធានថ្នាក់)</strong>, <strong>Vice Monitor (អនុប្រធានថ្នាក់)</strong>, and click <strong>👁️ View Details</strong> to view complete personal and family contact info for any student in your class.</span>
                    ) : (
                        <span>📘 <strong>Subject Teacher View (មើលបញ្ជីឈ្មោះសិស្ស):</strong> អ្នកអាចមើលបញ្ជីឈ្មោះសិស្សក្នុងថ្នាក់បាន។ (តួនាទីចាត់តាំងប្រធានថ្នាក់ មានសម្រាប់តែ <strong>គ្រូបន្ទុកថ្នាក់ / Homeroom Teacher</strong> ប៉ុណ្ណោះ)</span>
                    )}
                </div>

                {todayAttendances.length > 0 && (
                    <div style={{ background: '#fff7ed', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #fed7aa', marginBottom: '1rem' }}>
                        <strong style={{ color: '#c2410c', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                            ⚠️ របាយការណ៍វត្តមានថ្ងៃនេះ ស្រង់ដោយគ្រូមុខវិជ្ជា (Today's Attendance Logs by Subject Teachers) ៖
                        </strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {todayAttendances.map(att => (
                                <div key={att.id} style={{ fontSize: '0.84rem', color: '#7c2d12', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #ffedd5', flexWrap: 'wrap' }}>
                                    <strong>{att.student?.user?.name || 'សិស្ស'}</strong>
                                    <span style={{
                                        padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.78rem',
                                        backgroundColor: att.status === 'absent' ? '#ef4444' : att.status === 'late' ? '#eab308' : att.status === 'permission' ? '#3b82f6' : '#22c55e',
                                        color: '#ffffff'
                                    }}>
                                        {att.status === 'absent' ? '❌ អវត្តមាន (Absent)' : att.status === 'late' ? '⏰ មកយឺត (Late)' : att.status === 'permission' ? '📝 សុំច្បាប់ (Permission)' : '✅ វត្តមាន (Present)'}
                                    </span>
                                    <span>| មុខវិជ្ជា ៖ <strong>{att.subject?.name || 'វត្តមានប្រចាំថ្ងៃ'}</strong></span>
                                    <span style={{ marginLeft: 'auto', color: '#9a3412', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                        👨‍🏫 ស្រង់ដោយលោកគ្រូ/អ្នកគ្រូ ៖ <strong>{att.teacher?.name || 'N/A'}</strong>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {loadingStudents ? (
                    <p>Loading student list...</p>
                ) : students.length === 0 ? (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>No students enrolled in this class.</p>
                ) : (
                    <Table 
                        columns={studentColumns} 
                        data={[...students].sort((a, b) => {
                            const rank = { 'Class Monitor': 1, 'Vice Monitor': 2, 'Treasurer': 3, 'Secretary': 4, 'Member': 5 };
                            return (rank[a.class_position] || 99) - (rank[b.class_position] || 99);
                        })} 
                    />
                )}
            </Modal>

            {/* View Full Student Details Modal for Homeroom Teacher */}
            <Modal 
                isOpen={!!viewingStudent} 
                onClose={() => setViewingStudent(null)}
                title="Complete Student Profile (ព័ត៌មានលម្អិតសិស្សក្នុងថ្នាក់)"
                maxWidth="700px"
                footer={
                    <Button variant="secondary" onClick={() => setViewingStudent(null)}>Close</Button>
                }
            >
                {viewingStudent && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {/* Student Header Badge with Photo */}
                        <div style={{ display: 'flex', gap: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                            {getImageUrl(viewingStudent.photo) ? (
                                <img src={getImageUrl(viewingStudent.photo)} alt={viewingStudent.user?.name} style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #6366f1' }} />
                            ) : (
                                <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', fontWeight: 'bold' }}>
                                    {viewingStudent.user?.name?.charAt(0) || 'S'}
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', color: '#0f172a' }}>{viewingStudent.user?.name}</h3>
                                    {viewingStudent.class_position && viewingStudent.class_position !== 'Member' && (
                                        <span style={{
                                            padding: '0.2rem 0.68rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700',
                                            backgroundColor: viewingStudent.class_position === 'Class Monitor' ? '#fef3c7' : '#e0e7ff',
                                            color: viewingStudent.class_position === 'Class Monitor' ? '#92400e' : '#4338ca'
                                        }}>
                                            {viewingStudent.class_position === 'Class Monitor' ? '👑 ប្រធានថ្នាក់' : viewingStudent.class_position === 'Vice Monitor' ? '⭐ អនុប្រធានថ្នាក់' : viewingStudent.class_position}
                                        </span>
                                    )}
                                </div>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                                    ID: <span style={{ fontWeight: '700', color: '#4f46e5' }}>{viewingStudent.student_code}</span> | Age (អាយុ): <strong style={{ color: '#0f172a' }}>{calculateAge(viewingStudent.date_of_birth)}</strong>
                                </p>
                            </div>
                        </div>

                        {/* General Info */}
                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                                Academic & Position Info (ថ្នាក់រៀន & តួនាទី)
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>Class / Grade</p>
                                    <p style={{ margin: '0', fontWeight: '600', color: '#0f172a' }}>
                                        {viewingStudent.school_class ? `${viewingStudent.school_class.name} (${formatGrade(viewingStudent.school_class.grade_level)})` : 'Unassigned'}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>Class Position (តួនាទីក្នុងថ្នាក់)</p>
                                    <p style={{ margin: '0', fontWeight: '600', color: '#16a34a' }}>
                                        {viewingStudent.class_position || 'Member (សមាជិក)'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Personal Contact & Place of Birth */}
                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                                Personal & Birth Info (ព័ត៌មានផ្ទាល់ខ្លួន & កំណើត)
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>Gender (ភេទ)</p>
                                    <p style={{ margin: '0', fontWeight: '500' }}>{viewingStudent.gender || 'N/A'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>Date of Birth (ថ្ងៃខែឆ្នាំកំណើត)</p>
                                    <p style={{ margin: '0', fontWeight: '500' }}>{viewingStudent.date_of_birth || 'N/A'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>Place of Birth (ទីកន្លែងកំណើត)</p>
                                    <p style={{ margin: '0', fontWeight: '600', color: '#334155' }}>{viewingStudent.place_of_birth || 'N/A'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>Email Account</p>
                                    <p style={{ margin: '0', fontWeight: '500' }}>{viewingStudent.user?.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>Phone Number</p>
                                    <p style={{ margin: '0', fontWeight: '500' }}>{viewingStudent.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>Current Address (អាសយដ្ឋាន)</p>
                                    <p style={{ margin: '0', fontWeight: '500' }}>{viewingStudent.address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Family & Parent Info */}
                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                                Family Info (ព័ត៌មានអាណាព្យាបាល)
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>👨 Father's Name (ឈ្មោះឪពុក)</p>
                                    <p style={{ margin: '0', fontWeight: '600', color: '#0f172a' }}>{viewingStudent.father_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>🎂 Father Age / DoB (អាយុ/ថ្ងៃកំណើតឪពុក)</p>
                                    <p style={{ margin: '0', fontWeight: '600', color: '#0f172a' }}>
                                        {viewingStudent.father_dob ? `${calculateAge(viewingStudent.father_dob)} (${viewingStudent.father_dob})` : 'N/A'}
                                    </p>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>📞 Father Phone (លេខទូរស័ព្ទឪពុក)</p>
                                    <p style={{ margin: '0', fontWeight: '600', color: '#0369a1' }}>{viewingStudent.father_phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Linked System Parent Account */}
                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                                Linked Parent Account & Contact (គណនី & លេខទំនាក់ទំនងអាណាព្យាបាល)
                            </h4>
                            {viewingStudent.student_parent ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#fefce8', padding: '0.75rem', borderRadius: '6px', border: '1px solid #fef08a' }}>
                                    <div>
                                        <p style={{ margin: '0 0 3px 0', color: '#854d0e', fontSize: '0.85rem' }}>Parent Account Name</p>
                                        <p style={{ margin: '0', fontWeight: '600', color: '#713f12' }}>{viewingStudent.student_parent.user?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 3px 0', color: '#854d0e', fontSize: '0.85rem' }}>Parent Email</p>
                                        <p style={{ margin: '0', fontWeight: '500', color: '#713f12' }}>{viewingStudent.student_parent.user?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 3px 0', color: '#854d0e', fontSize: '0.85rem' }}>Parent Phone</p>
                                        <p style={{ margin: '0', fontWeight: '600', color: '#713f12' }}>{viewingStudent.student_parent.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 3px 0', color: '#854d0e', fontSize: '0.85rem' }}>Parent Address</p>
                                        <p style={{ margin: '0', fontWeight: '500', color: '#713f12' }}>{viewingStudent.student_parent.address || 'N/A'}</p>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ margin: '0', fontStyle: 'italic', color: '#94a3b8' }}>No parent account linked yet</p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
            {/* Homeroom Attendance & Performance Summary Report Modal */}
            <Modal
                isOpen={!!reportClass}
                onClose={() => setReportClass(null)}
                title={`📊 របាយការណ៍វត្តមានថ្នាក់បន្ទុក - ${reportClass?.name || ''}`}
                maxWidth="950px"
                footer={
                    <Button variant="secondary" onClick={() => setReportClass(null)}>Close</Button>
                }
            >
                {loadingReport ? (
                    <p style={{ textAlign: 'center', padding: '2rem' }}>Loading report...</p>
                ) : reportData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {/* Summary Header Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem' }}>
                            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', display: 'block' }}>សិស្សសរុប (Total Students)</span>
                                <strong style={{ fontSize: '1.4rem', color: '#0f172a' }}>{reportData.summary?.total_students || 0} នាក់</strong>
                            </div>
                            <div style={{ background: '#f0fdf4', padding: '0.85rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                                <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '600', display: 'block' }}>វត្តមានសរុប (Present)</span>
                                <strong style={{ fontSize: '1.4rem', color: '#15803d' }}>{reportData.summary?.present || 0} លើក</strong>
                            </div>
                            <div style={{ background: '#fef2f2', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fecaca' }}>
                                <span style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: '600', display: 'block' }}>អវត្តមានសរុប (Absent)</span>
                                <strong style={{ fontSize: '1.4rem', color: '#dc2626' }}>{reportData.summary?.absent || 0} លើក</strong>
                            </div>
                            <div style={{ background: '#fefce8', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fef08a' }}>
                                <span style={{ fontSize: '0.8rem', color: '#854d0e', fontWeight: '600', display: 'block' }}>មកយឺត (Late) / ច្បាប់</span>
                                <strong style={{ fontSize: '1.4rem', color: '#b45309' }}>{(reportData.summary?.late || 0) + (reportData.summary?.permission || 0)} លើក</strong>
                            </div>
                            <div style={{ background: '#eff6ff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                                <span style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: '600', display: 'block' }}>អត្រាវត្តមានសរុប (Rate)</span>
                                <strong style={{ fontSize: '1.4rem', color: '#2563eb' }}>{reportData.summary?.overall_rate || '100%'}</strong>
                            </div>
                        </div>

                        {/* Student Attendance Report Table */}
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                <thead>
                                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                                        <th style={{ padding: '0.7rem' }}>Code</th>
                                        <th style={{ padding: '0.7rem' }}>Name (ឈ្មោះសិស្ស)</th>
                                        <th style={{ padding: '0.7rem' }}>Position</th>
                                        <th style={{ padding: '0.7rem', textAlign: 'center' }}>Present</th>
                                        <th style={{ padding: '0.7rem', textAlign: 'center' }}>Absent</th>
                                        <th style={{ padding: '0.7rem', textAlign: 'center' }}>Late / Perm</th>
                                        <th style={{ padding: '0.7rem', textAlign: 'center' }}>Rate (%)</th>
                                        <th style={{ padding: '0.7rem' }}>Parent Contact</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.students?.map((st, idx) => (
                                        <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9', background: st.attendance?.status_warning ? '#fef2f2' : idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                            <td style={{ padding: '0.65rem', fontWeight: '600', color: '#475569' }}>{st.student_code}</td>
                                            <td style={{ padding: '0.65rem' }}>
                                                <strong>{st.name}</strong>
                                                {st.attendance?.status_warning && (
                                                    <span style={{ marginLeft: '0.4rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: '#dc2626', color: '#ffffff', fontSize: '0.72rem', fontWeight: '700' }}>
                                                        ⚠️ អវត្តមានច្រើន
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.65rem' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: st.class_position === 'Class Monitor' ? '#92400e' : '#475569' }}>
                                                    {st.class_position === 'Class Monitor' ? '👑 ប្រធាន' : st.class_position === 'Vice Monitor' ? '⭐ អនុប្រធាន' : st.class_position}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: '700', color: '#16a34a' }}>{st.attendance?.present}</td>
                                            <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: '700', color: st.attendance?.absent > 0 ? '#dc2626' : '#64748b' }}>{st.attendance?.absent}</td>
                                            <td style={{ padding: '0.65rem', textAlign: 'center', color: '#b45309', fontWeight: '600' }}>{st.attendance?.late} / {st.attendance?.permission}</td>
                                            <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem',
                                                    backgroundColor: st.attendance?.status_warning ? '#fecaca' : '#dcfce7',
                                                    color: st.attendance?.status_warning ? '#991b1b' : '#166534'
                                                }}>
                                                    {st.attendance?.rate}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.65rem', fontSize: '0.82rem' }}>
                                                <div><strong>{st.parent_name}</strong></div>
                                                <div style={{ color: '#64748b' }}>{st.parent_phone}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default MyClasses;
