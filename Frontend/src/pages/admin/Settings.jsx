import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { getAcademicYears, createAcademicYear, updateAcademicYear, deleteAcademicYear } from '../../services/academicYearService';
import { getSemesters, createSemester, updateSemester, deleteSemester } from '../../services/semesterService';
import { getAssessments, createAssessment, updateAssessment, deleteAssessment } from '../../services/assessmentService';
import { getClasses } from '../../services/classService';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('academic_years'); // academic_years, semesters, assessments, system_settings

    // Data states
    const [academicYears, setAcademicYears] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [systemSettings, setSystemSettings] = useState({ allow_student_registration: 'true' });
    const [updatingSetting, setUpdatingSetting] = useState(false);
    const [classList, setClassList] = useState([]);
    const [togglingClassId, setTogglingClassId] = useState(null);
    const [classSearch, setClassSearch] = useState('');
    
    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form states
    const [ayForm, setAyForm] = useState({ name: '', start_date: '', end_date: '' });
    const [semForm, setSemForm] = useState({ academic_year_id: '', name: '', start_date: '', end_date: '' });
    const [assForm, setAssForm] = useState({ semester_id: '', name: '', type: 'monthly', month: '', max_score: '100', date: '' });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [ayRes, semRes, assRes, sysRes, classRes] = await Promise.all([
                getAcademicYears(),
                getSemesters(),
                getAssessments(),
                api.get('/admin/system-settings').catch(() => ({ data: { settings: {} } })),
                getClasses().catch(() => ({ data: { classes: [] } }))
            ]);
            setAcademicYears(ayRes.data.academic_years || []);
            setSemesters(semRes.data.semesters || []);
            setAssessments(assRes.data.assessments || []);
            setClassList(classRes.data.classes || []);
            if (sysRes.data?.settings) {
                setSystemSettings(prev => ({ ...prev, ...sysRes.data.settings }));
            }
        } catch (err) {
            console.error("Failed to fetch settings data:", err);
            setError("Failed to load settings. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSystemSetting = async (key, value) => {
        setUpdatingSetting(true);
        try {
            const res = await api.post('/admin/system-settings', { key, value });
            setSystemSettings(res.data.settings || { [key]: value });
            toast.success(res.data.message || "បានធ្វើបច្ចុប្បន្នភាពកំណត់រចនាសម្ព័ន្ធ!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update setting");
        } finally {
            setUpdatingSetting(false);
        }
    };

    const handleCopyClassRegisterLink = (cls) => {
        const url = `${window.location.origin}/register/student?class_id=${cls.id}`;
        navigator.clipboard.writeText(url);
        toast.success(`បានចម្លង Link ចុះឈ្មោះសម្រាប់ថ្នាក់ ${cls.name} រួចរាល់!`);
    };

    const handleToggleClassRegistration = async (cls) => {
        setTogglingClassId(cls.id);
        try {
            const res = await api.post(`/teacher/classes/${cls.id}/toggle-registration`);
            toast.success(res.data.message);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "មានបញ្ហាក្នុងការកំណត់ការចុះឈ្មោះ");
        } finally {
            setTogglingClassId(null);
        }
    };

    const [selectedOpenClassIds, setSelectedOpenClassIds] = useState([]);
    const [regMode, setRegMode] = useState('custom'); // 'all_open', 'custom', 'all_closed'
    const [savingBatch, setSavingBatch] = useState(false);

    useEffect(() => {
        if (classList.length > 0) {
            const openIds = classList.filter(c => c.is_registration_open !== false).map(c => c.id);
            setSelectedOpenClassIds(openIds);
        }
    }, [classList]);

    const handleToggleClassSelection = (classId) => {
        setSelectedOpenClassIds(prev =>
            prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
        );
    };

    const classesWithTeachers = classList.filter(cls => {
        const teachers = cls.teacher_assignments?.map(a => a.teacher?.name).filter(Boolean) || [];
        return teachers.length > 0;
    });

    const handleSelectAllClasses = () => {
        setSelectedOpenClassIds(classesWithTeachers.map(c => c.id));
    };

    const handleDeselectAllClasses = () => {
        setSelectedOpenClassIds([]);
    };

    const handleSaveHomeroomRegistrationBatch = async () => {
        setSavingBatch(true);
        try {
            const res = await api.post('/admin/system-settings/homeroom-registration', {
                mode: regMode,
                open_class_ids: selectedOpenClassIds
            });
            toast.success(res.data.message);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "មានបញ្ហាក្នុងការរក្សាទុកការកំណត់");
        } finally {
            setSavingBatch(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handlers
    const handleAySubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateAcademicYear(editingId, ayForm);
                toast.success("Academic year updated successfully!");
            } else {
                await createAcademicYear(ayForm);
                toast.success("Academic year created successfully!");
            }
            setIsModalOpen(false);
            setEditingId(null);
            setAyForm({ name: '', start_date: '', end_date: '' });
            fetchData();
        } catch (err) {
            toast.error("Error saving academic year: " + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSemSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateSemester(editingId, semForm);
                toast.success("Semester updated successfully!");
            } else {
                await createSemester(semForm);
                toast.success("Semester created successfully!");
            }
            setIsModalOpen(false);
            setEditingId(null);
            setSemForm({ academic_year_id: '', name: '', start_date: '', end_date: '' });
            fetchData();
        } catch (err) {
            toast.error("Error saving semester: " + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateAssessment(editingId, assForm);
                toast.success("Assessment updated successfully!");
            } else {
                await createAssessment(assForm);
                toast.success("Assessment created successfully!");
            }
            setIsModalOpen(false);
            setEditingId(null);
            setAssForm({ semester_id: '', name: '', type: 'monthly', month: '', max_score: '100', date: '' });
            fetchData();
        } catch (err) {
            toast.error("Error saving assessment: " + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (type, row) => {
        setEditingId(row.id);
        if (type === 'academic_year') {
            setAyForm({ name: row.name, start_date: row.start_date, end_date: row.end_date });
        } else if (type === 'semester') {
            setSemForm({ academic_year_id: row.academic_year_id, name: row.name, start_date: row.start_date, end_date: row.end_date });
        } else if (type === 'assessment') {
            setAssForm({ semester_id: row.semester_id, name: row.name, type: row.type, month: row.month || '', max_score: row.max_score, date: row.date || '' });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            if (type === 'academic_year') await deleteAcademicYear(id);
            if (type === 'semester') await deleteSemester(id);
            if (type === 'assessment') await deleteAssessment(id);
            fetchData();
            toast.success(`${type} deleted successfully!`);
        } catch (err) {
            toast.error(`Error deleting ${type}: ` + (err.response?.data?.message || err.message));
        }
    };

    // Columns
    const ayColumns = [
        { header: 'ល.រ (ID)', accessor: 'id' },
        { header: 'ឆ្នាំសិក្សា (Academic Year)', accessor: 'name' },
        { header: 'ថ្ងៃចាប់ផ្តើម (Start Date)', accessor: 'start_date' },
        { header: 'ថ្ងៃបញ្ចប់ (End Date)', accessor: 'end_date' },
        { 
            header: 'ស្ថានភាព (Status)', 
            render: (row) => (
                <span style={{ 
                    color: row.status ? '#166534' : '#991b1b', 
                    padding: '0.2rem 0.6rem', background: row.status ? '#f0fdf4' : '#fef2f2', borderRadius: '6px', fontWeight: '700', fontSize: '0.82rem'
                }}>
                    {row.status ? '🟢 សកម្ម (Active)' : '🔴 អសកម្ម (Inactive)'}
                </span>
            )
        },
        { 
            header: 'សកម្មភាព (Actions)', 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick('academic_year', row); }}>✏️ កែប្រែ</Button>
                    <Button size="small" variant="danger" onClick={() => handleDelete('academic_year', row.id)}>🗑️ លុប</Button>
                </div>
            )
        }
    ];

    const semColumns = [
        { header: 'ល.រ (ID)', accessor: 'id' },
        { header: 'ឆមាស (Semester)', accessor: 'name' },
        { header: 'ឆ្នាំសិក្សា (Academic Year)', render: (row) => row.academic_year?.name || 'មិនស្គាល់' },
        { header: 'ថ្ងៃចាប់ផ្តើម (Start Date)', accessor: 'start_date' },
        { header: 'ថ្ងៃបញ្ចប់ (End Date)', accessor: 'end_date' },
        { 
            header: 'សកម្មភាព (Actions)', 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick('semester', row); }}>✏️ កែប្រែ</Button>
                    <Button size="small" variant="danger" onClick={() => handleDelete('semester', row.id)}>🗑️ លុប</Button>
                </div>
            )
        }
    ];

    const assColumns = [
        { header: 'ល.រ (ID)', accessor: 'id' },
        { header: 'ឈ្មោះការវាយតម្លៃ (Name)', accessor: 'name' },
        { header: 'ប្រភេទ (Type)', accessor: 'type' },
        { header: 'ឆមាស (Semester)', render: (row) => row.semester?.name || 'មិនស្គាល់' },
        { header: 'ពិន្ទុអតិបរមា (Max Score)', accessor: 'max_score' },
        { header: 'កាលបរិច្ឆេទ/ខែ (Date/Month)', render: (row) => row.date || row.month || 'N/A' },
        { 
            header: 'សកម្មភាព (Actions)', 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick('assessment', row); }}>✏️ កែប្រែ</Button>
                    <Button size="small" variant="danger" onClick={() => handleDelete('assessment', row.id)}>🗑️ លុប</Button>
                </div>
            )
        }
    ];

    // Styles for tabs
    const tabStyle = (isActive) => ({
        padding: '0.75rem 1.25rem',
        cursor: 'pointer',
        borderBottom: isActive ? '3px solid #3b82f6' : '3px solid transparent',
        color: isActive ? '#1d4ed8' : '#64748b',
        fontWeight: isActive ? '700' : '500',
        background: 'none',
        borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        fontSize: '0.95rem'
    });

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">⚙️ ការកំណត់ប្រព័ន្ធកម្រិតខ្ពស់ (Advanced Settings)</h1>
                {activeTab !== 'system_settings' && (
                    <Button onClick={() => { 
                        setEditingId(null); 
                        setAyForm({ name: '', start_date: '', end_date: '' });
                        setSemForm({ academic_year_id: '', name: '', start_date: '', end_date: '' });
                        setAssForm({ semester_id: '', name: '', type: 'monthly', month: '', max_score: '100', date: '' });
                        setIsModalOpen(true); 
                    }}>
                        ➕ {activeTab === 'academic_years' ? 'បន្ថែមឆ្នាំសិក្សា' : activeTab === 'semesters' ? 'បន្ថែមឆមាស' : 'បន្ថែមការវាយតម្លៃ'}
                    </Button>
                )}
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <Card>
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                    <button style={tabStyle(activeTab === 'academic_years')} onClick={() => setActiveTab('academic_years')}>📅 ឆ្នាំសិក្សា (Academic Years)</button>
                    <button style={tabStyle(activeTab === 'semesters')} onClick={() => setActiveTab('semesters')}>📆 ឆមាស (Semesters)</button>
                    <button style={tabStyle(activeTab === 'assessments')} onClick={() => setActiveTab('assessments')}>📝 ការវាយតម្លៃ (Assessments)</button>
                    <button style={tabStyle(activeTab === 'system_settings')} onClick={() => setActiveTab('system_settings')}>⚙️ ការចុះឈ្មោះសិស្ស (Student Registration)</button>
                </div>
                
                {loading ? (
                    <p>Loading settings data...</p>
                ) : (
                    <>
                        {activeTab === 'academic_years' && <Table columns={ayColumns} data={academicYears} />}
                        {activeTab === 'semesters' && <Table columns={semColumns} data={semesters} />}
                        {activeTab === 'assessments' && <Table columns={assColumns} data={assessments} />}
                        {activeTab === 'system_settings' && (
                            <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Global Setting Box */}
                                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '650px' }}>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        🎓 ការចុះឈ្មោះសិស្សថ្មីតាមប្រព័ន្ធអនឡាញ (Public Student Self-Registration)
                                    </h3>
                                    <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5' }}>
                                        កំណត់ថាតើសិស្សថ្មីអាចចូលទៅកាន់ទម្រង់ចុះឈ្មោះតាមវេបសាយ <code>/register</code> ដោយខ្លួនឯងបាន ឬ ត្រូវបិទមិនឱ្យចុះឈ្មោះ។
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
                                            ស្ថានភាពចុះឈ្មោះទូទាំងប្រព័ន្ធ (Global Registration Dropdown) ៖
                                        </label>
                                        <select
                                            value={systemSettings.allow_student_registration ?? 'true'}
                                            onChange={(e) => handleUpdateSystemSetting('allow_student_registration', e.target.value)}
                                            disabled={updatingSetting}
                                            style={{
                                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                                border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: '700',
                                                backgroundColor: systemSettings.allow_student_registration === 'false' ? '#fef2f2' : '#f0fdf4',
                                                color: systemSettings.allow_student_registration === 'false' ? '#991b1b' : '#166534',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="true">🟢 បើកទទួលការចុះឈ្មោះ (Open Student Registration)</option>
                                            <option value="false">🔴 បិទការចុះឈ្មោះ (Closed Student Registration)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Select Homeroom Teachers/Classes to Open */}
                                <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>
                                                🎯 ជ្រើសរើសថ្នាក់/គ្រូបន្ទុកថ្នាក់ ដែលអនុញ្ញាតឱ្យបើកចុះឈ្មោះ
                                            </h3>
                                            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                                                គ្រូបន្ទុកថ្នាក់ដែលបានជ្រើសរើស (☑️) នឹងអាចឃើញប្រអប់ចុះឈ្មោះ និង ផ្ញើ Link ទៅសិស្សបាន។
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Button size="small" variant="secondary" onClick={handleSelectAllClasses}>
                                                ☑️ ជ្រើសទាំងអស់
                                            </Button>
                                            <Button size="small" variant="secondary" onClick={handleDeselectAllClasses}>
                                                ☐ លុបការជ្រើស
                                            </Button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto', padding: '0.5rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                                        {classesWithTeachers.length === 0 ? (
                                            <div style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                                                ℹ️ មិនទាន់មានថ្នាក់ណាដែលមានចាត់តាំងគ្រូបន្ទុកថ្នាក់នៅឡើយទេ។ សូមទៅកាន់ទំព័រ Classes ដើម្បិចាត់តាំងគ្រូបន្ទុកថ្នាក់។
                                            </div>
                                        ) : (
                                            classesWithTeachers.map(cls => {
                                                const teachers = cls.teacher_assignments?.map(a => a.teacher?.name).filter(Boolean) || [];
                                                const isChecked = selectedOpenClassIds.includes(cls.id);

                                                return (
                                                    <label key={cls.id} style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.65rem 0.85rem',
                                                        background: isChecked ? '#f0fdf4' : '#ffffff',
                                                        border: isChecked ? '1px solid #86efac' : '1px solid #cbd5e1',
                                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s ease'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handleToggleClassSelection(cls.id)}
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#16a34a' }}
                                                            />
                                                            <div>
                                                                <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>
                                                                    🏫 ថ្នាក់ {cls.name} (Grade {cls.grade_level})
                                                                </strong>
                                                                <span style={{ fontSize: '0.78rem', color: isChecked ? '#15803d' : '#475569', fontWeight: '600' }}>
                                                                    👑 គ្រូបន្ទុក ៖ {teachers.join(', ')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopyClassRegisterLink(cls); }}
                                                            title="ចម្លង Link ចុះឈ្មោះ"
                                                            style={{
                                                                background: '#ffffff', color: '#0284c7', border: '1px solid #bae6fd',
                                                                borderRadius: '6px', padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            🔗 Link
                                                        </button>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleSaveHomeroomRegistrationBatch}
                                        disabled={savingBatch}
                                        style={{ width: '100%', padding: '0.75rem', fontWeight: '800', backgroundColor: '#4f46e5' }}
                                    >
                                        {savingBatch ? 'កំពុងរក្សាទុក...' : `💾 រក្សាទុកការកំណត់សម្រាប់ថ្នាក់ដែលបានជ្រើសរើស (${selectedOpenClassIds.length}/${classList.length} ថ្នាក់)`}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* MODALS */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => { if (!isSubmitting) { setIsModalOpen(false); setEditingId(null); } }}
                title={`${editingId ? '✏️ កែប្រែ' : '➕ បន្ថែមថ្មី'} ${activeTab === 'academic_years' ? 'ឆ្នាំសិក្សា' : activeTab === 'semesters' ? 'ឆមាស' : 'ការវាយតម្លៃ'}`}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>បោះបង់ (Cancel)</Button>
                        <Button onClick={activeTab === 'academic_years' ? handleAySubmit : activeTab === 'semesters' ? handleSemSubmit : handleAssSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'កំពុងរក្សាទុក...' : '💾 រក្សាទុក (Save)'}
                        </Button>
                    </>
                }
            >
                {/* Academic Year Form */}
                {activeTab === 'academic_years' && (
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Input label="ឈ្មោះឆ្នាំសិក្សា (ឧទាហរណ៍ ៖ 2026-2027)" value={ayForm.name} onChange={(e) => setAyForm({...ayForm, name: e.target.value})} required />
                        <Input label="ថ្ងៃចាប់ផ្តើម" type="date" value={ayForm.start_date} onChange={(e) => setAyForm({...ayForm, start_date: e.target.value})} required />
                        <Input label="ថ្ងៃបញ្ចប់" type="date" value={ayForm.end_date} onChange={(e) => setAyForm({...ayForm, end_date: e.target.value})} required />
                    </form>
                )}

                {/* Semester Form */}
                {activeTab === 'semesters' && (
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>ឆ្នាំសិក្សា (Academic Year)</label>
                            <select 
                                value={semForm.academic_year_id} 
                                onChange={(e) => setSemForm({...semForm, academic_year_id: e.target.value})} 
                                required
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            >
                                <option value="">-- ជ្រើសរើសឆ្នាំសិក្សា --</option>
                                {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                            </select>
                        </div>
                        <Input label="ឈ្មោះឆមាស (ឧទាហរណ៍ ៖ ឆមាសទី១)" value={semForm.name} onChange={(e) => setSemForm({...semForm, name: e.target.value})} required />
                        <Input label="ថ្ងៃចាប់ផ្តើម" type="date" value={semForm.start_date} onChange={(e) => setSemForm({...semForm, start_date: e.target.value})} required />
                        <Input label="ថ្ងៃបញ្ចប់" type="date" value={semForm.end_date} onChange={(e) => setSemForm({...semForm, end_date: e.target.value})} required />
                    </form>
                )}

                {/* Assessment Form */}
                {activeTab === 'assessments' && (
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>ឆមាស (Semester)</label>
                            <select 
                                value={assForm.semester_id} 
                                onChange={(e) => setAssForm({...assForm, semester_id: e.target.value})} 
                                required
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            >
                                <option value="">-- ជ្រើសរើសឆមាស --</option>
                                {semesters.map(sem => <option key={sem.id} value={sem.id}>{sem.name} ({sem.academic_year?.name})</option>)}
                            </select>
                        </div>
                        <Input label="ឈ្មោះការវាយតម្លៃ (ឧទាហរណ៍ ៖ ប្រឡងប្រចាំខែមករា)" value={assForm.name} onChange={(e) => setAssForm({...assForm, name: e.target.value})} required />
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>ប្រភេទការវាយតម្លៃ (Type)</label>
                            <select 
                                value={assForm.type} 
                                onChange={(e) => setAssForm({...assForm, type: e.target.value})} 
                                required
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            >
                                <option value="monthly">ប្រចាំខែ (Monthly)</option>
                                <option value="midterm">ពាក់កណ្តាលឆមាស (Midterm)</option>
                                <option value="final">ប្រឡងឆមាស (Final)</option>
                            </select>
                        </div>

                        {assForm.type === 'monthly' && (
                            <Input label="ឈ្មោះខែ (ឧទាហរណ៍ ៖ មករា / January)" value={assForm.month} onChange={(e) => setAssForm({...assForm, month: e.target.value})} />
                        )}
                        
                        {(assForm.type === 'midterm' || assForm.type === 'final') && (
                            <Input label="កាលបរិច្ឆេទប្រឡង" type="date" value={assForm.date} onChange={(e) => setAssForm({...assForm, date: e.target.value})} />
                        )}

                        <Input label="ពិន្ទុអតិបរមា (ឧទាហរណ៍ ៖ 100)" type="number" value={assForm.max_score} onChange={(e) => setAssForm({...assForm, max_score: e.target.value})} required />
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default Settings;
