import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import WeeklyCalendar from '../../components/common/WeeklyCalendar';
import { useLanguage } from '../../context/LanguageContext';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, batchCreateSchedules } from '../../services/scheduleService';
import { getTeacherAssignments } from '../../services/teacherAssignmentService';
import { getUsers } from '../../services/userService';
import { getClasses } from '../../services/classService';
import { getSubjects } from '../../services/subjectService';
import { getAcademicYears } from '../../services/academicYearService';
import { FiEye, FiPlus, FiCalendar, FiEdit2, FiTrash2, FiZap, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

const DAYS = [
    { key: 'Monday', label: 'Monday (ថ្ងៃច័ន្ទ)' },
    { key: 'Tuesday', label: 'Tuesday (ថ្ងៃអង្គារ)' },
    { key: 'Wednesday', label: 'Wednesday (ថ្ងៃពុធ)' },
    { key: 'Thursday', label: 'Thursday (ថ្ងៃព្រហស្បតិ៍)' },
    { key: 'Friday', label: 'Friday (ថ្ងៃសុក្រ)' },
    { key: 'Saturday', label: 'Saturday (ថ្ងៃសៅរ៍)' },
    { key: 'All', label: 'All Days (ថ្ងៃទាំងអស់)' },
];

const DEFAULT_SLOTS = [
    { day: 'Monday', session: 'morning', start_time: '07:15', end_time: '08:30', period: 'Period 1 (ព្រឹក)' },
    { day: 'Monday', session: 'morning', start_time: '08:30', end_time: '09:45', period: 'Period 2 (ព្រឹក)' },
    { day: 'Monday', session: 'morning', start_time: '09:45', end_time: '11:00', period: 'Period 3 (ព្រឹក)' },
    { day: 'Monday', session: 'afternoon', start_time: '13:00', end_time: '14:30', period: 'Period 1 (រសៀល)' },
    { day: 'Monday', session: 'afternoon', start_time: '14:30', end_time: '16:00', period: 'Period 2 (រសៀល)' },

    { day: 'Tuesday', session: 'morning', start_time: '07:15', end_time: '08:30', period: 'Period 1 (ព្រឹក)' },
    { day: 'Tuesday', session: 'morning', start_time: '08:30', end_time: '09:45', period: 'Period 2 (ព្រឹក)' },
    { day: 'Tuesday', session: 'morning', start_time: '09:45', end_time: '11:00', period: 'Period 3 (ព្រឹក)' },
    { day: 'Tuesday', session: 'afternoon', start_time: '13:00', end_time: '14:30', period: 'Period 1 (រសៀល)' },
    { day: 'Tuesday', session: 'afternoon', start_time: '14:30', end_time: '16:00', period: 'Period 2 (រសៀល)' },

    { day: 'Wednesday', session: 'morning', start_time: '07:15', end_time: '08:30', period: 'Period 1 (ព្រឹក)' },
    { day: 'Wednesday', session: 'morning', start_time: '08:30', end_time: '09:45', period: 'Period 2 (ព្រឹក)' },
    { day: 'Wednesday', session: 'morning', start_time: '09:45', end_time: '11:00', period: 'Period 3 (ព្រឹក)' },
    { day: 'Wednesday', session: 'afternoon', start_time: '13:00', end_time: '14:30', period: 'Period 1 (រសៀល)' },
    { day: 'Wednesday', session: 'afternoon', start_time: '14:30', end_time: '16:00', period: 'Period 2 (រសៀល)' },

    { day: 'Thursday', session: 'morning', start_time: '07:15', end_time: '08:30', period: 'Period 1 (ព្រឹក)' },
    { day: 'Thursday', session: 'morning', start_time: '08:30', end_time: '09:45', period: 'Period 2 (ព្រឹក)' },
    { day: 'Thursday', session: 'morning', start_time: '09:45', end_time: '11:00', period: 'Period 3 (ព្រឹក)' },
    { day: 'Thursday', session: 'afternoon', start_time: '13:00', end_time: '14:30', period: 'Period 1 (រសៀល)' },
    { day: 'Thursday', session: 'afternoon', start_time: '14:30', end_time: '16:00', period: 'Period 2 (រសៀល)' },

    { day: 'Friday', session: 'morning', start_time: '07:15', end_time: '08:30', period: 'Period 1 (ព្រឹក)' },
    { day: 'Friday', session: 'morning', start_time: '08:30', end_time: '09:45', period: 'Period 2 (ព្រឹក)' },
    { day: 'Friday', session: 'morning', start_time: '09:45', end_time: '11:00', period: 'Period 3 (ព្រឹក)' },
    { day: 'Friday', session: 'afternoon', start_time: '13:00', end_time: '14:30', period: 'Period 1 (រសៀល)' },
    { day: 'Friday', session: 'afternoon', start_time: '14:30', end_time: '16:00', period: 'Period 2 (រសៀល)' },
];

const Schedule = () => {
    const { lang, t } = useLanguage();
    const [schedules, setSchedules] = useState([]);
    
    // Options for dropdowns
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [teacherAssignments, setTeacherAssignments] = useState([]);

    // Active Day & Filter Tabs
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [selectedSchoolLevel, setSelectedSchoolLevel] = useState('all'); // 'all', 'primary' (1-6), 'secondary' (7-9), 'high' (10-12)
    const [selectedClassId, setSelectedClassId] = useState('');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('cards'); // 'cards' (Class Box View) or 'table'

    const format12HourTime = (timeStr) => {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        let hour = parseInt(parts[0], 10);
        const minute = parts[1] || '00';
        if (isNaN(hour)) return timeStr;
        const ampm = hour >= 12 ? (lang === 'kh' ? 'រសៀល' : 'PM') : (lang === 'kh' ? 'ព្រឹក' : 'AM');
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minute} ${ampm}`;
    };

    const getGradeNumber = (gl) => {
        if (!gl) return 0;
        const match = String(gl).match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [isViewTeachersModalOpen, setIsViewTeachersModalOpen] = useState(false);
    const [viewingClassData, setViewingClassData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // Single Form state
    const [formData, setFormData] = useState({
        teacher_id: '',
        secondary_teacher_id: '',
        class_id: '',
        subject_id: '',
        day: 'Monday',
        session: 'morning',
        start_time: '07:15',
        end_time: '08:30',
        room: '',
        academic_year: ''
    });

    // Multi-day selection for single schedule entry modal
    const [selectedFormDays, setSelectedFormDays] = useState(['Monday']);

    // Batch Form state (Add schedule for whole class in ONE step!)
    const [batchClassId, setBatchClassId] = useState('');
    const [batchDayFilter, setBatchDayFilter] = useState('Monday');
    const [batchSlots, setBatchSlots] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [schedRes, tRes, cRes, sRes, ayRes, taRes] = await Promise.all([
                getSchedules(),
                getUsers(),
                getClasses(),
                getSubjects(),
                getAcademicYears(),
                getTeacherAssignments().catch(() => ({ data: { assignments: [] } }))
            ]);

            setSchedules(schedRes.data.schedules || []);
            setTeachers(tRes.data.users?.filter(u => parseInt(u.role_id) === 2) || []);
            setClasses(cRes.data.classes || []);
            setSubjects(sRes.data.subjects || []);
            setAcademicYears(ayRes.data.academic_years || []);
            setTeacherAssignments(taRes.data.assignments || []);
            
        } catch (err) {
            console.error("Failed to fetch schedule data:", err);
            setError("Failed to load data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Open Batch Schedule Creator Modal
    const handleOpenBatchModal = (targetClassId = '') => {
        const clsId = targetClassId || selectedClassId || (classes[0]?.id ? String(classes[0].id) : '');
        setBatchClassId(clsId);

        // Pre-fill existing schedules if any
        const existingClassSchedules = schedules.filter(s => String(s.class_id) === String(clsId));
        
        let initialSlots = [];
        if (existingClassSchedules.length > 0) {
            initialSlots = existingClassSchedules.map(ex => ({
                day: ex.day,
                session: ex.session || (parseInt(ex.start_time?.split(':')[0] || '7') < 12 ? 'morning' : 'afternoon'),
                start_time: ex.start_time,
                end_time: ex.end_time,
                period: `Period Slot`,
                subject_id: ex.subject_id || '',
                teacher_id: ex.teacher_id || '',
                secondary_teacher_id: ex.secondary_teacher_id || '',
                room: ex.room || `Room`
            }));
        } else {
            initialSlots = DEFAULT_SLOTS.map(def => ({ ...def, subject_id: '', teacher_id: '', secondary_teacher_id: '', room: 'Room' }));
        }

        setBatchSlots(initialSlots);
        setIsBatchModalOpen(true);
    };

    // Update batch slot in state
    const handleBatchSlotChange = (index, field, value) => {
        setBatchSlots(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };

            if (field === 'subject_id' && value && batchClassId) {
                const matched = teacherAssignments.find(
                    a => String(a.class_id) === String(batchClassId) && String(a.subject_id) === String(value)
                );
                if (matched) {
                    updated[index]['teacher_id'] = matched.teacher_id;
                }
            }

            return updated;
        });
    };

    // Delete a period time slot row
    const handleRemoveBatchSlot = (index) => {
        setBatchSlots(prev => prev.filter((_, i) => i !== index));
        toast.success("Period time slot removed!");
    };

    // Add a new custom period time slot row for active day
    const handleAddBatchSlot = (day) => {
        const existingCount = batchSlots.filter(s => s.day === day).length;
        const newSlot = {
            day: day,
            session: 'morning',
            start_time: '07:15',
            end_time: '08:30',
            period: `New Period ${existingCount + 1}`,
            subject_id: '',
            teacher_id: '',
            secondary_teacher_id: '',
            room: 'Room'
        };
        setBatchSlots(prev => [...prev, newSlot]);
        toast.success(`New time slot added for ${day}!`);
    };

    // Save batch weekly schedule in ONE click
    const handleSaveBatchSchedule = async () => {
        if (!batchClassId) {
            toast.error("Please select a target class!");
            return;
        }

        setIsSubmitting(true);
        try {
            await batchCreateSchedules({
                class_id: batchClassId,
                academic_year: academicYears[0]?.name || '2026-2027',
                schedules: batchSlots
            });
            toast.success("Class weekly timetable saved successfully in ONE step!");
            setIsBatchModalOpen(false);
            fetchData();

            if (isViewTeachersModalOpen && viewingClassData) {
                handleViewClassTeachers(batchClassId);
            }
        } catch (err) {
            console.error("Failed to save batch schedule:", err);
            const errMsg = err.response?.data?.message || err.message;
            alert(errMsg);
            toast.error(errMsg, { duration: 6000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let updatedForm = { ...formData, [name]: value };

        // Auto detect & pre-fill Teacher if Class & Subject match TeacherAssignments
        if (name === 'class_id' || name === 'subject_id') {
            const targetClassId = name === 'class_id' ? value : formData.class_id;
            const targetSubjId = name === 'subject_id' ? value : formData.subject_id;

            if (targetClassId && targetSubjId && teacherAssignments.length > 0) {
                const matched = teacherAssignments.find(
                    a => String(a.class_id) === String(targetClassId) && String(a.subject_id) === String(targetSubjId)
                );
                if (matched) {
                    updatedForm.teacher_id = matched.teacher_id;
                }
            }
        }

        setFormData(updatedForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateSchedule(editingId, formData);
                toast.success("Schedule entry updated successfully!");
            } else {
                if (selectedFormDays.length === 0) {
                    toast.error("Please select at least 1 day!");
                    setIsSubmitting(false);
                    return;
                }
                // Batch create entries across selected days
                const promises = selectedFormDays.map(day => 
                    createSchedule({
                        ...formData,
                        day: day
                    })
                );
                await Promise.all(promises);
                toast.success(`Schedule created for ${selectedFormDays.length} days successfully!`);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setSelectedFormDays(['Monday']);
            setFormData({ teacher_id: '', secondary_teacher_id: '', class_id: '', subject_id: '', day: selectedDay !== 'All' ? selectedDay : 'Monday', session: 'morning', start_time: '07:15', end_time: '08:30', room: '', academic_year: '' });
            fetchData();

            if (isViewTeachersModalOpen && viewingClassData) {
                handleViewClassTeachers(viewingClassData.schoolClass.id);
            }
        } catch (err) {
            console.error("Failed to save schedule:", err);
            const errMsg = err.response?.data?.message || err.message;
            alert(errMsg);
            toast.error(errMsg, { duration: 6000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (row) => {
        setEditingId(row.id);
        setFormData({
            teacher_id: row.teacher_id,
            secondary_teacher_id: row.secondary_teacher_id || '',
            class_id: row.class_id,
            subject_id: row.subject_id,
            day: row.day,
            session: row.session || (parseInt(row.start_time?.split(':')[0] || '7') < 12 ? 'morning' : (parseInt(row.start_time?.split(':')[0] || '7') < 17 ? 'afternoon' : 'evening')),
            start_time: row.start_time,
            end_time: row.end_time,
            room: row.room || '',
            academic_year: row.academic_year
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this schedule entry?")) {
            try {
                await deleteSchedule(id);
                fetchData();
                toast.success("Schedule deleted successfully!");
                if (isViewTeachersModalOpen && viewingClassData) {
                    handleViewClassTeachers(viewingClassData.schoolClass.id);
                }
            } catch (err) {
                console.error("Failed to delete schedule:", err);
                toast.error("Error deleting schedule: " + (err.response?.data?.message || err.message));
            }
        }
    };

    // Open Class Timetable & Teachers Modal (👁️ View Class Details)
    const handleViewClassTeachers = (classId) => {
        const targetClass = classes.find(c => String(c.id) === String(classId));
        if (!targetClass) {
            toast.error("Please select a class first!");
            return;
        }

        const classSchedules = schedules.filter(s => String(s.class_id) === String(classId));
        
        // Extract all subject teachers for this class
        const teacherMap = new Map();
        classSchedules.forEach(s => {
            if (s.teacher) {
                const key = `${s.teacher.id}_${s.subject_id}`;
                if (!teacherMap.has(key)) {
                    teacherMap.set(key, {
                        teacher: s.teacher,
                        subjectName: s.subject?.name || 'Unknown',
                        sessionLabel: (s.session === 'morning' ? '🌅 ព្រឹក' : s.session === 'afternoon' ? '🌇 ថ្ងៃ/ល្ងាច' : '🌙 យប់'),
                        day: s.day,
                        time: `${s.start_time} - ${s.end_time}`
                    });
                }
            }
            if (s.secondary_teacher) {
                const keySec = `${s.secondary_teacher.id}_${s.subject_id}_sec`;
                if (!teacherMap.has(keySec)) {
                    teacherMap.set(keySec, {
                        teacher: s.secondary_teacher,
                        subjectName: `${s.subject?.name || 'Unknown'} (គ្រូជំនួយ/គ្រូទី២)`,
                        sessionLabel: (s.session === 'morning' ? '🌅 ព្រឹក' : s.session === 'afternoon' ? '🌇 ថ្ងៃ/ល្ងាច' : '🌙 យប់'),
                        day: s.day,
                        time: `${s.start_time} - ${s.end_time}`
                    });
                }
            }
        });

        const teacherList = Array.from(teacherMap.values());

        setViewingClassData({
            schoolClass: targetClass,
            schedules: classSchedules,
            teachers: teacherList
        });

        setIsViewTeachersModalOpen(true);
    };

    const columns = [
        { header: 'ID', accessor: 'id' },
        { 
            header: 'Day (ថ្ងៃសិក្សា)', 
            render: (row) => (
                <span style={{ fontWeight: '700', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {row.day}
                </span>
            ) 
        },
        { 
            header: 'Session (វេន)', 
            render: (row) => {
                const sess = row.session || (parseInt(row.start_time?.split(':')[0] || '7') < 12 ? 'morning' : (parseInt(row.start_time?.split(':')[0] || '7') < 17 ? 'afternoon' : 'evening'));
                const isMorning = sess === 'morning';
                const isAfternoon = sess === 'afternoon';
                return (
                    <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        backgroundColor: isMorning ? '#dbeafe' : isAfternoon ? '#ffedd5' : '#f3e8ff',
                        color: isMorning ? '#1e40af' : isAfternoon ? '#9a3412' : '#6b21a8'
                    }}>
                        {isMorning ? '🌅 ព្រឹក' : isAfternoon ? '🌇 ថ្ងៃ' : '🌙 យប់'}
                    </span>
                );
            }
        },
        { header: 'Time (ម៉ោងសិក្សា)', render: (row) => <strong style={{ color: '#0f172a' }}>{format12HourTime(row.start_time)} - {format12HourTime(row.end_time)}</strong> },
        { 
            header: 'Class Name (ថ្នាក់រៀន)', 
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: '#4338ca', fontSize: '0.95rem' }}>{row.school_class?.name || 'Unknown'}</strong>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleViewClassTeachers(row.class_id); }}
                        title="View full schedule & teachers for this class (មើលកាលវិភាគ & គ្រូបង្រៀន)"
                        style={{
                            border: 'none', background: '#e0e7ff', color: '#4338ca', cursor: 'pointer',
                            borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <FiEye size={14} />
                    </button>
                </div>
            )
        },
        { header: 'Subject (មុខវិជ្ជា)', render: (row) => <strong style={{ color: '#0369a1' }}>{row.subject?.name || 'Unknown'}</strong> },
        { 
            header: 'Subject Teacher (គ្រូបង្រៀនមុខវិជ្ជានេះ)', 
            render: (row) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ color: '#0f172a', fontWeight: '600', fontSize: '0.88rem' }}>
                        👨‍🏫 {row.teacher?.name || 'Unknown'}
                    </span>
                    {row.secondary_teacher && (
                        <span style={{ color: '#4338ca', fontWeight: '600', fontSize: '0.78rem' }}>
                            👩‍🏫 គ្រូទី២: {row.secondary_teacher.name}
                        </span>
                    )}
                </div>
            ) 
        },
        { header: 'Room (បន្ទប់)', accessor: 'room' },
        { 
            header: 'Actions', 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}>Edit</Button>
                    <Button size="small" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>Delete</Button>
                </div>
            )
        }
    ];

    // Filter schedules strictly by DAY & School Level!
    const filteredSchedules = schedules.filter(sch => {
        const matchesDay = selectedDay === 'All' || (sch.day || '').toLowerCase() === selectedDay.toLowerCase();
        const matchesClass = !selectedClassId || String(sch.class_id) === String(selectedClassId);

        const gradeNum = getGradeNumber(sch.school_class?.grade_level);
        let matchesLevel = true;
        if (selectedSchoolLevel === 'primary') matchesLevel = (gradeNum >= 1 && gradeNum <= 6);
        else if (selectedSchoolLevel === 'secondary') matchesLevel = (gradeNum >= 7 && gradeNum <= 9);
        else if (selectedSchoolLevel === 'high') matchesLevel = (gradeNum >= 10 && gradeNum <= 12);
        
        const className = sch.school_class?.name || '';
        const subjectName = sch.subject?.name || '';
        const teacherName = sch.teacher?.name || '';

        const matchesSearch = !search || 
            className.toLowerCase().includes(search.toLowerCase()) ||
            subjectName.toLowerCase().includes(search.toLowerCase()) ||
            teacherName.toLowerCase().includes(search.toLowerCase());

        return matchesDay && matchesClass && matchesLevel && matchesSearch;
    }).sort((a, b) => {
        return (a.start_time || '').localeCompare(b.start_time || '');
    });

    const batchClassAssignments = teacherAssignments.filter(a => String(a.class_id) === String(batchClassId));
    const batchHasAssignments = batchClassAssignments.length > 0;
    const batchClassSubjects = batchHasAssignments 
        ? subjects.filter(s => batchClassAssignments.some(a => String(a.subject_id) === String(s.id)))
        : subjects;
    const batchClassTeachers = batchHasAssignments 
        ? teachers.filter(t => batchClassAssignments.some(a => String(a.teacher_id) === String(t.id)))
        : teachers;

    const singleClassAssignments = teacherAssignments.filter(a => String(a.class_id) === String(formData.class_id));
    const singleHasAssignments = singleClassAssignments.length > 0;
    const singleClassSubjects = (formData.class_id && singleHasAssignments) 
        ? subjects.filter(s => singleClassAssignments.some(a => String(a.subject_id) === String(s.id)))
        : subjects;
    const singleClassTeachers = (formData.class_id && singleHasAssignments) 
        ? teachers.filter(t => singleClassAssignments.some(a => String(a.teacher_id) === String(t.id)))
        : teachers;

    return (
        <div>
            {/* Header section */}
            <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">Manage Timetables (កាលវិភាគសិក្សា តាមថ្ងៃ) 🗓️</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        View daily schedule slots organized strictly by Day or create class timetables in one step.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {/* BATCH CREATE BUTTON: "add schedule ម្តងចប់" */}
                    <Button 
                        onClick={() => handleOpenBatchModal()}
                        style={{ backgroundColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                        <FiZap size={16} /> ⚡ បង្កើតកាលវិភាគថ្នាក់រៀនតែម្តងរៀបរយ
                    </Button>

                    <Button onClick={() => { 
                        setEditingId(null); 
                        setFormData({ teacher_id: '', secondary_teacher_id: '', class_id: selectedClassId || '', subject_id: '', day: selectedDay !== 'All' ? selectedDay : 'Monday', session: 'morning', start_time: '07:15', end_time: '08:30', room: '', academic_year: academicYears[0]?.name || '' }); 
                        setIsModalOpen(true); 
                    }}>
                        <FiPlus size={16} /> + Add Single Entry
                    </Button>
                </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* DAY FILTER TABS (រៀបតាមថ្ងៃ: Monday, Tuesday, Wednesday, Thursday, Friday) */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                backgroundColor: '#ffffff',
                padding: '0.6rem',
                borderRadius: '14px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                marginBottom: '1.5rem',
                overflowX: 'auto'
            }}>
                {DAYS.map(d => (
                    <button
                        key={d.key}
                        onClick={() => setSelectedDay(d.key)}
                        style={{
                            padding: '0.6rem 1.1rem',
                            borderRadius: '10px',
                            border: 'none',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            backgroundColor: selectedDay === d.key ? '#4338ca' : 'transparent',
                            color: selectedDay === d.key ? '#ffffff' : '#475569',
                            boxShadow: selectedDay === d.key ? '0 4px 6px -1px rgba(67, 56, 202, 0.3)' : 'none'
                        }}
                    >
                        <FiCalendar size={15} /> {d.label}
                    </button>
                ))}
            </div>

            {/* Class & Search Filter Bar + View Mode Switcher */}
            <Card style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    
                    {/* View Switcher Controls */}
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <button
                            onClick={() => setViewMode('cards')}
                            style={{
                                border: 'none',
                                background: viewMode === 'cards' ? '#ffffff' : 'transparent',
                                color: viewMode === 'cards' ? '#4338ca' : '#64748b',
                                padding: '0.45rem 0.85rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            🎴 Class Schedule Box View (ប្រអប់កាលវិភាគថ្នាក់)
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            style={{
                                border: 'none',
                                background: viewMode === 'table' ? '#ffffff' : 'transparent',
                                color: viewMode === 'table' ? '#4338ca' : '#64748b',
                                padding: '0.45rem 0.85rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            📋 Table View (តារាងលម្អិត)
                        </button>
                    </div>

                    {/* School Level Filter Select Dropdown Option */}
                    <div style={{ width: '230px' }}>
                        <select
                            value={selectedSchoolLevel}
                            onChange={(e) => setSelectedSchoolLevel(e.target.value)}
                            style={{ 
                                width: '100%', height: '42px', padding: '0.6rem 0.8rem', 
                                border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#1e40af',
                                backgroundColor: '#eff6ff', fontWeight: '700'
                            }}
                        >
                            <option value="all">🎓 គ្រប់កម្រិតសិក្សា (All Levels)</option>
                            <option value="primary">🏫 បឋមសិក្សា (Grade 1 - 6)</option>
                            <option value="secondary">🏫 អនុវិទ្យាល័យ (Grade 7 - 9)</option>
                            <option value="high">🏫 វិទ្យាល័យ (Grade 10 - 12)</option>
                        </select>
                    </div>

                    <div style={{ width: '220px' }}>
                        <select 
                            value={selectedClassId} 
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            style={{ 
                                width: '100%', height: '42px', padding: '0.6rem 0.8rem', 
                                border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a',
                                backgroundColor: '#ffffff', fontWeight: '600'
                            }}
                        >
                            <option value="">🏫 All Classes (ថ្នាក់ទាំងអស់)</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name} (Grade {c.grade_level})</option>
                            ))}
                        </select>
                    </div>

                    {selectedClassId && (
                        <Button 
                            variant="secondary"
                            onClick={() => handleViewClassTeachers(selectedClassId)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#e0e7ff', color: '#4338ca' }}
                        >
                            <FiEye size={16} /> 👁️ Teachers of Class
                        </Button>
                    )}

                    <div style={{ width: '220px', marginLeft: 'auto' }}>
                        <Input 
                            placeholder="Search class, subject, teacher..." 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ margin: 0 }}
                        />
                    </div>
                </div>
            </Card>

            {/* MAIN CONTENT AREA */}
            {loading ? (
                <p style={{ marginTop: '1.25rem' }}>Loading timetables...</p>
            ) : viewMode === 'cards' ? (
                /* CLASS SCHEDULE BOX / CARD GRID VIEW (1 BOX PER CLASS) */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                    {classes.map(cls => {
                        const gradeNum = getGradeNumber(cls.grade_level);
                        if (selectedSchoolLevel === 'primary' && (gradeNum < 1 || gradeNum > 6)) return null;
                        if (selectedSchoolLevel === 'secondary' && (gradeNum < 7 || gradeNum > 9)) return null;
                        if (selectedSchoolLevel === 'high' && (gradeNum < 10 || gradeNum > 12)) return null;

                        const clsSchedules = filteredSchedules.filter(s => String(s.class_id) === String(cls.id));
                        if (selectedClassId && String(cls.id) !== String(selectedClassId)) return null;

                        const stream = cls.stream || 'general';
                        const homeroomTeacher = cls.teacher_assignments?.map(a => a.teacher?.name).filter(Boolean).join(', ');

                        return (
                            <div key={cls.id} style={{
                                background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)', padding: '1.25rem',
                                display: 'flex', flexDirection: 'column', gap: '1rem'
                            }}>
                                {/* Class Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: '800' }}>
                                            🏫 ថ្នាក់ {cls.name}
                                        </h3>
                                        <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>
                                            Grade {cls.grade_level} | 📅 {selectedDay === 'All' ? 'All Days' : selectedDay}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {stream === 'science' ? (
                                            <span style={{ fontWeight: '700', color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '0.25rem 0.6rem', borderRadius: '10px', fontSize: '0.78rem' }}>
                                                🧪 វិទ្យាសាស្ត្រ
                                            </span>
                                        ) : stream === 'social_science' ? (
                                            <span style={{ fontWeight: '700', color: '#c2410c', backgroundColor: '#ffedd5', padding: '0.25rem 0.6rem', borderRadius: '10px', fontSize: '0.78rem' }}>
                                                📜 វិទ្យាសាស្ត្រសង្គម
                                            </span>
                                        ) : (
                                            <span style={{ fontWeight: '600', color: '#475569', backgroundColor: '#f1f5f9', padding: '0.25rem 0.6rem', borderRadius: '10px', fontSize: '0.78rem' }}>
                                                📚 ទូទៅ
                                            </span>
                                        )}
                                        {homeroomTeacher && (
                                            <div style={{ fontSize: '0.78rem', color: '#4338ca', fontWeight: '700', marginTop: '0.3rem' }}>
                                                👑 {homeroomTeacher}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Timetable Slots List */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    {clsSchedules.length > 0 ? (
                                        clsSchedules.map(slot => (
                                            <div key={slot.id} style={{
                                                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
                                                padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                                        <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                                                            ⏰ {format12HourTime(slot.start_time)} - {format12HourTime(slot.end_time)}
                                                        </span>
                                                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                                                            📘 {slot.subject?.name || 'Subject'}
                                                        </strong>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '0.75rem' }}>
                                                        <span>👨‍🏫 {slot.teacher?.name || 'N/A'}</span>
                                                        {slot.room && <span>📍 បន្ទប់ {slot.room}</span>}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                    <button 
                                                        onClick={() => handleEditClick(slot)}
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#4f46e5', fontSize: '0.85rem' }}
                                                        title="Edit Slot"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(slot.id)}
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.85rem' }}
                                                        title="Delete Slot"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                            🔕 គ្មានម៉ោងរៀនឡើយសម្រាប់ថ្ងៃ {selectedDay}
                                        </div>
                                    )}
                                </div>

                                {/* Box Footer Action */}
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                                        {clsSchedules.length} Slots Recorded
                                    </span>
                                    <button
                                        onClick={() => {
                                            setEditingId(null);
                                            setFormData({ teacher_id: '', secondary_teacher_id: '', class_id: cls.id, subject_id: '', day: selectedDay !== 'All' ? selectedDay : 'Monday', session: 'morning', start_time: '07:15', end_time: '08:30', room: '', academic_year: academicYears[0]?.name || '2026-2027' });
                                            setIsModalOpen(true);
                                        }}
                                        style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        + បន្ថែមម៉ោងរៀន
                                    </button>
                                </div>

                            </div>
                        );
                    })}
                </div>
            ) : (
                /* TABLE VIEW */
                <Card>
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
                            📅 Timetable Schedule for: <span style={{ color: '#4338ca' }}>{selectedDay === 'All' ? 'All Days (ថ្ងៃទាំងអស់)' : selectedDay}</span>
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                            Total Slots: {filteredSchedules.length}
                        </span>
                    </div>

                    {filteredSchedules.length === 0 ? (
                        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                            🔕 No schedule entries recorded for <strong>{selectedDay}</strong>.
                        </div>
                    ) : (
                        <Table columns={columns} data={filteredSchedules} />
                    )}
                </Card>
            )}

            {/* BATCH SCHEDULE MODAL: "add schedule ម្តងចប់" */}
            <Modal
                isOpen={isBatchModalOpen}
                onClose={() => setIsBatchModalOpen(false)}
                title="⚡ បង្កើតកាលវិភាគថ្នាក់រៀនតែម្តងរៀបរយ (Batch Weekly Timetable Setup)"
                maxWidth="980px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            បំពេញមុខវិជ្ជា និង គ្រូបង្រៀន រួចចុច Save តែម្តង!
                        </span>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Button variant="secondary" onClick={() => setIsBatchModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                            <Button onClick={handleSaveBatchSchedule} disabled={isSubmitting} style={{ backgroundColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <FiSave size={16} /> {isSubmitting ? 'Saving...' : '💾 រក្សាទុកកាលវិភាគទាំងអស់'}
                            </Button>
                        </div>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Class Selector & Actions Bar */}
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '220px' }}>
                            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>
                                🏫 ជ្រើសរើសថ្នាក់រៀន (Target Class) *
                            </label>
                            <select
                                value={batchClassId}
                                onChange={(e) => handleOpenBatchModal(e.target.value)}
                                style={{ width: '100%', height: '42px', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '0.95rem', color: '#4338ca' }}
                            >
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} (Grade {c.grade_level})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>
                                📅 Filter Day (មើលតាមថ្ងៃ)
                            </label>
                            <select
                                value={batchDayFilter}
                                onChange={(e) => setBatchDayFilter(e.target.value)}
                                style={{ height: '42px', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '600' }}
                            >
                                <option value="Monday">Monday (ថ្ងៃច័ន្ទ)</option>
                                <option value="Tuesday">Tuesday (ថ្ងៃអង្គារ)</option>
                                <option value="Wednesday">Wednesday (ថ្ងៃពុធ)</option>
                                <option value="Thursday">Thursday (ថ្ងៃព្រហស្បតិ៍)</option>
                                <option value="Friday">Friday (ថ្ងៃសុក្រ)</option>
                            </select>
                        </div>

                        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
                            <Button 
                                onClick={() => handleAddBatchSlot(batchDayFilter)}
                                style={{ backgroundColor: '#4338ca', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                                <FiPlus size={15} /> ➕ បន្ថែមម៉ោងសិក្សាថ្មី ({batchDayFilter})
                            </Button>
                        </div>
                    </div>

                    {/* Assigned Subject Teachers Banner & Warning */}
                    {batchClassId && (
                        batchHasAssignments ? (
                            <div style={{ background: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#15803d', display: 'block', marginBottom: '0.35rem' }}>
                                    ⭐ {t("បញ្ជីគ្រូបង្រៀនមុខវិជ្ជាដែលបានចាត់តាំងក្នុងថ្នាក់នេះ (Assigned Subject Teachers):", "Assigned Subject Teachers for this Class:")}
                                </span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {batchClassAssignments.map(a => (
                                        <span key={a.id} style={{ padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', background: '#ffffff', color: '#15803d', border: '1px solid #bbf7d0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                                            📘 {a.subject?.name} ➔ 👨‍🏫 {a.teacher?.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: '#eff6ff', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                ℹ️ {t("ថ្នាក់នេះមិនទាន់មានគ្រូចាត់តាំងជាមុនទេ — លោកអ្នកអាចជ្រើសរើសមុខវិជ្ជា និង គ្រូបង្រៀនខាងក្រោមបានដោយសេរី!", "This class has no pre-assigned teachers yet — you can select any subject and teacher below!")}
                            </div>
                        )
                    )}

                    {/* Batch Schedule Inputs Table with Editable & Deleteable Slots */}
                    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>Day & Time (ម៉ោងសិក្សា)</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Subject (មុខវិជ្ជា)</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Subject Teacher (គ្រូបង្រៀន)</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlignment: 'center', width: '80px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batchSlots.map((slot, idx) => {
                                    if (slot.day !== batchDayFilter) return null;
                                    return (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <input 
                                                        type="text"
                                                        value={slot.period}
                                                        onChange={(e) => handleBatchSlotChange(idx, 'period', e.target.value)}
                                                        placeholder="Period Name"
                                                        style={{ border: 'none', background: 'transparent', fontWeight: '700', color: '#0369a1', fontSize: '0.85rem', padding: 0 }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                                        <input 
                                                            type="time" 
                                                            value={slot.start_time} 
                                                            onChange={(e) => handleBatchSlotChange(idx, 'start_time', e.target.value)}
                                                            style={{ height: '34px', padding: '0.2rem 0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}
                                                        />
                                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>➔</span>
                                                        <input 
                                                            type="time" 
                                                            value={slot.end_time} 
                                                            onChange={(e) => handleBatchSlotChange(idx, 'end_time', e.target.value)}
                                                            style={{ height: '34px', padding: '0.2rem 0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <select
                                                    value={slot.subject_id}
                                                    onChange={(e) => handleBatchSlotChange(idx, 'subject_id', e.target.value)}
                                                    style={{ width: '100%', height: '38px', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
                                                >
                                                    <option value="">-- Choose Subject --</option>
                                                    {batchClassSubjects.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <select
                                                    value={slot.teacher_id}
                                                    onChange={(e) => handleBatchSlotChange(idx, 'teacher_id', e.target.value)}
                                                    style={{ width: '100%', height: '38px', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
                                                >
                                                    <option value="">-- Choose Teacher --</option>
                                                    {batchClassTeachers.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveBatchSlot(idx)}
                                                    title="Delete this time slot (លុបម៉ោងសិក្សានេះ)"
                                                    style={{
                                                        border: 'none',
                                                        backgroundColor: '#fee2e2',
                                                        color: '#ef4444',
                                                        borderRadius: '8px',
                                                        width: '34px',
                                                        height: '34px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        margin: '0 auto'
                                                    }}
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>

            {/* Modal: View Teachers & Timetable for a Specific Class (👁️ Inside Eye Icon Modal) */}
            {viewingClassData && (
                <Modal
                    isOpen={isViewTeachersModalOpen}
                    onClose={() => setIsViewTeachersModalOpen(false)}
                    title={`👁️ Timetable & Subject Teachers — 👑 ${viewingClassData.schoolClass.name}`}
                    maxWidth="900px"
                    footer={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <Button
                                onClick={() => handleOpenBatchModal(viewingClassData.schoolClass.id)}
                                style={{ backgroundColor: '#16a34a' }}
                            >
                                ⚡ Edit Full Timetable for {viewingClassData.schoolClass.name}
                            </Button>
                            <Button variant="secondary" onClick={() => setIsViewTeachersModalOpen(false)}>Close</Button>
                        </div>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Class Header Banner */}
                        <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>👑 {viewingClassData.schoolClass.name}</h3>
                                <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>Grade: <strong>{viewingClassData.schoolClass.grade_level}</strong> | Year: <strong>{viewingClassData.schoolClass.academic_year}</strong></p>
                            </div>
                        </div>

                        {/* List of Teachers Teaching each Subject in this Class */}
                        <div>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                👨‍🏫 Assigned Subject Teachers (បញ្ជីគ្រូបង្រៀនមុខវិជ្ជាសរុបក្នុងថ្នាក់)
                            </h4>

                            {viewingClassData.teachers.length === 0 ? (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No subject teachers assigned to this class yet.</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                                    {viewingClassData.teachers.map((item, idx) => (
                                        <div key={idx} style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                {item.teacher?.name?.charAt(0) || 'T'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#0f172a' }}>{item.teacher?.name}</div>
                                                <div style={{ fontSize: '0.82rem', color: '#4338ca', fontWeight: '700' }}>📚 មុខវិជ្ជា: {item.subjectName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.sessionLabel} | {item.day} ({item.time})</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Interactive Weekly Timetable Calendar for this Class */}
                        <div>
                            <h4 style={{ margin: '1rem 0 0.75rem 0', fontSize: '0.95rem', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                📅 Weekly Timetable (កាលវិភាគថ្នាក់រៀនប្រចាំសប្ដាហ៍)
                            </h4>
                            <WeeklyCalendar schedule={viewingClassData.schedules} type="student" />
                        </div>
                    </div>
                </Modal>
            )}

            {/* Single Add / Edit Schedule Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Schedule Entry" : "Create Single Schedule Entry"}
                maxWidth="650px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : editingId ? 'Update Entry' : 'Create Entry'}
                        </Button>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                Target Class (ថ្នាក់រៀន) *
                            </label>
                            <select 
                                name="class_id" 
                                value={formData.class_id} 
                                onChange={handleInputChange} 
                                required
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                <option value="">-- Choose Class --</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} (Grade {c.grade_level})</option>
                                ))}
                            </select>
                        </div>

                        {!editingId ? (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                        {t("ជ្រើសរើសថ្ងៃរៀន (អាចជ្រើសរើសច្រើនថ្ងៃបាន)", "Select Teaching Days (Multiple Selection Allowed)")} <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFormDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])}
                                            style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            ✓ {t("ច័ន្ទ - សុក្រ", "Mon - Fri")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFormDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])}
                                            style={{ background: '#dcfce7', color: '#15803d', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            ✓ {t("គ្រប់ថ្ងៃ", "All Days")}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem', background: '#f8fafc' }}>
                                    {[
                                        { key: 'Monday', label: 'ថ្ងៃច័ន្ទ (Mon)' },
                                        { key: 'Tuesday', label: 'ថ្ងៃអង្គារ (Tue)' },
                                        { key: 'Wednesday', label: 'ថ្ងៃពុធ (Wed)' },
                                        { key: 'Thursday', label: 'ថ្ងៃព្រហស្បតិ៍ (Thu)' },
                                        { key: 'Friday', label: 'ថ្ងៃសុក្រ (Fri)' },
                                        { key: 'Saturday', label: 'ថ្ងៃសៅរ៍ (Sat)' }
                                    ].map(d => {
                                        const isChecked = selectedFormDays.includes(d.key);
                                        return (
                                            <label 
                                                key={d.key} 
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.6rem', borderRadius: '6px',
                                                    border: isChecked ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                                                    background: isChecked ? '#e0e7ff' : '#ffffff',
                                                    color: isChecked ? '#3730a3' : '#334155',
                                                    fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer'
                                                }}
                                            >
                                                <input 
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedFormDays(prev => [...prev, d.key]);
                                                        } else {
                                                            setSelectedFormDays(prev => prev.filter(day => day !== d.key));
                                                        }
                                                    }}
                                                    style={{ accentColor: '#4f46e5', width: '15px', height: '15px', cursor: 'pointer' }}
                                                />
                                                📅 {d.label}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                    Day of Week *
                                </label>
                                <select 
                                    name="day" 
                                    value={formData.day} 
                                    onChange={handleInputChange} 
                                    required
                                    style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                                >
                                    <option value="Monday">Monday (ថ្ងៃច័ន្ទ)</option>
                                    <option value="Tuesday">Tuesday (ថ្ងៃអង្គារ)</option>
                                    <option value="Wednesday">Wednesday (ថ្ងៃពុធ)</option>
                                    <option value="Thursday">Thursday (ថ្ងៃព្រហស្បតិ៍)</option>
                                    <option value="Friday">Friday (ថ្ងៃសុក្រ)</option>
                                    <option value="Saturday">Saturday (ថ្ងៃសៅរ៍)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Quick Pick Assigned Subject-Teacher Pairs Box & Warning */}
                    {formData.class_id && (
                        singleHasAssignments ? (
                            <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#15803d', display: 'block', marginBottom: '0.4rem' }}>
                                    ⭐ {t("មុខវិជ្ជា & គ្រូបង្រៀនដែលបានចាត់តាំងក្នុងថ្នាក់នេះ (ចុចជ្រើសរើស ១-Click):", "Assigned Subject Teachers for this Class (1-Click Pick):")}
                                </span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {singleClassAssignments.map(a => (
                                        <button
                                            key={a.id}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, subject_id: a.subject_id, teacher_id: a.teacher_id }))}
                                            style={{
                                                padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700',
                                                border: (String(formData.subject_id) === String(a.subject_id) && String(formData.teacher_id) === String(a.teacher_id)) ? '2px solid #16a34a' : '1px solid #cbd5e1',
                                                background: (String(formData.subject_id) === String(a.subject_id) && String(formData.teacher_id) === String(a.teacher_id)) ? '#dcfce7' : '#ffffff',
                                                color: (String(formData.subject_id) === String(a.subject_id) && String(formData.teacher_id) === String(a.teacher_id)) ? '#15803d' : '#334155',
                                                cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            📘 {a.subject?.name} — 👨‍🏫 {a.teacher?.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: '#eff6ff', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: '600', fontSize: '0.85rem' }}>
                                ℹ️ {t("ថ្នាក់នេះមិនទាន់មានគ្រូចាត់តាំងជាមុនទេ — លោកអ្នកអាចជ្រើសរើសមុខវិជ្ជា និង គ្រូបង្រៀនខាងក្រោមបានដោយសេរី!", "This class has no pre-assigned teachers yet — you can select any subject and teacher below!")}
                            </div>
                        )
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                Subject (មុខវិជ្ជា) *
                            </label>
                            <select 
                                name="subject_id" 
                                value={formData.subject_id} 
                                onChange={handleInputChange} 
                                required
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a', backgroundColor: '#ffffff' }}
                            >
                                <option value="">-- Choose Subject --</option>
                                {singleClassSubjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                Subject Teacher (គ្រូបង្រៀនមុខវិជ្ជានេះ) *
                            </label>
                            <select 
                                name="teacher_id" 
                                value={formData.teacher_id} 
                                onChange={handleInputChange} 
                                required
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a', backgroundColor: '#ffffff' }}
                            >
                                <option value="">-- Choose Subject Teacher --</option>
                                {singleClassTeachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                Secondary Teacher (គ្រូទី២ / ជំនួយការ) <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>(Optional)</span>
                            </label>
                            <select 
                                name="secondary_teacher_id" 
                                value={formData.secondary_teacher_id} 
                                onChange={handleInputChange} 
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                <option value="">-- None / គ្មាន --</option>
                                {teachers.filter(t => String(t.id) !== String(formData.teacher_id)).map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                Session (វេនសិក្សា) *
                            </label>
                            <select 
                                name="session" 
                                value={formData.session} 
                                onChange={handleInputChange} 
                                required
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                <option value="morning">🌅 Morning Session (វេនពេលព្រឹក)</option>
                                <option value="afternoon">🌇 Afternoon / Day Session (វេនពេលថ្ងៃ/ពេលល្ងាច)</option>
                                <option value="evening">🌙 Evening Session (វេនពេលយប់)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input 
                            label="Start Time" 
                            type="time"
                            name="start_time"
                            value={formData.start_time}
                            onChange={handleInputChange}
                            required
                        />
                        <Input 
                            label="End Time" 
                            type="time"
                            name="end_time"
                            value={formData.end_time}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input 
                            label="Room (បន្ទប់រៀន)" 
                            name="room"
                            value={formData.room}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g. Room 101, Lab 2"
                        />

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                Academic Year *
                            </label>
                            <select 
                                name="academic_year" 
                                value={formData.academic_year} 
                                onChange={handleInputChange} 
                                required
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                <option value="">-- Choose Academic Year --</option>
                                {academicYears.length > 0 ? (
                                    academicYears.map(ay => (
                                        <option key={ay.id} value={ay.name}>{ay.name}</option>
                                    ))
                                ) : (
                                    <option value="2026-2027">2026-2027</option>
                                )}
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Schedule;
