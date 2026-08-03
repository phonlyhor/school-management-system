import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { bulkStoreAttendance, getTeacherAttendanceHistory } from '../../services/attendanceService';
import { getClassStudents } from '../../services/teacherService';
import { exportToCSV } from '../../utils/excelExporter';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Attendance = () => {
    const [activeTab, setActiveTab] = useState('take'); // 'take' | 'history'

    // Form states for taking attendance
    const [schedule, setSchedule] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({}); // { student_id: 'present'|'absent'|'late' }
    
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States for viewing history
    const [historyClass, setHistoryClass] = useState('');
    const [historyDate, setHistoryDate] = useState('');
    const [historyRecords, setHistoryRecords] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        // Fetch teacher's schedule to get classes and subjects they teach
        const fetchSchedule = async () => {
            try {
                const res = await api.get('/teacher/schedule');
                setSchedule(res.data.schedule || []);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load your assigned classes.");
            }
        };
        fetchSchedule();
    }, []);

    const fetchHistoryRecords = async (classId = historyClass, targetDate = historyDate) => {
        setLoadingHistory(true);
        try {
            const params = {};
            if (classId) params.class_id = classId;
            if (targetDate) params.date = targetDate;
            const res = await getTeacherAttendanceHistory(params);
            setHistoryRecords(res.data?.attendance || []);
        } catch (err) {
            console.error("Failed to load attendance history:", err);
            toast.error("Failed to load attendance history.");
        } finally {
            setLoadingHistory(false);
        }
    };

    // Extract homeroom classes ONLY for history tab
    const homeroomClasses = Array.from(
        new Map(
            schedule
                .filter(item => item.class?.is_homeroom)
                .map(item => [item.class.id, item.class])
        ).values()
    );

    useEffect(() => {
        if (activeTab === 'history') {
            const defaultClassId = historyClass || (homeroomClasses.length > 0 ? String(homeroomClasses[0].id) : '');
            if (!historyClass && homeroomClasses.length > 0) {
                setHistoryClass(String(homeroomClasses[0].id));
            }
            fetchHistoryRecords(defaultClassId, historyDate);
        }
    }, [activeTab, schedule]);

    // Extract unique classes from schedule
    const uniqueClasses = Array.from(new Map(schedule.map(item => [item.class.id, item.class])).values());
    
    // Extract unique subjects for the selected class + Homeroom option
    const rawSubjects = Array.from(new Map(
        schedule
            .filter(item => item.class.id === parseInt(selectedClass))
            .filter(item => item.subject && item.subject.id !== 0)
            .map(item => [item.subject.id, item.subject])
    ).values());

    const isSelectedClassHomeroom = schedule.some(item => item.class.id === parseInt(selectedClass) && item.class.is_homeroom);

    const availableSubjects = isSelectedClassHomeroom || rawSubjects.length === 0
        ? [{ id: 'homeroom', name: '👑 វត្តមានប្រចាំថ្ងៃ (Homeroom Daily Attendance)', code: 'HR' }, ...rawSubjects]
        : rawSubjects;

    const handleLoadStudents = async () => {
        if (!selectedClass || !selectedSubject || !date) {
            toast.error("Please select a class, subject, and date.");
            return;
        }

        setLoading(true);
        try {
            const res = await getClassStudents(selectedClass);
            const studentList = res.data.students || [];
            const todayAtts = res.data.today_attendances || [];

            const attMapByStudent = {};
            todayAtts.forEach(att => {
                if (att.student_id) {
                    attMapByStudent[att.student_id] = att.status;
                }
            });

            setStudents(studentList);
            
            // Initialize attendance data using saved attendance if available, else default to 'present'
            const initialData = {};
            studentList.forEach(s => {
                initialData[s.id] = attMapByStudent[s.id] || 'present';
            });
            setAttendanceData(initialData);

        } catch (err) {
            console.error(err);
            toast.error("Failed to load students.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSubmit = async () => {
        if (students.length === 0) return;
        setIsSubmitting(true);
        
        const payload = {
            class_id: selectedClass,
            subject_id: selectedSubject,
            date: date,
            students: Object.keys(attendanceData).map(studentId => ({
                student_id: studentId,
                status: attendanceData[studentId],
                note: ''
            }))
        };

        try {
            await bulkStoreAttendance(payload);
            toast.success("Attendance saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save attendance.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        { header: 'Student ID', render: (row) => row.student_code },
        { header: 'Name', render: (row) => row.user?.name },
        { 
            header: 'Status', 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                        onClick={() => handleStatusChange(row.id, 'present')}
                        style={{
                            padding: '0.4rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                            backgroundColor: attendanceData[row.id] === 'present' ? '#22c55e' : '#e2e8f0',
                            color: attendanceData[row.id] === 'present' ? 'white' : '#64748b'
                        }}
                    >
                        Present
                    </button>
                    <button 
                        onClick={() => handleStatusChange(row.id, 'absent')}
                        style={{
                            padding: '0.4rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                            backgroundColor: attendanceData[row.id] === 'absent' ? '#ef4444' : '#e2e8f0',
                            color: attendanceData[row.id] === 'absent' ? 'white' : '#64748b'
                        }}
                    >
                        Absent
                    </button>
                    <button 
                        onClick={() => handleStatusChange(row.id, 'late')}
                        style={{
                            padding: '0.4rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                            backgroundColor: attendanceData[row.id] === 'late' ? '#f59e0b' : '#e2e8f0',
                            color: attendanceData[row.id] === 'late' ? 'white' : '#64748b'
                        }}
                    >
                        Late
                    </button>
                </div>
            )
        }
    ];

    const historyColumns = [
        { header: 'កាលបរិច្ឆេទ (Date)', render: (row) => row.date },
        { header: 'កូដសិស្ស (Code)', render: (row) => row.student?.student_code || 'N/A' },
        { header: 'ឈ្មោះសិស្ស (Name)', render: (row) => <strong>{row.student?.name || 'N/A'}</strong> },
        { header: 'ថ្នាក់រៀន (Class)', render: (row) => row.class?.name || 'N/A' },
        { header: 'មុខវិជ្ជា (Subject)', render: (row) => row.subject?.name || 'N/A' },
        { 
            header: 'ស្ថានភាព (Status)', 
            render: (row) => {
                const statusMap = {
                    present: { label: 'វត្តមាន (Present)', bg: '#dcfce7', text: '#15803d' },
                    absent: { label: 'អវត្តមាន (Absent)', bg: '#fee2e2', text: '#b91c1c' },
                    late: { label: 'យឺត (Late)', bg: '#fef3c7', text: '#b45309' },
                    permission: { label: 'សុំច្បាប់ (Permission)', bg: '#dbeafe', text: '#1d4ed8' }
                };
                const s = statusMap[row.status?.toLowerCase()] || { label: row.status, bg: '#f1f5f9', text: '#475569' };
                return (
                    <span style={{ padding: '0.3rem 0.75rem', borderRadius: '12px', background: s.bg, color: s.text, fontWeight: '600', fontSize: '0.85rem' }}>
                        {s.label}
                    </span>
                );
            } 
        }
    ];

    const handleExportTeacherAttendanceExcel = () => {
        if (!students || students.length === 0) {
            toast.error("មិនទាន់មានបញ្ជីសិស្សសម្រាប់ទាញយកទេ! (No students loaded)");
            return;
        }

        const className = uniqueClasses.find(c => c.id === parseInt(selectedClass))?.name || 'Class';
        const subjectObj = availableSubjects.find(s => String(s.id) === String(selectedSubject));
        const subjectName = subjectObj ? subjectObj.name : 'Subject';

        const exportCols = [
            { header: 'កាលបរិច្ឆេទ (Date)', renderText: () => date },
            { header: 'កូដសិស្ស (Student ID)', accessor: 'student_code' },
            { header: 'ឈ្មោះសិស្ស (Student Name)', renderText: (s) => s.user?.name || s.name },
            { header: 'ថ្នាក់រៀន (Class)', renderText: () => className },
            { header: 'មុខវិជ្ជា (Subject)', renderText: () => subjectName },
            { header: 'ស្ថានភាព (Status)', renderText: (s) => (attendanceData[s.id] || 'present').toUpperCase() },
        ];

        exportToCSV(`Class_Attendance_${className}_${date}.csv`, exportCols, students);
    };

    const handleExportHistoryExcel = () => {
        if (historyRecords.length === 0) {
            toast.error("មិនទាន់មានប្រវត្តិវត្តមានសម្រាប់ទាញយកទេ!");
            return;
        }
        const exportCols = [
            { header: 'កាលបរិច្ឆេទ (Date)', accessor: 'date' },
            { header: 'កូដសិស្ស (Student Code)', renderText: (r) => r.student?.student_code || '' },
            { header: 'ឈ្មោះសិស្ស (Student Name)', renderText: (r) => r.student?.name || '' },
            { header: 'ថ្នាក់រៀន (Class)', renderText: (r) => r.class?.name || '' },
            { header: 'មុខវិជ្ជា (Subject)', renderText: (r) => r.subject?.name || '' },
            { header: 'ស្ថានភាព (Status)', accessor: 'status' }
        ];
        exportToCSV(`Attendance_History_${historyDate || 'All'}.csv`, exportCols, historyRecords);
    };

    const hasHomeroomClasses = schedule.some(item => item.class?.is_homeroom);

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>
                        📋 {activeTab === 'take' ? 'ស្រង់វត្តមានសិស្ស (Take Attendance)' : 'ប្រវត្តិវត្តមានសិស្ស (Attendance History)'}
                    </h1>
                    {!hasHomeroomClasses && (
                        <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                            ℹ️ លោកគ្រូ/អ្នកគ្រូមុខវិជ្ជាអាចស្រង់វត្តមានសិស្សតាមម៉ោងបង្រៀនបាន។ (របាយការណ៍សរុបមានសិទ្ធិសម្រាប់តែ «គ្រូបន្ទុកថ្នាក់» ឬ Admin)
                        </p>
                    )}
                </div>
                
                {/* Navigation Tabs (Show History tab only to Homeroom Teachers & Admins) */}
                {hasHomeroomClasses && (
                    <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', padding: '0.25rem', borderRadius: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setActiveTab('take')}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                background: activeTab === 'take' ? '#ffffff' : 'transparent',
                                color: activeTab === 'take' ? '#4f46e5' : '#64748b',
                                boxShadow: activeTab === 'take' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            📝 ស្រង់វត្តមាន
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                background: activeTab === 'history' ? '#ffffff' : 'transparent',
                                color: activeTab === 'history' ? '#4f46e5' : '#64748b',
                                boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            📜 ប្រវត្តិវត្តមាន & របាយការណ៍
                        </button>
                    </div>
                )}
            </div>

            {activeTab === 'take' ? (
                <Card>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#0f172a' }}>ថ្នាក់រៀន (Class)</label>
                            <select 
                                value={selectedClass} 
                                onChange={(e) => { 
                                    const newClassId = e.target.value;
                                    setSelectedClass(newClassId);
                                    
                                    // Auto-select first subject for the selected class
                                    const classIdInt = parseInt(newClassId);
                                    const classSubjects = Array.from(new Map(
                                        schedule
                                            .filter(item => item.class.id === classIdInt)
                                            .filter(item => item.subject && item.subject.id !== 0)
                                            .map(item => [item.subject.id, item.subject])
                                    ).values());
                                    const isHR = schedule.some(item => item.class.id === classIdInt && item.class.is_homeroom);

                                    if (!isHR && classSubjects.length > 0) {
                                        setSelectedSubject(String(classSubjects[0].id));
                                    } else if (isHR) {
                                        setSelectedSubject('homeroom');
                                    } else {
                                        setSelectedSubject('');
                                    }
                                }}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                <option value="">-- ជ្រើសរើសថ្នាក់រៀន (Select Class) --</option>
                                {uniqueClasses.map(c => <option key={c.id} value={c.id}>ថ្នាក់ {c.name}</option>)}
                            </select>
                        </div>

                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#0f172a' }}>មុខវិជ្ជា (Subject)</label>
                            <select 
                                value={selectedSubject} 
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                disabled={!selectedClass}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', opacity: !selectedClass ? 0.5 : 1, fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                <option value="">-- ជ្រើសរើសមុខវិជ្ជា (Select Subject) --</option>
                                {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <Input label="កាលបរិច្ឆេទ (Date)" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>

                        <Button onClick={handleLoadStudents} disabled={loading || !selectedClass || !selectedSubject}>
                            {loading ? 'កំពុងទាញយក...' : '📋 បង្ហាញបញ្ជីសិស្ស (Load Students)'}
                        </Button>
                    </div>

                    {students.length > 0 ? (
                        <>
                            <Table columns={columns} data={students} />
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <Button variant="secondary" onClick={handleExportTeacherAttendanceExcel}>
                                    📊 Export Excel
                                </Button>
                                <Button size="large" onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving Attendance...' : 'Submit Attendance'}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            <p>Please select a class and subject, then click "Load Students" to begin taking attendance.</p>
                        </div>
                    )}
                </Card>
            ) : (
                <Card>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>ថ្នាក់រៀន (Class Filter)</label>
                            <select 
                                value={historyClass} 
                                onChange={(e) => {
                                    setHistoryClass(e.target.value);
                                    fetchHistoryRecords(e.target.value, historyDate);
                                }}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            >
                                {homeroomClasses.length > 1 && (
                                    <option value="">-- គ្រប់ថ្នាក់បន្ទុក (All Homeroom Classes) --</option>
                                )}
                                {homeroomClasses.map(c => (
                                    <option key={c.id} value={c.id}>
                                        👑 {c.name} (ថ្នាក់បន្ទុក)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: '1', minWidth: '200px' }}>
                            <Input 
                                label="កាលបរិច្ឆេទ (Date Filter)" 
                                type="date" 
                                value={historyDate} 
                                onChange={(e) => {
                                    setHistoryDate(e.target.value);
                                    fetchHistoryRecords(historyClass, e.target.value);
                                }} 
                            />
                        </div>

                        <Button 
                            variant="secondary" 
                            onClick={() => {
                                setHistoryClass('');
                                setHistoryDate('');
                                fetchHistoryRecords('', '');
                            }}
                        >
                            🔄 Reset Filter
                        </Button>

                        {historyRecords.length > 0 && (
                            <Button variant="secondary" onClick={handleExportHistoryExcel}>
                                📊 Export Excel
                            </Button>
                        )}
                    </div>

                    {loadingHistory ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            កំពុងទាញយកប្រវត្តិវត្តមាន... (Loading attendance history...)
                        </div>
                    ) : historyRecords.length > 0 ? (
                        <Table columns={historyColumns} data={historyRecords} />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            <p style={{ margin: 0, fontWeight: '500' }}>មិនទាន់មានប្រវត្តិវត្តមានសម្រាប់ថ្នាក់/កាលបរិច្ឆេទដែលបានជ្រើសរើសឡើយ។</p>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default Attendance;
