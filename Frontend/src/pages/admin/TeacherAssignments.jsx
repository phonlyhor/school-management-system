import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

import { useLanguage } from '../../context/LanguageContext';
import { getTeacherAssignments, createTeacherAssignment, updateTeacherAssignment, deleteTeacherAssignment } from '../../services/teacherAssignmentService';
import { getHomerooms, createHomeroom, updateHomeroom, deleteHomeroom } from '../../services/homeroomService';
import { getUsers } from '../../services/userService';
import { getClasses } from '../../services/classService';
import { getSubjects } from '../../services/subjectService';
import { getAcademicYears } from '../../services/academicYearService';
import toast from 'react-hot-toast';

const TeacherAssignments = () => {
    const { lang, t } = useLanguage();

    // 0 = Subject Assignments, 1 = Homeroom Assignments
    const [activeTab, setActiveTab] = useState(0);

    // Subject Assignments Data
    const [assignments, setAssignments] = useState([]);
    // Homeroom Assignments Data
    const [homerooms, setHomerooms] = useState([]);
    
    // Shared dropdown data
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);

    // Filter states
    const [selectedClassId, setSelectedClassId] = useState('');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [isHomeroomModalOpen, setIsHomeroomModalOpen] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // Form states
    const [subjectForm, setSubjectForm] = useState({
        teacher_id: '', class_id: '', subject_id: '', academic_year: ''
    });
    
    const [homeroomForm, setHomeroomForm] = useState({
        teacher_id: '', class_id: '', academic_year: ''
    });

    // Multi-class selection state for batch subject assignment
    const [selectedClassIds, setSelectedClassIds] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const getImageUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
        return `${baseUrl}/${photo.replace(/^\//, '')}`;
    };

    const fetchAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [assignRes, homeRes, userRes, classRes, subjRes, ayRes] = await Promise.all([
                getTeacherAssignments(),
                getHomerooms(),
                getUsers(),
                getClasses(),
                getSubjects(),
                getAcademicYears().catch(() => ({ data: { academic_years: [] } }))
            ]);

            setAssignments(assignRes.data.assignments || []);
            setHomerooms(homeRes.data.homerooms || []);

            const allUsers = userRes.data.users || [];
            setTeachers(allUsers.filter(u => parseInt(u.role_id) === 2));

            setClasses(classRes.data.classes || []);
            setSubjects(subjRes.data.subjects || []);

            const ays = ayRes.data.academic_years || ayRes.data || [];
            setAcademicYears(Array.isArray(ays) ? ays : []);

        } catch (err) {
            console.error("Failed to fetch assignment data:", err);
            setError(t("មានបញ្ហាក្នុងការទាញយកទិន្នន័យចាត់តាំងគ្រូបង្រៀន", "Failed to load assignment records."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Subject Assignment Submit (Batch Multi-Class Supported)
    const handleSubjectSubmit = async (e) => {
        e.preventDefault();

        if (!editingId && selectedClassIds.length === 0) {
            toast.error(t("សូមជ្រើសរើសយ៉ាងហោចណាស់ថ្នាក់រៀន ១!", "Please select at least 1 class!"));
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateTeacherAssignment(editingId, {
                    ...subjectForm,
                    class_id: selectedClassIds[0] || subjectForm.class_id
                });
                toast.success(t("បានកែប្រែការចាត់តាំងមុខវិជ្ជាដោយជោគជ័យ!", "Subject assignment updated successfully!"));
            } else {
                // Batch create for all selected classes
                const promises = selectedClassIds.map(classId => 
                    createTeacherAssignment({
                        teacher_id: subjectForm.teacher_id,
                        subject_id: subjectForm.subject_id,
                        academic_year: subjectForm.academic_year,
                        class_id: classId
                    }).catch(err => console.error(`Failed to assign class ${classId}`, err))
                );
                await Promise.all(promises);
                toast.success(t(`បានចាត់តាំងគ្រូបង្រៀនចំនួន ${selectedClassIds.length} ថ្នាក់ដោយជោគជ័យ!`, `Successfully assigned teacher to ${selectedClassIds.length} classes!`));
            }
            setIsSubjectModalOpen(false);
            setEditingId(null);
            setSelectedClassIds([]);
            setSubjectForm({ teacher_id: '', class_id: '', subject_id: '', academic_year: '' });
            fetchAllData();
        } catch (err) {
            toast.error(t("មានបញ្ហាក្នុងការចាត់តាំងមុខវិជ្ជា៖ ", "Failed to save subject assignment: ") + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Homeroom Assignment Submit
    const handleHomeroomSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateHomeroom(editingId, homeroomForm);
                toast.success(t("បានកែប្រែគ្រូបន្ទុកថ្នាក់ដោយជោគជ័យ!", "Homeroom assignment updated successfully!"));
            } else {
                await createHomeroom(homeroomForm);
                toast.success(t("បានចាត់តាំងគ្រូបន្ទុកថ្នាក់ដោយជោគជ័យ!", "Homeroom teacher assigned successfully!"));
            }
            setIsHomeroomModalOpen(false);
            setEditingId(null);
            setHomeroomForm({ teacher_id: '', class_id: '', academic_year: '' });
            fetchAllData();
        } catch (err) {
            toast.error(t("មានបញ្ហាក្នុងការចាត់តាំងគ្រូបន្ទុកថ្នាក់៖ ", "Failed to save homeroom assignment: ") + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handlers for subject assignments
    const handleEditSubject = (row) => {
        setEditingId(row.id);
        setSelectedClassIds([row.class_id]);
        setSubjectForm({
            teacher_id: row.teacher_id,
            class_id: row.class_id,
            subject_id: row.subject_id,
            academic_year: row.academic_year || ''
        });
        setIsSubjectModalOpen(true);
    };

    const handleDeleteSubject = async (id) => {
        if (window.confirm(t("តើអ្នកពិតជាចង់លុបការចាត់តាំងមុខវិជ្ជានេះមែនទេ?", "Are you sure you want to delete this subject assignment?"))) {
            try {
                await deleteTeacherAssignment(id);
                toast.success(t("បានលុបការចាត់តាំងមុខវិជ្ជាដោយជោគជ័យ!", "Subject assignment deleted successfully!"));
                fetchAllData();
            } catch (err) {
                toast.error(t("មានបញ្ហាក្នុងការលុប", "Failed to delete assignment"));
            }
        }
    };

    // Handlers for homeroom assignments
    const handleEditHomeroom = (row) => {
        setEditingId(row.id);
        setHomeroomForm({
            teacher_id: row.teacher_id,
            class_id: row.class_id,
            academic_year: row.academic_year || ''
        });
        setIsHomeroomModalOpen(true);
    };

    const handleDeleteHomeroom = async (id) => {
        if (window.confirm(t("តើអ្នកពិតជាចង់លុបគ្រូបន្ទុកថ្នាក់នេះមែនទេ?", "Are you sure you want to delete this homeroom assignment?"))) {
            try {
                await deleteHomeroom(id);
                toast.success(t("បានលុបគ្រូបន្ទុកថ្នាក់ដោយជោគជ័យ!", "Homeroom assignment deleted successfully!"));
                fetchAllData();
            } catch (err) {
                toast.error(t("មានបញ្ហាក្នុងការលុប", "Failed to delete homeroom assignment"));
            }
        }
    };

    // Columns definition for Subject Assignments
    const subjectColumns = [
        { header: 'ID', accessor: 'id' },
        { 
            header: t('ឈ្មោះគ្រូបង្រៀន', 'Teacher Name'), 
            render: (row) => <strong>👨‍🏫 {row.teacher?.name || 'N/A'}</strong> 
        },
        { 
            header: t('ថ្នាក់រៀន', 'Class'), 
            render: (row) => <span>🏫 {row.school_class?.name || 'N/A'}</span> 
        },
        { 
            header: t('មុខវិជ្ជា', 'Subject'), 
            render: (row) => <span style={{ fontWeight: '600', color: '#0284c7' }}>📘 {row.subject?.name || 'N/A'}</span> 
        },
        { header: t('ឆ្នាំសិក្សា', 'Academic Year'), accessor: 'academic_year' },
        { 
            header: t('សកម្មភាព', 'Actions'), 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="small" variant="secondary" onClick={() => handleEditSubject(row)}>{t("កែប្រែ", "Edit")}</Button>
                    <Button size="small" variant="danger" onClick={() => handleDeleteSubject(row.id)}>{t("លុប", "Delete")}</Button>
                </div>
            ) 
        }
    ];

    // Columns definition for Homeroom Assignments
    const homeroomColumns = [
        { header: 'ID', accessor: 'id' },
        { 
            header: t('គ្រូបន្ទុកថ្នាក់', 'Homeroom Teacher'), 
            render: (row) => <strong style={{ color: '#15803d' }}>👑 {row.teacher?.name || 'N/A'}</strong> 
        },
        { 
            header: t('ថ្នាក់បន្ទុក', 'Assigned Class'), 
            render: (row) => <span>🏫 {row.school_class?.name || 'N/A'}</span> 
        },
        { header: t('ឆ្នាំសិក្សា', 'Academic Year'), accessor: 'academic_year' },
        { 
            header: t('សកម្មភាព', 'Actions'), 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="small" variant="secondary" onClick={() => handleEditHomeroom(row)}>{t("កែប្រែ", "Edit")}</Button>
                    <Button size="small" variant="danger" onClick={() => handleDeleteHomeroom(row.id)}>{t("លុប", "Delete")}</Button>
                </div>
            ) 
        }
    ];

    const filteredAssignments = assignments.filter(item => {
        const matchesClass = !selectedClassId || String(item.class_id) === String(selectedClassId);
        const teacherName = item.teacher?.name || '';
        const subjectName = item.subject?.name || '';
        const className = item.school_class?.name || '';

        const matchesSearch = !search ||
            teacherName.toLowerCase().includes(search.toLowerCase()) ||
            subjectName.toLowerCase().includes(search.toLowerCase()) ||
            className.toLowerCase().includes(search.toLowerCase());

        return matchesClass && matchesSearch;
    });

    const filteredHomerooms = homerooms.filter(item => {
        const matchesClass = !selectedClassId || String(item.class_id) === String(selectedClassId);
        const teacherName = item.teacher?.name || '';
        const className = item.school_class?.name || '';

        const matchesSearch = !search ||
            teacherName.toLowerCase().includes(search.toLowerCase()) ||
            className.toLowerCase().includes(search.toLowerCase());

        return matchesClass && matchesSearch;
    });

    // Grouping for Box / Card View (1 Box per Teacher)
    const teacherCardsData = teachers.map(teacher => {
        const tHomerooms = homerooms.filter(h => h.teacher_id === teacher.id);
        const tAssignments = assignments.filter(a => a.teacher_id === teacher.id);

        const subjectGroups = {};
        tAssignments.forEach(a => {
            const subId = a.subject_id;
            const subName = a.subject?.name || 'Unknown Subject';
            if (!subjectGroups[subId]) {
                subjectGroups[subId] = {
                    subject: a.subject,
                    name: subName,
                    classes: []
                };
            }
            subjectGroups[subId].classes.push(a);
        });

        return {
            teacher,
            homerooms: tHomerooms,
            subjectGroups: Object.values(subjectGroups),
            totalClasses: tAssignments.length
        };
    }).filter(item => {
        if (!search && !selectedClassId) return true;
        const matchesSearch = !search ||
            item.teacher.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.teacher.specialization?.toLowerCase().includes(search.toLowerCase()) ||
            item.teacher.phone?.toLowerCase().includes(search.toLowerCase());
        const matchesClass = !selectedClassId ||
            item.homerooms.some(h => String(h.class_id) === String(selectedClassId)) ||
            item.subjectGroups.some(g => g.classes.some(c => String(c.class_id) === String(selectedClassId)));
        return matchesSearch && matchesClass;
    });

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("ការចាត់តាំងគ្រូបង្រៀន 🔗", "Teacher Assignments 🔗")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("ចាត់តាំងគ្រូបន្ទុកថ្នាក់ និង គ្រូបង្រៀនមុខវិជ្ជាតាមថ្នាក់នីមួយៗ។", "Manage teacher class & subject assignments cleanly by Teacher Boxes or Detailed Table.")}
                    </p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button onClick={() => { 
                        setEditingId(null); 
                        setSubjectForm({ teacher_id: '', class_id: '', subject_id: '', academic_year: academicYears[0]?.name || '2026-2027' }); 
                        setIsSubjectModalOpen(true); 
                    }}>+ {t("ចាត់តាំងមុខវិជ្ជា", "Assign Subject")}</Button>

                    <Button variant="secondary" onClick={() => { 
                        setEditingId(null); 
                        setHomeroomForm({ teacher_id: '', class_id: '', academic_year: academicYears[0]?.name || '2026-2027' }); 
                        setIsHomeroomModalOpen(true); 
                    }}>+ {t("ចាត់តាំងគ្រូបន្ទុក", "Assign Homeroom")}</Button>
                </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* Filter & View Mode Bar */}
            <Card>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    
                    {/* View Mode Toggle Switch */}
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <button
                            onClick={() => setViewMode('cards')}
                            style={{
                                border: 'none',
                                background: viewMode === 'cards' ? '#ffffff' : 'transparent',
                                color: viewMode === 'cards' ? '#4f46e5' : '#64748b',
                                padding: '0.45rem 0.85rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            🎴 {t("ប្រអប់គ្រូបង្រៀន", "Teacher Box View")}
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            style={{
                                border: 'none',
                                background: viewMode === 'table' ? '#ffffff' : 'transparent',
                                color: viewMode === 'table' ? '#4f46e5' : '#64748b',
                                padding: '0.45rem 0.85rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            📋 {t("តារាងលម្អិត", "Table View")}
                        </button>
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
                            <option value="">🏫 {t("ថ្នាក់រៀនទាំងអស់", "All Classes")}</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>ថ្នាក់ {c.name} ({c.grade_level})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ width: '240px' }}>
                        <Input 
                            placeholder={t("ស្វែងរកឈ្មោះគ្រូ, មុខវិជ្ជា...", "Search teacher, subject...")} 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ margin: 0 }}
                        />
                    </div>

                    {(selectedClassId || search) && (
                        <Button size="small" variant="secondary" onClick={() => { setSelectedClassId(''); setSearch(''); }}>
                            {t("លុប ✖️", "Clear ✖️")}
                        </Button>
                    )}

                    <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.88rem', fontWeight: '600' }}>
                        {t(`បង្ហាញគ្រូបង្រៀនចំនួន ${teacherCardsData.length} នាក់`, `Showing ${teacherCardsData.length} Teachers`)}
                    </div>
                </div>
            </Card>

            {/* TAB SELECTOR FOR TABLE VIEW */}
            {viewMode === 'table' && (
                <div style={{ display: 'flex', gap: '1rem', margin: '1.25rem 0 1rem 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                    <div 
                        onClick={() => setActiveTab(0)}
                        style={{
                            padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: '600',
                            color: activeTab === 0 ? '#4f46e5' : '#64748b',
                            borderBottom: activeTab === 0 ? '3px solid #4f46e5' : '3px solid transparent',
                            marginBottom: '-12px', transition: 'all 0.2s'
                        }}
                    >
                        📘 {t("គ្រូបង្រៀនមុខវិជ្ជា", "Subject Teachers")}
                    </div>
                    <div 
                        onClick={() => setActiveTab(1)}
                        style={{
                            padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: '600',
                            color: activeTab === 1 ? '#4f46e5' : '#64748b',
                            borderBottom: activeTab === 1 ? '3px solid #4f46e5' : '3px solid transparent',
                            marginBottom: '-12px', transition: 'all 0.2s'
                        }}
                    >
                        👑 {t("គ្រូបន្ទុកថ្នាក់", "Homeroom Teachers")}
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            {loading ? (
                <p style={{ marginTop: '1.25rem' }}>{t("កំពុងទាញយកទិន្នន័យ...", "Loading assignments...")}</p>
            ) : viewMode === 'cards' ? (
                /* BOX PER TEACHER CARD GRID */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
                    {teacherCardsData.length === 0 ? (
                        <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            {t("មិនមានទិន្នន័យគ្រូបង្រៀនត្រឹមត្រូវតាមការស្វែងរកឡើយ", "No teacher assignments found.")}
                        </Card>
                    ) : (
                        teacherCardsData.map(({ teacher, homerooms: tHomes, subjectGroups }) => {
                            const img = getImageUrl(teacher.photo);
                            return (
                                <div key={teacher.id} style={{
                                    background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)', padding: '1.25rem',
                                    display: 'flex', flexDirection: 'column', gap: '1rem'
                                }}>
                                    {/* Teacher Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                            {img ? (
                                                <img src={img} alt={teacher.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #16a34a' }} />
                                            ) : (
                                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                    {teacher.name?.charAt(0) || 'T'}
                                                </div>
                                            )}
                                            <div>
                                                <strong style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block' }}>{teacher.name}</strong>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>📘 {teacher.specialization || 'General'}</span>
                                            </div>
                                        </div>

                                        {/* Quick Add Assignment Button */}
                                        <button 
                                            onClick={() => {
                                                setEditingId(null);
                                                setSelectedClassIds([]);
                                                setSubjectForm({ teacher_id: teacher.id, class_id: '', subject_id: '', academic_year: academicYears[0]?.name || '2026-2027' });
                                                setIsSubjectModalOpen(true);
                                            }}
                                            style={{ background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', padding: '0.35rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                        >
                                            + {t("ចាត់តាំង", "Assign")}
                                        </button>
                                    </div>

                                    {/* Homeroom Assignment Badges with Edit & Delete */}
                                    {tHomes.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                            {tHomes.map(h => (
                                                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#dcfce7', padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#15803d' }}>
                                                        👑 {t("គ្រូបន្ទុក:", "Homeroom:")} ថ្នាក់ {h.school_class?.name}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                        <button 
                                                            onClick={() => handleEditHomeroom(h)} 
                                                            title={t("កែប្រែ", "Edit")}
                                                            style={{ background: '#ffffff', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '0.15rem 0.45rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                                                        >
                                                            ✏️ {t("កែប្រែ", "Edit")}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteHomeroom(h.id)} 
                                                            title={t("លុប", "Delete")}
                                                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', padding: '0.15rem 0.45rem', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Subject Teaching Assignments with Edit & Delete */}
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                                            📘 {t("មុខវិជ្ជា & ថ្នាក់បង្រៀន", "Teaching Subjects & Classes")}
                                        </span>
                                        {subjectGroups.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {subjectGroups.map((grp, idx) => (
                                                    <div key={idx} style={{ background: '#f8fafc', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <strong style={{ fontSize: '0.85rem', color: '#0369a1' }}>📘 {grp.name}</strong>
                                                            {grp.classes.length > 0 && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleEditSubject(grp.classes[0]); }}
                                                                    title={t("កែប្រែមុងវិជ្ជានេះ", "Edit Subject")}
                                                                    style={{
                                                                        background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd',
                                                                        borderRadius: '6px', padding: '0.15rem 0.45rem', fontSize: '0.72rem',
                                                                        fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem'
                                                                    }}
                                                                >
                                                                    ✏️ {t("កែប្រែមុខវិជ្ជា", "Edit Subject")}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                            {grp.classes.map(c => (
                                                                <div key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', border: '1px solid #c7d2fe' }}>
                                                                    <span>{c.school_class?.name}</span>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleEditSubject(c); }}
                                                                        title={t("កែប្រែ", "Edit")}
                                                                        style={{ border: 'none', background: 'transparent', color: '#4338ca', cursor: 'pointer', padding: '0 1px', fontSize: '0.75rem' }}
                                                                    >
                                                                        ✏️
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteSubject(c.id); }}
                                                                        title={t("លុប", "Delete")}
                                                                        style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', padding: '0 1px', fontSize: '0.75rem' }}
                                                                    >
                                                                        ✖
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.82rem' }}>{t("មិនទាន់ចាត់មុខវិជ្ជា", "No subject assignments yet")}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* TABLE VIEW */
                <Card style={{ marginTop: '1rem' }}>
                    {activeTab === 0 ? (
                        <Table columns={subjectColumns} data={filteredAssignments} />
                    ) : (
                        <Table columns={homeroomColumns} data={filteredHomerooms} />
                    )}
                </Card>
            )}

            {/* Modal Assign Subject */}
            <Modal
                isOpen={isSubjectModalOpen}
                onClose={() => { if (!isSubmitting) setIsSubjectModalOpen(false); }}
                title={editingId ? t("កែប្រែការចាត់តាំងមុខវិជ្ជា", "Edit Subject Assignment") : t("ចាត់តាំងគ្រូបង្រៀនមុខវិជ្ជា", "Assign Subject Teacher")}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsSubjectModalOpen(false)} disabled={isSubmitting}>{t("បោះបង់", "Cancel")}</Button>
                        <Button onClick={handleSubjectSubmit} disabled={isSubmitting}>
                            {isSubmitting ? t("កំពុងរក្សាទុក...", "Saving...") : t("រក្សាទុក", "Save Assignment")}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                            {t("ជ្រើសរើសគ្រូបង្រៀន", "Select Teacher")} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select 
                            value={subjectForm.teacher_id} 
                            onChange={(e) => setSubjectForm(prev => ({ ...prev, teacher_id: e.target.value }))}
                            required
                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                        >
                            <option value="">-- {t("ជ្រើសរើសគ្រូ", "Select Teacher")} --</option>
                            {teachers.map(tItem => (
                                <option key={tItem.id} value={tItem.id}>👨‍🏫 {tItem.name} ({tItem.specialization || 'General'})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '700', color: '#0369a1' }}>
                                📘 {t("មុខវិជ្ជាបង្រៀន (Subject)", "Teaching Subject")} <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select 
                                value={subjectForm.subject_id} 
                                onChange={(e) => setSubjectForm(prev => ({ ...prev, subject_id: e.target.value }))}
                                required
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '2px solid #0284c7', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a', fontWeight: '700', backgroundColor: '#f0f9ff' }}
                            >
                                <option value="">-- {t("ជ្រើសរើសមុខវិជ្ជា", "Select Subject")} --</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>📘 {s.name} ({s.code})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                {t("ឆ្នាំសិក្សា", "Academic Year")}
                            </label>
                            <select 
                                value={subjectForm.academic_year} 
                                onChange={(e) => setSubjectForm(prev => ({ ...prev, academic_year: e.target.value }))}
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                {academicYears.length > 0 ? (
                                    academicYears.map(ay => (
                                        <option key={ay.id} value={ay.year}>{ay.name || ay.year}</option>
                                    ))
                                ) : (
                                    <option value="2026-2027">2026-2027</option>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* MULTI-CLASS CHECKBOX SELECTOR GRID */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                {t("ជ្រើសរើសថ្នាក់ដែលគ្រូត្រូវបង្រៀន (អាចជ្រើសរើសច្រើនថ្នាក់បាន)", "Select Teaching Classes (Multiple Selection Allowed)")} <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedClassIds(classes.map(c => c.id))}
                                    style={{ background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    ✓ {t("ជ្រើសរើសទាំងអស់", "Select All")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedClassIds([])}
                                    style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    ✖ {t("លុបទាំងអស់", "Clear All")}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem', background: '#f8fafc' }}>
                            {classes.map(c => {
                                const isChecked = selectedClassIds.includes(c.id);
                                return (
                                    <label 
                                        key={c.id} 
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.6rem', borderRadius: '6px',
                                            border: isChecked ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                                            background: isChecked ? '#e0e7ff' : '#ffffff',
                                            color: isChecked ? '#3730a3' : '#334155',
                                            fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        <input 
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedClassIds(prev => [...prev, c.id]);
                                                } else {
                                                    setSelectedClassIds(prev => prev.filter(id => id !== c.id));
                                                }
                                            }}
                                            style={{ accentColor: '#4f46e5', width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        🏫 ថ្នាក់ {c.name} {c.stream === 'science' ? '🧪 វិទ្យាសាស្ត្រ' : c.stream === 'social_science' ? '📜 វិទ្យាសាស្ត្រសង្គម' : ''}
                                    </label>
                                );
                            })}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#4338ca', fontWeight: '700', marginTop: '0.4rem', display: 'block' }}>
                            {t(`បានជ្រើសរើសចំនួន ${selectedClassIds.length} ថ្នាក់រៀន`, `Selected ${selectedClassIds.length} teaching classes`)}
                        </span>
                    </div>
                </form>
            </Modal>

            {/* Modal Assign Homeroom */}
            <Modal
                isOpen={isHomeroomModalOpen}
                onClose={() => { if (!isSubmitting) setIsHomeroomModalOpen(false); }}
                title={editingId ? t("កែប្រែគ្រូបន្ទុកថ្នាក់", "Edit Homeroom Assignment") : t("ចាត់តាំងគ្រូបន្ទុកថ្នាក់ 👑", "Assign Homeroom Teacher")}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsHomeroomModalOpen(false)} disabled={isSubmitting}>{t("បោះបង់", "Cancel")}</Button>
                        <Button onClick={handleHomeroomSubmit} disabled={isSubmitting}>
                            {isSubmitting ? t("កំពុងរក្សាទុក...", "Saving...") : t("រក្សាទុក", "Save Homeroom")}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleHomeroomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                            {t("ជ្រើសរើសគ្រូបង្រៀន", "Select Homeroom Teacher")} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select 
                            value={homeroomForm.teacher_id} 
                            onChange={(e) => setHomeroomForm(prev => ({ ...prev, teacher_id: e.target.value }))}
                            required
                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                        >
                            <option value="">-- {t("ជ្រើសរើសគ្រូ", "Select Teacher")} --</option>
                            {teachers.map(tItem => (
                                <option key={tItem.id} value={tItem.id}>👑 {tItem.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                            {t("ថ្នាក់បន្ទុក", "Select Class")} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select 
                            value={homeroomForm.class_id} 
                            onChange={(e) => setHomeroomForm(prev => ({ ...prev, class_id: e.target.value }))}
                            required
                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                        >
                            <option value="">-- {t("ជ្រើសរើសថ្នាក់", "Select Class")} --</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>🏫 {c.name} ({c.grade_level})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                            {t("ឆ្នាំសិក្សា", "Academic Year")}
                        </label>
                        <select 
                            value={homeroomForm.academic_year} 
                            onChange={(e) => setHomeroomForm(prev => ({ ...prev, academic_year: e.target.value }))}
                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                        >
                            {academicYears.length > 0 ? (
                                academicYears.map(ay => (
                                    <option key={ay.id} value={ay.year}>{ay.name || ay.year}</option>
                                ))
                            ) : (
                                <option value="2026-2027">2026-2027</option>
                            )}
                        </select>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TeacherAssignments;
