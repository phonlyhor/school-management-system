import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { getClasses, createClass, updateClass, deleteClass } from '../../services/classService';
import { getAcademicYears } from '../../services/academicYearService';
import toast from 'react-hot-toast';

const Classes = () => {
    const { lang, t } = useLanguage();
    const [classes, setClasses] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [viewingClass, setViewingClass] = useState(null);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
    const [levelFilter, setLevelFilter] = useState('all'); // 'all', 'primary', 'lower_sec', 'high_school'

    const getSchoolLevel = (gl) => {
        if (!gl) return 'other';
        const num = parseInt(gl.toString().replace(/[^0-9]/g, ''), 10);
        if (num >= 1 && num <= 6) return 'primary';
        if (num >= 7 && num <= 9) return 'lower_sec';
        if (num >= 10 && num <= 12) return 'high_school';
        return 'other';
    };

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        grade_level: '12',
        stream: 'general',
        academic_year: '2026-2027'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchClasses = async () => {
        setLoading(true);
        setError(null);
        try {
            const [classRes, ayRes] = await Promise.all([
                getClasses(),
                getAcademicYears().catch(() => ({ data: { academic_years: [] } }))
            ]);
            setClasses(classRes.data.classes || []);
            const ays = ayRes.data.academic_years || ayRes.data || [];
            setAcademicYears(Array.isArray(ays) ? ays : []);
        } catch (err) {
            console.error("Failed to fetch classes:", err);
            setError(t("មានបញ្ហាក្នុងការទាញយកទិន្នន័យថ្នាក់រៀន", "Failed to load classes. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
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
        return isNaN(age) || age < 0 ? 'N/A' : `${age} ${t('ឆ្នាំ', 'years')}`;
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateClass(editingId, formData);
                toast.success(t("បានកែប្រែថ្នាក់រៀនដោយជោគជ័យ!", "Class updated successfully!"));
            } else {
                await createClass(formData);
                toast.success(t("បានបង្កើតថ្នាក់រៀនថ្មីដោយជោគជ័យ!", "Class created successfully!"));
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ name: '', grade_level: '12', stream: 'general', academic_year: '2026-2027' });
            fetchClasses();
        } catch (err) {
            console.error("Failed to save class:", err);
            toast.error(t("មានបញ្ហាក្នុងការរក្សាទុកថ្នាក់រៀន៖ ", "Error saving class: ") + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClassNameSelect = (selectedName) => {
        if (!selectedName) return;
        const match = selectedName.match(/^(\d+)/);
        const extractedGrade = match ? match[1] : formData.grade_level;
        let extractedStream = formData.stream;
        if (selectedName.includes('Sc')) extractedStream = 'science';
        else if (selectedName.includes('So')) extractedStream = 'social_science';

        setFormData(prev => ({
            ...prev,
            name: selectedName,
            grade_level: extractedGrade,
            stream: extractedStream
        }));
    };

    const handleEditClick = (cls) => {
        setEditingId(cls.id);
        setFormData({
            name: cls.name,
            grade_level: cls.grade_level || '12',
            stream: cls.stream || 'general',
            academic_year: cls.academic_year || '2026-2027'
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t("តើអ្នកពិតជាចង់លុបថ្នាក់រៀននេះមែនទេ?", "Are you sure you want to delete this class?"))) {
            try {
                await deleteClass(id);
                fetchClasses();
                toast.success(t("បានលុបថ្នាក់រៀនដោយជោគជ័យ!", "Class deleted successfully!"));
            } catch (err) {
                console.error("Failed to delete class:", err);
                toast.error(t("មានបញ្ហាក្នុងការលុបថ្នាក់រៀន៖ ", "Error deleting class: ") + (err.response?.data?.message || err.message));
            }
        }
    };

    const formatGrade = (gl) => {
        if (!gl) return '';
        return gl.toLowerCase().startsWith('grade') ? gl : `${t('កម្រិតថ្នាក់', 'Grade')} ${gl}`;
    };

    const columns = [
        { header: 'ID', accessor: 'id' },
        { 
            header: t('ឈ្មោះថ្នាក់រៀន', 'Class Name'), 
            render: (row) => <strong>🏫 {row.name}</strong> 
        },
        { 
            header: t('កម្រិតថ្នាក់', 'Grade Level'), 
            render: (row) => formatGrade(row.grade_level) 
        },
        { 
            header: t('ជំនាញ / ផែន', 'Stream / Track'), 
            render: (row) => {
                const s = row.stream || 'general';
                if (s === 'science') return <span style={{ fontWeight: '700', color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.82rem' }}>🧪 {t("វិទ្យាសាស្ត្រ", "Science")}</span>;
                if (s === 'social_science') return <span style={{ fontWeight: '700', color: '#c2410c', backgroundColor: '#ffedd5', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.82rem' }}>📜 {t("វិទ្យាសាស្ត្រសង្គម", "Social Science")}</span>;
                return <span style={{ fontWeight: '600', color: '#475569', backgroundColor: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.82rem' }}>📚 {t("ទូទៅ", "General")}</span>;
            } 
        },
        { 
            header: t('គ្រូបន្ទុកថ្នាក់', 'Homeroom Teacher'), 
            render: (row) => {
                const teachers = row.teacher_assignments?.map(a => a.teacher?.name).filter(Boolean);
                if (teachers && teachers.length > 0) {
                    return <span style={{ fontWeight: '700', color: '#15803d' }}>👑 {teachers.join(', ')}</span>;
                }
                return <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>{t("មិនទាន់មានគ្រូបន្ទុក", "Not Assigned")}</span>;
            } 
        },
        { 
            header: t('ចំនួនសិស្ស', 'Total Students'), 
            render: (row) => (
                <span style={{ fontWeight: '700', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                    👥 {row.students?.length || 0} {t("នាក់", "Students")}
                </span>
            )
        },
        { header: t('ឆ្នាំសិក្សា', 'Academic Year'), accessor: 'academic_year' },
        { 
            header: t('សកម្មភាព', 'Actions'), 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button 
                        size="small" 
                        variant="secondary" 
                        onClick={(e) => { e.stopPropagation(); setViewingClass(row); }}
                        title={t("មើលបញ្ជីឈ្មោះសិស្ស", "View Class Roster")}
                    >
                        👁️ Roster
                    </Button>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}>{t('កែប្រែ', 'Edit')}</Button>
                    <Button size="small" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>{t('លុប', 'Delete')}</Button>
                </div>
            ) 
        }
    ];

    const filteredClasses = classes.filter(c => {
        const lvl = getSchoolLevel(c.grade_level);
        const matchesLevel = levelFilter === 'all' || lvl === levelFilter;

        const matchesSearch = !search || 
            (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
            (c.grade_level && c.grade_level.toLowerCase().includes(search.toLowerCase())) ||
            (c.stream && c.stream.toLowerCase().includes(search.toLowerCase()));

        return matchesLevel && matchesSearch;
    });

    const studentRosterColumns = [
        { header: t('អត្តលេខ', 'Code'), accessor: 'student_code' },
        { 
            header: t('ឈ្មោះសិស្ស', 'Student Name'), 
            render: (row) => {
                const img = getImageUrl(row.photo);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {img ? (
                            <img src={img} alt={row.user?.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                {row.user?.name?.charAt(0) || 'S'}
                            </div>
                        )}
                        <div>
                            <strong style={{ color: '#0f172a' }}>{row.user?.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>{row.user?.email}</span>
                        </div>
                    </div>
                );
            } 
        },
        { 
            header: t('ភេទ', 'Gender'), 
            render: (row) => ((row.gender || '').toLowerCase() === 'female' ? t('👩 ស្រី', 'Female') : t('👨 ប្រុស', 'Male')) 
        },
        { header: t('អាយុ', 'Age'), render: (row) => calculateAge(row.date_of_birth) },
        { header: t('អាណាព្យាបាល', 'Parent Contact'), render: (row) => row.student_parent?.user?.name || row.father_name || row.mother_name || 'N/A' }
    ];

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("គ្រប់គ្រងថ្នាក់រៀន 🏫", "Manage Classes 🏫")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("ពិនិត្យមើល ចុះឈ្មោះ និង គ្រប់គ្រងថ្នាក់រៀន ផែនវិទ្យាសាស្ត្រ និង គ្រូបន្ទុកថ្នាក់។", "View, enroll, and manage school class sections, streams, and homeroom teachers.")}
                    </p>
                </div>
                <Button onClick={() => { setEditingId(null); setFormData({ name: '', grade_level: '12', stream: 'general', academic_year: '2026-2027' }); setIsModalOpen(true); }}>
                    {t("+ បន្ថែមថ្នាក់រៀន", "+ Add Class")}
                </Button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* Filter & View Switcher Bar */}
            <Card>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    
                    {/* View Switcher Controls */}
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
                            🎴 {t("ប្រអប់ថ្នាក់រៀន", "Class Box View")}
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

                    {/* School Level Filter Dropdown */}
                    <div style={{ width: '240px' }}>
                        <select 
                            value={levelFilter} 
                            onChange={(e) => setLevelFilter(e.target.value)}
                            style={{ 
                                width: '100%', height: '42px', padding: '0.6rem 0.8rem', 
                                border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a',
                                backgroundColor: '#ffffff', fontWeight: '700'
                            }}
                        >
                            <option value="all">🏫 {t("គ្រប់កម្រិតថ្នាក់ (All Levels)", "All Levels")}</option>
                            <option value="primary">🎒 {t("បឋមសិក្សា (ថ្នាក់ទី ១ - ៦)", "Primary (Grade 1 - 6)")}</option>
                            <option value="lower_sec">📘 {t("អនុវិទ្យាល័យ (ថ្នាក់ទី ៧ - ៩)", "Lower Secondary (Grade 7 - 9)")}</option>
                            <option value="high_school">🎓 {t("វិទ្យាល័យ (ថ្នាក់ទី ១០ - ១២)", "High School (Grade 10 - 12)")}</option>
                        </select>
                    </div>

                    <div style={{ width: '240px' }}>
                        <Input 
                            placeholder={t("ស្វែងរកឈ្មោះថ្នាក់, កម្រិត...", "Search class name, grade, stream...")} 
                            value={search}
                            onChange={handleSearch}
                            style={{ margin: 0 }}
                        />
                    </div>

                    {(search || levelFilter !== 'all') && (
                        <Button size="small" variant="secondary" onClick={() => { setSearch(''); setLevelFilter('all'); }}>
                            {t("លុប ✖️", "Clear ✖️")}
                        </Button>
                    )}

                    <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.88rem', fontWeight: '600' }}>
                        {t(`បង្ហាញថ្នាក់រៀនចំនួន ${filteredClasses.length}`, `Showing ${filteredClasses.length} Classes`)}
                    </div>
                </div>
            </Card>

            {/* MAIN CONTENT AREA */}
            {loading ? (
                <p style={{ marginTop: '1.25rem' }}>{t("កំពុងទាញយកទិន្នន័យថ្នាក់រៀន...", "Loading classes...")}</p>
            ) : viewMode === 'cards' ? (
                /* CLASS BOX / CARD GRID VIEW */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
                    {filteredClasses.length === 0 ? (
                        <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            {t("មិនមានថ្នាក់រៀនសមស្របតាមការស្វែងរកឡើយ", "No classes found matching your search.")}
                        </Card>
                    ) : (
                        filteredClasses.map(cls => {
                            const stream = cls.stream || 'general';
                            const homeroomTeachers = cls.teacher_assignments?.map(a => a.teacher?.name).filter(Boolean) || [];
                            const taughtSubjects = Array.from(new Set(cls.teacher_subject_assignments?.map(a => a.subject?.name).filter(Boolean) || []));
                            const studentCount = cls.students?.length || 0;

                            return (
                                <div key={cls.id} style={{
                                    background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)', padding: '1.25rem',
                                    display: 'flex', flexDirection: 'column', gap: '1rem',
                                    position: 'relative', transition: 'transform 0.15s, box-shadow 0.15s'
                                }}>
                                    {/* Class Header Banner */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.35rem', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                🏫 {t("ថ្នាក់", "Class")} {cls.name}
                                            </h3>
                                            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>
                                                {t("កម្រិតថ្នាក់:", "Grade:")} <strong style={{ color: '#4338ca' }}>Grade {cls.grade_level}</strong> | {cls.academic_year}
                                            </span>
                                        </div>
                                        <div>
                                            {stream === 'science' ? (
                                                <span style={{ fontWeight: '700', color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '0.3rem 0.65rem', borderRadius: '12px', fontSize: '0.78rem' }}>
                                                    🧪 {t("វិទ្យាសាស្ត្រ", "Science")}
                                                </span>
                                            ) : stream === 'social_science' ? (
                                                <span style={{ fontWeight: '700', color: '#c2410c', backgroundColor: '#ffedd5', padding: '0.3rem 0.65rem', borderRadius: '12px', fontSize: '0.78rem' }}>
                                                    📜 {t("វិទ្យាសាស្ត្រសង្គម", "Social Science")}
                                                </span>
                                            ) : (
                                                <span style={{ fontWeight: '600', color: '#475569', backgroundColor: '#f1f5f9', padding: '0.3rem 0.65rem', borderRadius: '12px', fontSize: '0.78rem' }}>
                                                    📚 {t("ទូទៅ", "General")}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle Info Stats */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                                        <div style={{ background: '#f8fafc', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>👑 {t("គ្រូបន្ទុកថ្នាក់", "Homeroom Teacher")}</span>
                                            <strong style={{ fontSize: '0.88rem', color: '#3730a3', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {homeroomTeachers.length > 0 ? homeroomTeachers.join(', ') : t("មិនទាន់មាន", "Not Assigned")}
                                            </strong>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '0.65rem 0.8rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>👥 {t("សិស្សក្នុងថ្នាក់", "Students")}</span>
                                            <strong style={{ fontSize: '0.88rem', color: '#0369a1', display: 'block', marginTop: '2px' }}>
                                                {studentCount} {t("នាក់", "Students")}
                                            </strong>
                                        </div>
                                    </div>

                                    {/* Taught Subjects Chips */}
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                                            📘 {t("មុខវិជ្ជាក្នុងថ្នាក់", "Subjects in Class")} ({taughtSubjects.length})
                                        </span>
                                        {taughtSubjects.length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                                {taughtSubjects.slice(0, 4).map((subj, idx) => (
                                                    <span key={idx} style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '8px', fontWeight: '600' }}>
                                                        {subj}
                                                    </span>
                                                ))}
                                                {taughtSubjects.length > 4 && (
                                                    <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.5rem', borderRadius: '8px', fontWeight: '600' }}>
                                                        +{taughtSubjects.length - 4} {t("ទៀត", "more")}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.82rem' }}>{t("គ្មានមុខវិជ្ជា", "No subjects assigned")}</span>
                                        )}
                                    </div>

                                    {/* Action Buttons Footer */}
                                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: 'auto' }}>
                                        <Button 
                                            size="small" 
                                            variant="secondary" 
                                            onClick={(e) => { e.stopPropagation(); setViewingClass(cls); }}
                                            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem' }}
                                        >
                                            👁️ {t("បញ្ជីសិស្ស", "Roster")}
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variant="secondary" 
                                            onClick={(e) => { e.stopPropagation(); handleEditClick(cls); }}
                                        >
                                            {t("កែប្រែ", "Edit")}
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variant="danger" 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }}
                                        >
                                            {t("លុប", "Delete")}
                                        </Button>
                                    </div>

                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* TABLE VIEW */
                <Card style={{ marginTop: '1.25rem' }}>
                    <Table columns={columns} data={filteredClasses} />
                </Card>
            )}

            {/* Add / Edit Class Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => { if (!isSubmitting) { setIsModalOpen(false); setEditingId(null); } }}
                title={editingId ? t("កែប្រែថ្នាក់រៀន", "Edit Class") : t("បន្ថែមថ្នាក់រៀនថ្មី", "Add New Class")}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>{t("បោះបង់", "Cancel")}</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? t("កំពុងរក្សាទុក...", "Saving...") : t("រក្សាទុក", "Save Class")}
                        </Button>
                    </>
                }
            >
                <form id="class-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Class Name Input with Quick Select & Suggestions */}
                    <div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <Input 
                                    label={t("ឈ្មោះថ្នាក់រៀន (ឧ. 12A / 12Sc1 / 10B)", "Class Name (e.g. 12A / 12Sc1 / 10B)")} 
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        handleClassNameSelect(val);
                                    }}
                                    required
                                    placeholder="e.g. 12A, 12Sc1, 10B"
                                    style={{ margin: 0 }}
                                />
                            </div>
                            <div style={{ width: '220px' }}>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>
                                    ⚡ {t("ជ្រើសរើសឈ្មោះថ្នាក់", "Quick Select Name")}
                                </label>
                                <select
                                    onChange={(e) => handleClassNameSelect(e.target.value)}
                                    value={formData.name}
                                    style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#4f46e5', fontWeight: '700', backgroundColor: '#f8fafc' }}
                                >
                                    <option value="">-- {t("ជ្រើសរើស", "Select Preset")} --</option>
                                    <optgroup label="ថ្នាក់ទី ១ - ៦ (Primary)">
                                        <option value="1A">ថ្នាក់ទី 1A</option>
                                        <option value="1B">ថ្នាក់ទី 1B</option>
                                        <option value="2A">ថ្នាក់ទី 2A</option>
                                        <option value="2B">ថ្នាក់ទី 2B</option>
                                        <option value="3A">ថ្នាក់ទី 3A</option>
                                        <option value="3B">ថ្នាក់ទី 3B</option>
                                        <option value="4A">ថ្នាក់ទី 4A</option>
                                        <option value="4B">ថ្នាក់ទី 4B</option>
                                        <option value="5A">ថ្នាក់ទី 5A</option>
                                        <option value="5B">ថ្នាក់ទី 5B</option>
                                        <option value="6A">ថ្នាក់ទី 6A</option>
                                        <option value="6B">ថ្នាក់ទី 6B</option>
                                    </optgroup>
                                    <optgroup label="ថ្នាក់ទី ៧ - ៩ (Lower Secondary)">
                                        <option value="7A">ថ្នាក់ទី 7A</option>
                                        <option value="7B">ថ្នាក់ទី 7B</option>
                                        <option value="8A">ថ្នាក់ទី 8A</option>
                                        <option value="8B">ថ្នាក់ទី 8B</option>
                                        <option value="9A">ថ្នាក់ទី 9A</option>
                                        <option value="9B">ថ្នាក់ទី 9B</option>
                                    </optgroup>
                                    <optgroup label="ថ្នាក់ទី ១០ - ១២ (Upper Secondary)">
                                        <option value="10A">ថ្នាក់ទី 10A</option>
                                        <option value="10B">ថ្នាក់ទី 10B</option>
                                        <option value="11Sc1">ថ្នាក់ទី 11Sc1 (វិទ្យាសាស្ត្រ)</option>
                                        <option value="11So1">ថ្នាក់ទី 11So1 (សង្គម)</option>
                                        <option value="12Sc1">ថ្នាក់ទី 12Sc1 (វិទ្យាសាស្ត្រ)</option>
                                        <option value="12So1">ថ្នាក់ទី 12So1 (សង្គម)</option>
                                        <option value="12A">ថ្នាក់ទី 12A</option>
                                        <option value="12B">ថ្នាក់ទី 12B</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        {/* Quick Suggestion Tags */}
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>{t("ចុចជ្រើសរើសលឿនៗ:", "Quick Suggestions:")}</span>
                            {['1A', '3A', '6A', '7A', '9A', '10A', '11Sc1', '11So1', '12Sc1', '12So1', '12A'].map(name => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => handleClassNameSelect(name)}
                                    style={{
                                        padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.78rem',
                                        border: formData.name === name ? '1px solid #4f46e5' : '1px solid #cbd5e1',
                                        background: formData.name === name ? '#e0e7ff' : '#ffffff',
                                        color: formData.name === name ? '#4338ca' : '#475569',
                                        cursor: 'pointer', fontWeight: '700'
                                    }}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                {t("កម្រិតថ្នាក់", "Grade Level")}
                            </label>
                            <select 
                                name="grade_level" 
                                value={formData.grade_level} 
                                onChange={handleInputChange} 
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a', fontWeight: '600' }}
                            >
                                <option value="1">Grade 1 (ថ្នាក់ទី ១)</option>
                                <option value="2">Grade 2 (ថ្នាក់ទី ២)</option>
                                <option value="3">Grade 3 (ថ្នាក់ទី ៣)</option>
                                <option value="4">Grade 4 (ថ្នាក់ទី ៤)</option>
                                <option value="5">Grade 5 (ថ្នាក់ទី ៥)</option>
                                <option value="6">Grade 6 (ថ្នាក់ទី ៦)</option>
                                <option value="7">Grade 7 (ថ្នាក់ទី ៧)</option>
                                <option value="8">Grade 8 (ថ្នាក់ទី ៨)</option>
                                <option value="9">Grade 9 (ថ្នាក់ទី ៩)</option>
                                <option value="10">Grade 10 (ថ្នាក់ទី ១០)</option>
                                <option value="11">Grade 11 (ថ្នាក់ទី ១១)</option>
                                <option value="12">Grade 12 (ថ្នាក់ទី ១២)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                {t("ផែន / ជំនាញ", "Stream / Track")}
                            </label>
                            <select 
                                name="stream" 
                                value={formData.stream} 
                                onChange={handleInputChange} 
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                <option value="general">📚 {t("ទូទៅ", "General")}</option>
                                <option value="science">🧪 {t("វិទ្យាសាស្ត្រ (Science)", "Science")}</option>
                                <option value="social_science">📜 {t("វិទ្យាសាស្ត្រសង្គម (Social Science)", "Social Science")}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                            {t("ឆ្នាំសិក្សា", "Academic Year")}
                        </label>
                        <select 
                            name="academic_year" 
                            value={formData.academic_year} 
                            onChange={handleInputChange} 
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

            {/* View Class Roster Modal */}
            <Modal 
                isOpen={!!viewingClass} 
                onClose={() => setViewingClass(null)}
                title={`${t("បញ្ជីឈ្មោះសិស្សក្នុងថ្នាក់", "Class Roster:")} ${viewingClass?.name || ''} 👥`}
                maxWidth="750px"
                footer={<Button variant="secondary" onClick={() => setViewingClass(null)}>{t("បិទ", "Close")}</Button>}
            >
                {viewingClass && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ background: '#f8fafc', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>🏫 ថ្នាក់ {viewingClass.name}</strong>
                                <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: '0.5rem' }}>({viewingClass.academic_year})</span>
                            </div>
                            <span style={{ fontWeight: '700', color: '#16a34a', background: '#dcfce7', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                                👥 {viewingClass.students?.length || 0} {t("នាក់", "Students")}
                            </span>
                        </div>

                        {viewingClass.students?.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '2rem' }}>
                                {t("មិនទាន់មានសិស្សក្នុងថ្នាក់នេះនៅឡើយទេ", "No students enrolled in this class yet.")}
                            </p>
                        ) : (
                            <Table columns={studentRosterColumns} data={viewingClass.students || []} />
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Classes;
