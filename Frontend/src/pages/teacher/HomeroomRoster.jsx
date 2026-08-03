import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { getTeacherSchedule, getClassStudents, updateStudentPosition } from '../../services/teacherService';
import { exportToCSV } from '../../utils/excelExporter';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiUsers, FiUserCheck, FiCalendar, FiBookOpen, FiAward, FiEye, FiDownload, FiSearch } from 'react-icons/fi';

const HomeroomRoster = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [classesList, setClassesList] = useState([]);
    const [classData, setClassData] = useState(null);
    const [students, setStudents] = useState([]);
    const [subjectTeachers, setSubjectTeachers] = useState([]);
    const [todayAttendances, setTodayAttendances] = useState([]);
    const [isHomeroom, setIsHomeroom] = useState(false);
    const [loadingClass, setLoadingClass] = useState(false);

    // Active Tab state inside full page
    const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'teachers' | 'attendances'

    // History and Filter states
    const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
    const [teacherFilter, setTeacherFilter] = useState('all');
    const [loadingHistory, setLoadingHistory] = useState(false);
    // Attendance Summary Report states
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);

    const fetchClassReport = async (classId = selectedClassId) => {
        if (!classId) return;
        setLoadingReport(true);
        try {
            const res = await api.get(`/attendance/report/class/${classId}`);
            setReportData(res.data);
        } catch (err) {
            console.error("Failed to load class report:", err);
            toast.error("Failed to load attendance report.");
        } finally {
            setLoadingReport(false);
        }
    };

    // Student profile view modal
    const [viewingStudent, setViewingStudent] = useState(null);

    // Student score view modal
    const [selectedStudentScores, setSelectedStudentScores] = useState(null);

    // Position updating status
    const [updatingPositionId, setUpdatingPositionId] = useState(null);

    useEffect(() => {
        fetchTeacherSchedule();
    }, []);

    const fetchTeacherSchedule = async () => {
        setLoading(true);
        try {
            const res = await getTeacherSchedule();
            const schedList = res.data.schedule || [];
            setSchedule(schedList);

            // Deduplicate classes
            const classMap = new Map();
            schedList.forEach(item => {
                if (item.class && item.class.id) {
                    if (!classMap.has(item.class.id)) {
                        classMap.set(item.class.id, item.class);
                    } else if (item.class.is_homeroom) {
                        classMap.set(item.class.id, item.class);
                    }
                }
            });

            const uniqueClasses = Array.from(classMap.values()).sort((a, b) => {
                if (a.is_homeroom && !b.is_homeroom) return -1;
                if (!a.is_homeroom && b.is_homeroom) return 1;
                return 0;
            });

            setClassesList(uniqueClasses);

            if (uniqueClasses.length > 0) {
                const defaultClass = uniqueClasses.find(c => c.is_homeroom) || uniqueClasses[0];
                setSelectedClassId(String(defaultClass.id));
                loadClassDetails(defaultClass.id, historyDate);
            }
        } catch (err) {
            console.error("Failed to load teacher schedule:", err);
            toast.error("Failed to load class list.");
        } finally {
            setLoading(false);
        }
    };

    const loadClassDetails = async (classId, dateVal = historyDate) => {
        if (!classId) return;
        setLoadingClass(true);
        try {
            const res = await getClassStudents(classId, dateVal);
            setClassData(res.data.class || null);
            setStudents(res.data.students || []);
            setIsHomeroom(res.data.is_homeroom || false);
            setTodayAttendances(res.data.today_attendances || []);
            setSubjectTeachers(res.data.subject_teachers || []);
        } catch (err) {
            console.error("Failed to load class roster details:", err);
            toast.error("Failed to load student roster for selected class.");
        } finally {
            setLoadingClass(false);
        }
    };

    const handleClassChange = (e) => {
        const newClassId = e.target.value;
        setSelectedClassId(newClassId);
        setTeacherFilter('all');
        loadClassDetails(newClassId, historyDate);
    };

    const handleDateChange = async (newDate) => {
        setHistoryDate(newDate);
        if (!selectedClassId) return;
        setLoadingHistory(true);
        try {
            const res = await getClassStudents(selectedClassId, newDate);
            setTodayAttendances(res.data.today_attendances || []);
        } catch (err) {
            console.error("Failed to load attendance logs for date:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleUpdatePosition = async (studentId, newPosition) => {
        setUpdatingPositionId(studentId);
        try {
            await updateStudentPosition(studentId, newPosition);
            toast.success(`🎉 បានប្តូរតួនាទីសិស្សទៅជា «${newPosition}» ដោយជោគជ័យ!`);
            setStudents(prev => prev.map(st => st.id === studentId ? { ...st, class_position: newPosition } : st));
        } catch (err) {
            console.error("Failed to update position:", err);
            toast.error("Failed to update student position: " + (err.response?.data?.message || err.message));
        } finally {
            setUpdatingPositionId(null);
        }
    };

    const handleExportExcel = () => {
        if (students.length === 0) {
            toast.error("គ្មានទិន្នន័យសិស្សសម្រាប់ Export ទេ");
            return;
        }

        const selectedClsObj = classesList.find(c => String(c.id) === String(selectedClassId));
        const exportData = students.map((st, index) => ({
            'ល.រ (No)': index + 1,
            'អត្តលេខ (Student Code)': st.student_code,
            'ឈ្មោះសិស្ស (Name)': st.user?.name || '',
            'ភេទ (Gender)': st.gender === 'male' ? 'ប្រុស' : 'ស្រី',
            'អាយុ (Age)': st.age || 'N/A',
            'តួនាទីក្នុងថ្នាក់ (Position)': st.class_position || 'Member',
            'ឈ្មោះអាណាព្យាបាល (Parent)': st.student_parent?.user?.name || 'N/A',
            'លេខទូរស័ព្ទ (Phone)': st.student_parent?.user?.phone || 'N/A',
        }));

        exportToCSV(exportData, `Student_Roster_Class_${selectedClsObj?.name || selectedClassId}_${historyDate}`);
        toast.success("បានទាញយកទិន្នន័យបញ្ជីឈ្មោះសិស្សជា Excel រួចរាល់!");
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${path.replace(/^\//, '')}`;
    };

    const monitorStudent = students.find(s => s.class_position === 'Class Monitor');
    const viceMonitorStudent = students.find(s => s.class_position === 'Vice Monitor');

    const studentColumns = [
        {
            header: '#',
            accessor: (st, idx) => idx + 1
        },
        {
            header: 'Student Code',
            accessor: (st) => (
                <span style={{ fontWeight: '700', color: '#475569' }}>{st.student_code}</span>
            )
        },
        {
            header: 'Student Name',
            accessor: (st) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {getImageUrl(st.photo) ? (
                        <img src={getImageUrl(st.photo)} alt={st.user?.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                    ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {st.user?.name?.charAt(0) || 'S'}
                        </div>
                    )}
                    <div>
                        <strong style={{ color: '#0f172a' }}>{st.user?.name}</strong>
                        {st.class_position && st.class_position !== 'Member' && (
                            <span style={{
                                marginLeft: '0.4rem', fontSize: '0.75rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '12px',
                                backgroundColor: st.class_position === 'Class Monitor' ? '#fef3c7' : st.class_position === 'Vice Monitor' ? '#e0e7ff' : '#f3e8ff',
                                color: st.class_position === 'Class Monitor' ? '#b45309' : st.class_position === 'Vice Monitor' ? '#4338ca' : '#6b21a8',
                                border: '1px solid currentColor'
                            }}>
                                {st.class_position === 'Class Monitor' ? '👑 ប្រធានថ្នាក់' : st.class_position === 'Vice Monitor' ? '⭐ អនុប្រធាន' : st.class_position}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: 'Class Position (តួនាទីក្នុងថ្នាក់)',
            accessor: (st) => (
                isHomeroom ? (
                    <select
                        value={st.class_position || 'Member'}
                        disabled={updatingPositionId === st.id}
                        onChange={(e) => handleUpdatePosition(st.id, e.target.value)}
                        style={{
                            padding: '0.35rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontWeight: '700',
                            fontSize: '0.82rem',
                            backgroundColor: st.class_position === 'Class Monitor' ? '#fffbe6' : st.class_position === 'Vice Monitor' ? '#f0f5ff' : '#ffffff',
                            color: st.class_position === 'Class Monitor' ? '#d48806' : st.class_position === 'Vice Monitor' ? '#1d39c4' : '#334155'
                        }}
                    >
                        <option value="Member">សមាជិក (Member)</option>
                        <option value="Class Monitor">👑 ប្រធានថ្នាក់ (Class Monitor)</option>
                        <option value="Vice Monitor">⭐ អនុប្រធានថ្នាក់ (Vice Monitor)</option>
                        <option value="Treasurer">💰 បេឡា / រតនាគារិក (Treasurer)</option>
                        <option value="Secretary">📝 លេខាធិការ (Secretary)</option>
                    </select>
                ) : (
                    <span style={{ fontWeight: '600', color: '#475569' }}>{st.class_position || 'Member'}</span>
                )
            )
        },
        {
            header: 'Age / Gender',
            accessor: (st) => (
                <span style={{ fontSize: '0.85rem' }}>
                    {st.age ? `${st.age} ឆ្នាំ` : 'N/A'} ({st.gender === 'male' ? 'Male' : 'Female'})
                </span>
            )
        },
        {
            header: 'Parent Contact (អាណាព្យាបាល)',
            accessor: (st) => (
                <div style={{ fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{st.student_parent?.user?.name || 'N/A'}</div>
                    <div style={{ color: '#0284c7', fontWeight: '700' }}>{st.student_parent?.user?.phone || 'N/A'}</div>
                </div>
            )
        },
        {
            header: 'Actions (សកម្មភាព)',
            accessor: (st) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Button size="small" variant="secondary" onClick={() => setViewingStudent(st)}>
                        👁️ ព័ត៌មាន
                    </Button>
                    {st.scores && st.scores.length > 0 && (
                        <Button size="small" variant="secondary" onClick={() => setSelectedStudentScores(st)} style={{ borderColor: '#3b82f6', color: '#1d4ed8' }}>
                            📊 មើលពិន្ទុ
                        </Button>
                    )}
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                <h3>🔄 កំពុងទាញយកទិន្នន័យថ្នាក់បន្ទុក...</h3>
            </div>
        );
    }

    const currentClassObj = classesList.find(c => String(c.id) === String(selectedClassId));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header Title Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
                        <FiUsers style={{ color: '#4f46e5' }} /> គ្រប់គ្រងថ្នាក់បន្ទុក & វត្តមានសិស្ស (Homeroom Roster & Attendance Portal)
                    </h2>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                        គ្រប់គ្រងបញ្ជីឈ្មោះសិស្ស, ចាត់តាំងប្រធានថ្នាក់, ពិនិត្យមើលកាលវិភាគគ្រូមុខវិជ្ជា និង តាមដានប្រវត្តិវត្តមានសិស្សតាមកាលបរិច្ឆេទ
                    </p>
                </div>

                {/* Class Selector Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.5rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                    <strong style={{ color: '#334155', fontSize: '0.92rem' }}>🏫 ជ្រើសរើសថ្នាក់ ៖</strong>
                    <select
                        value={selectedClassId}
                        onChange={handleClassChange}
                        style={{ padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid #94a3b8', fontWeight: '700', fontSize: '0.95rem', color: '#0f172a', backgroundColor: '#ffffff', cursor: 'pointer' }}
                    >
                        {classesList.map(cls => (
                            <option key={cls.id} value={String(cls.id)}>
                                {cls.name} {cls.is_homeroom ? '👑 (ថ្នាក់បន្ទុក)' : '📘 (ថ្នាក់មុខវិជ្ជា)'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Quick Stat Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <Card style={{ borderLeft: '4px solid #4f46e5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>ចំនួនសិស្សសរុប (Total Students)</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e1b4b', marginTop: '0.2rem' }}>{students.length} នាក់</div>
                        </div>
                        <div style={{ background: '#e0e7ff', p: '0.75rem', borderRadius: '50%', color: '#4338ca', padding: '0.75rem' }}>
                            <FiUsers size={24} />
                        </div>
                    </div>
                </Card>

                <Card style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>👑 ប្រធានថ្នាក់ (Class Monitor)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#b45309', marginTop: '0.25rem' }}>
                                {monitorStudent ? monitorStudent.user?.name : 'មិនទាន់ចាត់តាំង'}
                            </div>
                        </div>
                        <div style={{ background: '#fef3c7', borderRadius: '50%', color: '#d97706', padding: '0.75rem' }}>
                            <FiAward size={24} />
                        </div>
                    </div>
                </Card>

                <Card style={{ borderLeft: '4px solid #0284c7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>⭐ អនុប្រធានថ្នាក់ (Vice Monitor)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0369a1', marginTop: '0.25rem' }}>
                                {viceMonitorStudent ? viceMonitorStudent.user?.name : 'មិនទាន់ចាត់តាំង'}
                            </div>
                        </div>
                        <div style={{ background: '#e0f2fe', borderRadius: '50%', color: '#0284c7', padding: '0.75rem' }}>
                            <FiUserCheck size={24} />
                        </div>
                    </div>
                </Card>

                <Card style={{ borderLeft: '4px solid #16a34a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>👨‍🏫 គ្រូបន្ទុកថ្នាក់ (Homeroom Teacher)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#15803d', marginTop: '0.25rem' }}>
                                {classData?.homeroom_teacher_name || 'ខ្ញុំបាទ/នាងខ្ញុំ'}
                            </div>
                        </div>
                        <div style={{ background: '#dcfce7', borderRadius: '50%', color: '#16a34a', padding: '0.75rem' }}>
                            <FiBookOpen size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content Area with Navigation Tabs */}
            <Card style={{ padding: '1.25rem' }}>
                {/* Clean Tab Navigation Bar */}
                <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('roster')}
                        style={{
                            padding: '0.65rem 1.2rem',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.92rem',
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'roster' ? '#4f46e5' : '#f1f5f9',
                            color: activeTab === 'roster' ? '#ffffff' : '#475569',
                            boxShadow: activeTab === 'roster' ? '0 2px 4px rgba(79,70,229,0.25)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                        }}
                    >
                        <FiUsers /> 👥 បញ្ជីឈ្មោះសិស្ស & តួនាទី ({students.length})
                    </button>

                    {isHomeroom && subjectTeachers.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('teachers')}
                            style={{
                                padding: '0.65rem 1.2rem',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: '700',
                                fontSize: '0.92rem',
                                cursor: 'pointer',
                                backgroundColor: activeTab === 'teachers' ? '#0284c7' : '#f1f5f9',
                                color: activeTab === 'teachers' ? '#ffffff' : '#475569',
                                boxShadow: activeTab === 'teachers' ? '0 2px 4px rgba(2,132,199,0.25)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            <FiBookOpen /> 👨‍🏫 គ្រូបង្រៀនតាមមុខវិជ្ជា ({subjectTeachers.length})
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setActiveTab('attendances')}
                        style={{
                            padding: '0.65rem 1.2rem',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.92rem',
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'attendances' ? '#ea580c' : '#f1f5f9',
                            color: activeTab === 'attendances' ? '#ffffff' : '#475569',
                            boxShadow: activeTab === 'attendances' ? '0 2px 4px rgba(234,88,12,0.25)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                        }}
                    >
                        <FiCalendar /> 📋 ប្រវត្តិវត្តមានសិស្សថ្នាក់ ({todayAttendances.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => { setActiveTab('report'); fetchClassReport(); }}
                        style={{
                            padding: '0.65rem 1.2rem',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.92rem',
                            cursor: 'pointer',
                            backgroundColor: activeTab === 'report' ? '#16a34a' : '#f1f5f9',
                            color: activeTab === 'report' ? '#ffffff' : '#475569',
                            boxShadow: activeTab === 'report' ? '0 2px 4px rgba(22,163,74,0.25)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                        }}
                    >
                        📊 របាយការណ៍វត្តមានសរុប (Attendance Report)
                    </button>

                    {/* Export Excel Button on Right */}
                    <div style={{ marginLeft: 'auto' }}>
                        <Button variant="secondary" onClick={handleExportExcel} disabled={students.length === 0}>
                            <FiDownload /> 📥 Export Excel
                        </Button>
                    </div>
                </div>

                {/* TAB 1: Student Roster & Positions */}
                {activeTab === 'roster' && (
                    <div>
                        <div style={{ marginBottom: '1.2rem', color: '#475569', fontSize: '0.88rem', background: isHomeroom ? '#f8fafc' : '#f0f9ff', padding: '0.85rem 1rem', borderRadius: '8px', border: isHomeroom ? '1px solid #e2e8f0' : '1px solid #bae6fd' }}>
                            {isHomeroom ? (
                                <span>💡 <strong>Homeroom Teacher Portal (គ្រប់គ្រងថ្នាក់បន្ទុក) ៖</strong> អ្នកអាចចាត់តាំងប្រធានថ្នាក់/អនុប្រធានថ្នាក់, ចុច <strong>📊 មើលពិន្ទុ</strong> ដើម្បីមើលពិន្ទុមុខវិជ្ជា និង <strong>👁️ ព័ត៌មាន</strong> ដើម្បីមើលព័ត៌មានលម្អិតសិស្ស។</span>
                            ) : (
                                <span>📘 <strong>Subject Teacher View (មើលបញ្ជីឈ្មោះសិស្ស) ៖</strong> អ្នកអាចមើលបញ្ជីឈ្មោះសិស្សក្នុងថ្នាក់បាន។ (តួនាទីចាត់តាំងប្រធានថ្នាក់ មានសម្រាប់តែ <strong>គ្រូបន្ទុកថ្នាក់ / Homeroom Teacher</strong> ប៉ុណ្ណោះ)</span>
                            )}
                        </div>

                        {loadingClass ? (
                            <p style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>🔄 កំពុងទាញយកបញ្ជីឈ្មោះសិស្ស...</p>
                        ) : students.length === 0 ? (
                            <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '2.5rem' }}>គ្មានសិស្សចុះឈ្មោះក្នុងថ្នាក់នេះនៅឡើយទេ។</p>
                        ) : (
                            <Table 
                                columns={studentColumns} 
                                data={[...students].sort((a, b) => {
                                    const rank = { 'Class Monitor': 1, 'Vice Monitor': 2, 'Treasurer': 3, 'Secretary': 4, 'Member': 5 };
                                    return (rank[a.class_position] || 99) - (rank[b.class_position] || 99);
                                })} 
                            />
                        )}
                    </div>
                )}

                {/* TAB 2: Subject Teachers & Schedule Times */}
                {activeTab === 'teachers' && isHomeroom && (
                    <div>
                        <div style={{ background: '#f0f9ff', padding: '1rem 1.2rem', borderRadius: '10px', border: '1px solid #bae6fd', marginBottom: '1rem' }}>
                            <strong style={{ color: '#0369a1', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
                                👨‍🏫 បញ្ជីគ្រូបង្រៀនតាមមុខវិជ្ជាក្នុងថ្នាក់បន្ទុក {currentClassObj?.name} ៖
                            </strong>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {subjectTeachers.map(st => (
                                    <div key={st.subject_id} style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #e0f2fe', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                                        <div style={{ fontWeight: '700', color: '#0284c7', fontSize: '1rem' }}>📘 {st.subject_name} ({st.subject_code})</div>
                                        <div style={{ color: '#334155', fontWeight: '700', marginTop: '6px', fontSize: '0.92rem' }}>
                                            👨‍🏫 លោកគ្រូ/អ្នកគ្រូ ៖ <strong>{st.teacher_name}</strong>
                                        </div>
                                        {st.study_times && st.study_times.length > 0 && (
                                            <div style={{ color: '#059669', fontSize: '0.84rem', fontWeight: '700', marginTop: '8px', background: '#ecfdf5', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                                                ⏰ ម៉ោងសិក្សា ៖ {st.study_times.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: Attendance History & Subject Logs */}
                {activeTab === 'attendances' && (
                    <div>
                        <div style={{ background: '#fff7ed', padding: '1.25rem', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <strong style={{ color: '#c2410c', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    📋 ប្រវត្តិវត្តមានសិស្សក្នុងថ្នាក់ (Attendance History & Logs) ៖
                                </strong>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#9a3412' }}>📅 កាលបរិច្ឆេទ ៖</span>
                                        <input
                                            type="date"
                                            value={historyDate}
                                            onChange={(e) => handleDateChange(e.target.value)}
                                            style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #fdba74', fontWeight: '700', fontSize: '0.88rem', color: '#7c2d12', backgroundColor: '#ffffff' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#9a3412' }}>🔍 តម្រងតាមគ្រូ ៖</span>
                                        <select
                                            value={teacherFilter}
                                            onChange={(e) => setTeacherFilter(e.target.value)}
                                            style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #fdba74', fontWeight: '700', fontSize: '0.88rem', color: '#7c2d12', backgroundColor: '#ffffff' }}
                                        >
                                            <option value="all">🌐 គ្រូបង្រៀន/មុខវិជ្ជាទាំងអស់ (All Teachers & Subjects)</option>
                                            {Array.from(new Map(
                                                todayAttendances.map(att => [
                                                    `${att.teacher_id}_${att.subject_id}`,
                                                    {
                                                        key: `${att.teacher_id}_${att.subject_id}`,
                                                        teacher_name: att.teacher?.name || 'N/A',
                                                        subject_name: att.subject?.name || 'វត្តមានប្រចាំថ្ងៃ'
                                                    }
                                                ])
                                            ).values()).map(opt => (
                                                <option key={opt.key} value={opt.key}>
                                                    👨‍🏫 លោកគ្រូ/អ្នកគ្រូ ៖ {opt.teacher_name} (📘 {opt.subject_name})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {loadingHistory ? (
                                <p style={{ textAlign: 'center', color: '#9a3412', padding: '2rem', fontStyle: 'italic' }}>🔄 កំពុងទាញយកប្រវត្តិវត្តមានថ្ងៃទី {historyDate}...</p>
                            ) : todayAttendances.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#9a3412', padding: '2rem', fontStyle: 'italic', background: '#ffffff', borderRadius: '8px', border: '1px dashed #fdba74' }}>
                                    🔕 គ្មានកំណត់ត្រាវត្តមានសម្រាប់ថ្ងៃទី {historyDate} ឡើយ។
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {todayAttendances
                                        .filter(att => teacherFilter === 'all' || `${att.teacher_id}_${att.subject_id}` === teacherFilter)
                                        .map(att => (
                                            <div key={att.id} style={{ fontSize: '0.9rem', color: '#7c2d12', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#ffffff', padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid #ffedd5', flexWrap: 'wrap' }}>
                                                <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{att.student?.user?.name || 'សិស្ស'}</strong>
                                                <span style={{
                                                    padding: '0.2rem 0.65rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.82rem',
                                                    backgroundColor: att.status === 'absent' ? '#ef4444' : att.status === 'late' ? '#eab308' : att.status === 'permission' ? '#3b82f6' : '#22c55e',
                                                    color: '#ffffff'
                                                }}>
                                                    {att.status === 'absent' ? '❌ អវត្តមាន (Absent)' : att.status === 'late' ? '⏰ មកយឺត (Late)' : att.status === 'permission' ? '📝 សុំច្បាប់ (Permission)' : '✅ វត្តមាន (Present)'}
                                                </span>
                                                <span>| មុខវិជ្ជា ៖ <strong style={{ color: '#0284c7' }}>{att.subject?.name || 'វត្តមានប្រចាំថ្ងៃ'}</strong></span>
                                                <span style={{ marginLeft: 'auto', color: '#9a3412', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                                    👨‍🏫 ស្រង់ដោយលោកគ្រូ/អ្នកគ្រូ ៖ <strong>{att.teacher?.name || 'N/A'}</strong>
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 4: Attendance Summary Report */}
                {activeTab === 'report' && (
                    <div>
                        {loadingReport ? (
                            <p style={{ textAlign: 'center', padding: '2.5rem', color: '#15803d' }}>🔄 កំពុងគណនានិងទាញយករបាយការណ៍វត្តមានប្រចាំថ្នាក់...</p>
                        ) : !reportData ? (
                            <p style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>គ្មានទិន្នន័យរបាយការណ៍វត្តមានឡើយ។</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                                    <div style={{ background: '#f0fdf4', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                                        <div style={{ color: '#16a34a', fontSize: '0.82rem', fontWeight: '700' }}>ថ្ងៃស្រង់វត្តមានសរុប (Days Recorded)</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#15803d', marginTop: '0.2rem' }}>{reportData.summary?.total_recorded_days || 0} ថ្ងៃ</div>
                                    </div>
                                    <div style={{ background: '#eff6ff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                                        <div style={{ color: '#2563eb', fontSize: '0.82rem', fontWeight: '700' }}>វត្តមានសរុប (Total Present)</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1d4ed8', marginTop: '0.2rem' }}>{reportData.summary?.total_present || 0} ដង</div>
                                    </div>
                                    <div style={{ background: '#fef2f2', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #fecaca' }}>
                                        <div style={{ color: '#dc2626', fontSize: '0.82rem', fontWeight: '700' }}>អវត្តមានសរុប (Total Absent)</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#b91c1c', marginTop: '0.2rem' }}>{reportData.summary?.total_absent || 0} ដង</div>
                                    </div>
                                    <div style={{ background: '#fffbe6', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #ffe58f' }}>
                                        <div style={{ color: '#d48806', fontSize: '0.82rem', fontWeight: '700' }}>ភាគរយវត្តមានមធ្យម (Overall Rate)</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#d48806', marginTop: '0.2rem' }}>{reportData.summary?.overall_attendance_rate || '100%'}</div>
                                    </div>
                                </div>

                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem 1rem' }}>#</th>
                                                <th style={{ padding: '0.75rem 1rem' }}>Student ID</th>
                                                <th style={{ padding: '0.75rem 1rem' }}>Student Name</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>✅ វត្តមាន</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>❌ អវត្តមាន</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>⏰ មកយឺត</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>📝 សុំច្បាប់</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>📊 ភាគរយ (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(reportData.students_report || []).map((st, idx) => (
                                                <tr key={st.student_id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                                    <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{idx + 1}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#475569' }}>{st.student_code}</td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>
                                                        <strong style={{ color: '#0f172a' }}>{st.name}</strong>
                                                        {st.class_position && st.class_position !== 'Member' && (
                                                            <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', color: '#b45309', fontWeight: '700' }}>({st.class_position})</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700', color: '#16a34a' }}>{st.present_count || 0}</td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700', color: '#ef4444' }}>{st.absent_count || 0}</td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700', color: '#eab308' }}>{st.late_count || 0}</td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '700', color: '#3b82f6' }}>{st.permission_count || 0}</td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '800', fontSize: '0.82rem',
                                                            backgroundColor: parseFloat(st.attendance_rate) >= 90 ? '#dcfce7' : parseFloat(st.attendance_rate) >= 75 ? '#fef3c7' : '#fee2e2',
                                                            color: parseFloat(st.attendance_rate) >= 90 ? '#15803d' : parseFloat(st.attendance_rate) >= 75 ? '#b45309' : '#b91c1c'
                                                        }}>
                                                            {st.attendance_rate || '100%'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            {/* View Full Student Profile Modal */}
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
                        <div style={{ display: 'flex', gap: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                            {getImageUrl(viewingStudent.photo) ? (
                                <img src={getImageUrl(viewingStudent.photo)} alt={viewingStudent.user?.name} style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #6366f1' }} />
                            ) : (
                                <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', fontWeight: 'bold' }}>
                                    {viewingStudent.user?.name?.charAt(0) || 'S'}
                                </div>
                            )}
                            <div>
                                <h3 style={{ margin: 0, color: '#0f172a' }}>{viewingStudent.user?.name}</h3>
                                <p style={{ margin: '0.2rem 0', color: '#64748b', fontSize: '0.88rem' }}>
                                    Student Code: <strong>{viewingStudent.student_code}</strong> | Gender: <strong>{viewingStudent.gender === 'male' ? 'ប្រុស' : 'ស្រី'}</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default HomeroomRoster;
