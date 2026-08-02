import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useLanguage } from '../../context/LanguageContext';
import { getClasses } from '../../services/classService';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StudentRegistrationManager = () => {
    const { t } = useLanguage();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'open', 'closed'
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
    const [togglingClassId, setTogglingClassId] = useState(null);

    const fetchClassesData = async () => {
        setLoading(true);
        try {
            const res = await getClasses();
            setClasses(res.data.classes || []);
        } catch (err) {
            console.error("Failed to load classes:", err);
            toast.error(t("មានបញ្ហាក្នុងការទាញយកទិន្នន័យថ្នាក់", "Failed to load classes data."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassesData();
    }, []);

    const handleCopyClassRegisterLink = (cls) => {
        const url = `${window.location.origin}/register/student?class_id=${cls.id}`;
        navigator.clipboard.writeText(url);
        toast.success(t(`បានចម្លង Link ចុះឈ្មោះសម្រាប់ថ្នាក់ ${cls.name} រួចរាល់! អាចផ្ញើជូនគ្រូបន្ទុកថ្នាក់ ឬ សិស្សបាន`, `Copied registration link for class ${cls.name}!`));
    };

    const handleToggleRegistration = async (cls) => {
        setTogglingClassId(cls.id);
        try {
            const res = await api.post(`/teacher/classes/${cls.id}/toggle-registration`);
            toast.success(res.data.message);
            fetchClassesData();
        } catch (err) {
            toast.error(err.response?.data?.message || t("មានបញ្ហាក្នុងការកំណត់ការចុះឈ្មោះ", "Failed to update registration status"));
        } finally {
            setTogglingClassId(null);
        }
    };

    const filteredClasses = classes.filter(cls => {
        const matchesSearch = cls.name?.toLowerCase().includes(search.toLowerCase()) ||
            cls.grade_level?.toString().includes(search);
        
        const isOpen = cls.is_registration_open !== false;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'open' && isOpen) ||
            (statusFilter === 'closed' && !isOpen);

        return matchesSearch && matchesStatus;
    });

    const openCount = classes.filter(c => c.is_registration_open !== false).length;
    const closedCount = classes.filter(c => c.is_registration_open === false).length;

    const columns = [
        {
            header: t("ឈ្មោះថ្នាក់", "Class Name"),
            accessor: 'name',
            cell: (cls) => (
                <div>
                    <strong style={{ fontSize: '1rem', color: '#0f172a' }}>🏫 {cls.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>
                        Grade {cls.grade_level} • {cls.academic_year}
                    </span>
                </div>
            )
        },
        {
            header: t("គ្រូបន្ទុកថ្នាក់", "Homeroom Teacher"),
            accessor: 'homeroom',
            cell: (cls) => {
                const teachers = cls.teacher_assignments?.map(a => a.teacher?.name).filter(Boolean) || [];
                return (
                    <span style={{ fontWeight: '600', color: teachers.length ? '#3730a3' : '#94a3b8' }}>
                        👑 {teachers.length ? teachers.join(', ') : t("មិនទាន់មាន", "Unassigned")}
                    </span>
                );
            }
        },
        {
            header: t("ចំនួនសិស្ស", "Student Count"),
            accessor: 'students',
            cell: (cls) => (
                <span style={{ fontWeight: '700', color: '#0369a1' }}>
                    👥 {cls.students?.length || 0} {t("នាក់", "Students")}
                </span>
            )
        },
        {
            header: t("ស្ថានភាពចុះឈ្មោះ", "Registration Status"),
            accessor: 'status',
            cell: (cls) => {
                const isOpen = cls.is_registration_open !== false;
                return (
                    <span style={{
                        padding: '0.3rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700',
                        backgroundColor: isOpen ? '#dcfce7' : '#fee2e2',
                        color: isOpen ? '#15803d' : '#991b1b',
                        border: isOpen ? '1px solid #86efac' : '1px solid #fca5a5'
                    }}>
                        {isOpen ? '🟢 កំពុងបើក' : '🔴 បានបិទ'}
                    </span>
                );
            }
        },
        {
            header: t("សកម្មភាព", "Actions"),
            accessor: 'actions',
            cell: (cls) => {
                const isOpen = cls.is_registration_open !== false;
                return (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                            size="small"
                            variant="secondary"
                            onClick={() => handleCopyClassRegisterLink(cls)}
                        >
                            🔗 {t("Link ចុះឈ្មោះ", "Copy Link")}
                        </Button>
                        <Button
                            size="small"
                            onClick={() => handleToggleRegistration(cls)}
                            disabled={togglingClassId === cls.id}
                            style={{
                                backgroundColor: isOpen ? '#fee2e2' : '#dcfce7',
                                color: isOpen ? '#dc2626' : '#15803d',
                                borderColor: isOpen ? '#fca5a5' : '#86efac'
                            }}
                        >
                            {togglingClassId === cls.id ? "..." : (isOpen ? '🔒 ចុចដើម្បិបិទ' : '🔓 ចុចដើម្បិបើក')}
                        </Button>
                    </div>
                );
            }
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: '800', color: '#0f172a' }}>
                        📝 {t("គ្រប់គ្រងការចុះឈ្មោះសិស្សថ្មី", "Student Registration Control")}
                    </h1>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                        {t("គ្រប់គ្រង និង បើក/បិទ Link ចុះឈ្មោះសម្រាប់ថ្នាក់រៀននីមួយៗ", "Manage and open/close student self-registration links per class.")}
                    </p>
                </div>
                
                {/* View Mode Toggle */}
                <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
                    <button
                        onClick={() => setViewMode('cards')}
                        style={{
                            border: 'none', background: viewMode === 'cards' ? '#ffffff' : 'transparent',
                            color: viewMode === 'cards' ? '#4f46e5' : '#64748b',
                            padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer'
                        }}
                    >
                        🎴 {t("កាតថ្នាក់រៀន", "Cards View")}
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        style={{
                            border: 'none', background: viewMode === 'table' ? '#ffffff' : 'transparent',
                            color: viewMode === 'table' ? '#4f46e5' : '#64748b',
                            padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer'
                        }}
                    >
                        📋 {t("តារាង", "Table View")}
                    </button>
                </div>
            </div>

            {/* Overview Summary Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <Card style={{ borderLeft: '4px solid #4f46e5', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>🏫 {t("ថ្នាក់រៀនសរុប", "Total Classes")}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>{classes.length}</div>
                </Card>
                <Card style={{ borderLeft: '4px solid #16a34a', backgroundColor: '#f0fdf4' }}>
                    <div style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: '600' }}>🟢 {t("ថ្នាក់កំពុងបើកចុះឈ្មោះ", "Open Registrations")}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#166534', marginTop: '0.2rem' }}>{openCount}</div>
                </Card>
                <Card style={{ borderLeft: '4px solid #dc2626', backgroundColor: '#fef2f2' }}>
                    <div style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: '600' }}>🔴 {t("ថ្នាក់បានបិទចុះឈ្មោះ", "Closed Registrations")}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#991b1b', marginTop: '0.2rem' }}>{closedCount}</div>
                </Card>
            </div>

            {/* Search & Filter Controls */}
            <Card style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                        <Input
                            placeholder={t("ស្វែងរកឈ្មោះថ្នាក់...", "Search class name or grade...")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ margin: 0 }}
                        />
                    </div>
                    <div style={{ minWidth: '200px' }}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                width: '100%', height: '42px', padding: '0.6rem',
                                border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a',
                                fontWeight: '700', backgroundColor: '#ffffff'
                            }}
                        >
                            <option value="all">🔍 {t("គ្រប់ស្ថានភាព (All Status)", "All Status")}</option>
                            <option value="open">🟢 {t("ថ្នាក់កំពុងបើក (Open Only)", "Open Only")}</option>
                            <option value="closed">🔴 {t("ថ្នាក់បានបិទ (Closed Only)", "Closed Only")}</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* MAIN DATA VIEW */}
            {loading ? (
                <Card style={{ textAlign: 'center', padding: '2rem' }}>{t("កំពុងទាញយកទិន្នន័យ...", "Loading data...")}</Card>
            ) : filteredClasses.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    {t("មិនមានថ្នាក់រៀនសមស្របតាមការស្វែងរកឡើយ", "No classes found.")}
                </Card>
            ) : viewMode === 'table' ? (
                <Card style={{ padding: '0', overflow: 'hidden' }}>
                    <Table columns={columns} data={filteredClasses} />
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {filteredClasses.map(cls => {
                        const isOpen = cls.is_registration_open !== false;
                        const teachers = cls.teacher_assignments?.map(a => a.teacher?.name).filter(Boolean) || [];

                        return (
                            <Card key={cls.id} style={{ border: isOpen ? '1px solid #cbd5e1' : '1px solid #fca5a5' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '800' }}>
                                            🏫 {cls.name}
                                        </h3>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                                            Grade {cls.grade_level} • {cls.academic_year}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '700',
                                        backgroundColor: isOpen ? '#dcfce7' : '#fee2e2',
                                        color: isOpen ? '#15803d' : '#991b1b',
                                        border: isOpen ? '1px solid #86efac' : '1px solid #fca5a5'
                                    }}>
                                        {isOpen ? '🟢 កំពុងបើក' : '🔴 បានបិទ'}
                                    </span>
                                </div>

                                <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                                    <div>👑 <strong>{t("គ្រូបន្ទុកថ្នាក់", "Homeroom Teacher")} ៖</strong> {teachers.length ? teachers.join(', ') : t("មិនទាន់មាន", "Unassigned")}</div>
                                    <div>👥 <strong>{t("សិស្សក្នុងថ្នាក់", "Students")} ៖</strong> {cls.students?.length || 0} {t("នាក់", "students")}</div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                                    <Button
                                        size="small"
                                        variant="secondary"
                                        onClick={() => handleCopyClassRegisterLink(cls)}
                                        style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }}
                                    >
                                        🔗 {t("Link ចុះឈ្មោះ", "Copy Link")}
                                    </Button>
                                    <Button
                                        size="small"
                                        onClick={() => handleToggleRegistration(cls)}
                                        disabled={togglingClassId === cls.id}
                                        style={{
                                            flex: 1,
                                            backgroundColor: isOpen ? '#fee2e2' : '#dcfce7',
                                            color: isOpen ? '#dc2626' : '#15803d',
                                            borderColor: isOpen ? '#fca5a5' : '#86efac',
                                            fontWeight: '700'
                                        }}
                                    >
                                        {togglingClassId === cls.id ? "..." : (isOpen ? '🔒 ចុចដើម្បិបិទ' : '🔓 ចុចដើម្បិបើក')}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentRegistrationManager;
