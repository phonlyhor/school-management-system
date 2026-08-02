import { useState, useEffect } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import ProfileCard from '../../components/dashboard/ProfileCard';
import { useLanguage } from '../../context/LanguageContext';
import { FiUsers, FiCheckCircle, FiClock, FiCalendar } from 'react-icons/fi';
import { getParentDashboard, getParentChildren } from '../../services/parentPortalService';

const ParentDashboard = () => {
    const { lang, t } = useLanguage();
    const [children, setChildren] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('all');
    const [stats, setStats] = useState({
        parent: {},
        student: {},
        class: {},
        attendance: {},
        total_children: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initChildren = async () => {
            try {
                const res = await getParentChildren();
                setChildren(res.data.children || []);
            } catch (err) {
                console.error("Failed to load children:", err);
            }
        };
        initChildren();
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const res = await getParentDashboard(selectedStudentId);
                setStats(res.data);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
                setError(t("មានបញ្ហាក្នុងការទាញយកទិន្នន័យផ្ទាំងបញ្ជាមាតាបិតា", "Failed to load dashboard data"));
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [selectedStudentId]);

    const formatGrade = (gl) => {
        if (!gl) return '';
        return gl.toLowerCase().startsWith('grade') ? gl : `${t('កម្រិតថ្នាក់', 'Grade')} ${gl}`;
    };

    const childrenColumns = [
        { header: t('ឈ្មោះកូនសិស្ស', 'Student Name'), render: (row) => <strong>{row.user?.name}</strong> },
        { header: t('អត្តលេខ', 'Code (ID)'), accessor: 'student_code' },
        { 
            header: t('ថ្នាក់រៀន', 'Class'), 
            render: (row) => row.school_class ? `${row.school_class.name} (${formatGrade(row.school_class.grade_level)})` : 'N/A' 
        },
        { 
            header: t('គ្រូបន្ទុកថ្នាក់', 'Homeroom Teacher'), 
            render: (row) => row.school_class?.teacher_assignments?.map(a => a.teacher?.name).join(', ') || t('មិនទាន់បានចាត់', 'Not Assigned') 
        }
    ];

    if (loading && children.length === 0) return <div style={{ padding: '2rem' }}>{t("កំពុងទាញយកទិន្នន័យ...", "Loading dashboard...")}</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

    const parentProfileMeta = [
        { label: t('កូនដែលបានជ្រើសរើស', 'Selected View'), value: selectedStudentId === 'all' ? t('កូនៗទាំងអស់', 'All Children') : (stats.student?.name || '--') },
        { label: t('ចំនួនកូនសរុប', 'Total Children'), value: String(children.length || stats.total_children || 1) },
    ];

    return (
        <div style={{ width: '100%' }}>
            {/* Header Banner */}
            <div className="student-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>
                        {t("ផ្ទាំងបញ្ជាមាតាបិតាសិស្ស 👨‍👩‍👧‍👦", "Parent Dashboard 👨‍👩‍👧‍👦")}
                    </h1>
                    <p style={{ margin: '0.25rem 0 0 0', opacity: 0.88, fontSize: '0.9rem' }}>
                        {t("តាមដានវត្តមាន  calificaciones និង សកម្មភាពសិក្សារបស់កូនៗ។", "Monitor your children's academic attendance, grades, and school performance.")}
                    </p>
                </div>

                {/* Child Selector Dropdown */}
                {children.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <label style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.88rem' }}>{t('ជ្រើសរើសកូន ៖', 'Filter Child:')}</label>
                        <select 
                            value={selectedStudentId} 
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            style={{
                                padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.3)',
                                fontWeight: '700', color: '#1e1b4b', backgroundColor: '#ffffff', cursor: 'pointer'
                            }}
                        >
                            <option value="all">👨‍👩‍👧‍👦 {t("កូនៗទាំងអស់", "All Children")}</option>
                            {children.map(child => (
                                <option key={child.id} value={child.id}>
                                    👤 {child.user?.name} ({child.student_code})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Layout Grid */}
            <div className="student-layout-grid">
                <ProfileCard 
                    name={stats.parent?.name || t('មាតាបិតា', 'Parent')} 
                    role={t("មាតាបិតាសិស្ស", "Parent")}
                    id={stats.parent?.id || '---'}
                    metaDetails={parentProfileMeta}
                />
                
                <div className="student-stat-cards">
                    <StatCard 
                        title={t("ចំនួនកូនកំពុងសិក្សា", "Children Enrolled")} 
                        value={String(children.length || stats.total_children || 1)} 
                        icon={<FiUsers size={24} />} 
                        color="var(--primary-color)" 
                    />
                    <StatCard 
                        title={t("អត្រាវត្តមានសិក្សា", "Attendance Rate")} 
                        value={stats.attendance?.percentage || '0%'} 
                        icon={<FiCheckCircle size={24} />} 
                        color="#16a34a" 
                    />
                    <StatCard 
                        title={t("ចំនួនម៉ោងសិក្សាសរុប", "Total Sessions")} 
                        value={String(stats.attendance?.total || 0)} 
                        icon={<FiClock size={24} />} 
                        color="#0284c7" 
                    />
                    <StatCard 
                        title={t("ចំនួនម៉ោងអវត្តមាន", "Absent Sessions")} 
                        value={String(stats.attendance?.absent || 0)} 
                        icon={<FiCalendar size={24} />} 
                        color="#dc2626" 
                    />
                </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
                <Card title={`👨‍👩‍👧‍👦 ${t("បញ្ជីឈ្មោះកូនៗទាំងអស់", "My Children Overview")}`}>
                    <div className="table-responsive">
                        <Table columns={childrenColumns} data={children} />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ParentDashboard;
