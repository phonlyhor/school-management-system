import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { bulkStoreAttendance } from '../../services/attendanceService';
import { getClassStudents } from '../../services/teacherService';
import { exportToCSV } from '../../utils/excelExporter';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Attendance = () => {
    const [schedule, setSchedule] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({}); // { student_id: 'present'|'absent'|'late' }
    
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            setStudents(studentList);
            
            // Initialize attendance data to 'present' for all students
            const initialData = {};
            studentList.forEach(s => {
                initialData[s.id] = 'present';
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
            // Clear or keep data based on preference
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

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Take Attendance (ស្រង់វត្តមានសិស្ស)</h1>
                {students.length > 0 && (
                    <Button variant="secondary" onClick={handleExportTeacherAttendanceExcel}>
                        📊 Export Excel
                    </Button>
                )}
            </div>

            <Card>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Class</label>
                        <select 
                            value={selectedClass} 
                            onChange={(e) => { setSelectedClass(e.target.value); setSelectedSubject(''); }}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        >
                            <option value="">-- Select Class --</option>
                            {uniqueClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Subject</label>
                        <select 
                            value={selectedSubject} 
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            disabled={!selectedClass}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', opacity: !selectedClass ? 0.5 : 1 }}
                        >
                            <option value="">-- Select Subject --</option>
                            {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>

                    <Button onClick={handleLoadStudents} disabled={loading || !selectedClass || !selectedSubject}>
                        {loading ? 'Loading...' : 'Load Students'}
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
        </div>
    );
};

export default Attendance;
