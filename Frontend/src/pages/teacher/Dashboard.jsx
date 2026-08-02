import { useState, useEffect } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { FiBook, FiUsers, FiCalendar, FiCheckSquare, FiAward } from 'react-icons/fi';
import { getTeacherDashboard } from '../../services/dashboardService';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
    const { lang, t } = useLanguage();
    const [data, setData] = useState({
        teacher: {},
        stats: {
            total_classes: 0,
            total_subjects: 0,
            total_students: 0,
            today_attendance_count: 0,
            today_attendance_rate: '0%'
        },
        classes: [],
        subjects: [],
        today_schedules: [],
        weekly_schedules: [],
        recent_scores: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const res = await getTeacherDashboard();
                setData(res.data || res);
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
                setError(t("មានបញ្ហាក្នុងការទាញយកទិន្នន័យផ្ទាំងបញ្ជាគ្រូបង្រៀន", "Failed to load dashboard data."));
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const isTimePassed = (endTimeStr) => {
        if (!endTimeStr) return false;
        const now = new Date();
        const parts = endTimeStr.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1] || '0', 10);
        if (isNaN(h)) return false;
        const endMinutes = h * 60 + m;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        return nowMinutes >= endMinutes;
    };

    const scheduleColumns = [
        { header: t('ថ្នាក់រៀន', 'Class'), render: (row) => <strong>{row.class_name}</strong> },
        { header: t('មុខវិជ្ជា', 'Subject'), render: (row) => row.subject_name },
        { header: t('ម៉ោងសិក្សា', 'Time'), render: (row) => `${row.start_time} - ${row.end_time}` },
        { header: t('បន្ទប់', 'Room'), render: (row) => row.room || 'N/A' },
        { 
            header: t('ស្ថានភាព', 'Status'), 
            render: (row) => {
                const done = isTimePassed(row.end_time);
                return done ? (
                    <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        ✅ {t("បង្រៀនចប់ហើយ", "Finished")}
                    </span>
                ) : (
                    <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        ⏳ {t("ម៉ោងបង្រៀន", "Scheduled")}
                    </span>
                );
            }
        }
    ];

    const performanceColumns = [
        { 
            header: t('ឈ្មោះសិស្ស', 'Student Name'), 
            render: (row) => (
                <div>
                    <strong>{row.student_name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t('អត្តលេខ:', 'ID:')} {row.student_code}</div>
                </div>
            ) 
        },
        { header: t('ថ្នាក់រៀន', 'Class'), accessor: 'class_name' },
        { header: t('មុខវិជ្ជា', 'Subject'), accessor: 'subject_name' },
        { header: t('ការវាយតម្លៃ', 'Assessment'), accessor: 'assessment_name' },
        { header: t('ពិន្ទុ', 'Score'), render: (row) => `${row.score} / ${row.max_score}` },
        { 
            header: t('និទ្ទេស', 'Grade'), 
            render: (row) => {
                const colors = { A: '#16a34a', B: '#2563eb', C: '#d97706', D: '#ea580c', F: '#dc2626' };
                return (
                    <span style={{ 
                        fontWeight: '700', 
                        color: colors[row.grade] || '#334155',
                        backgroundColor: '#f1f5f9',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.9rem'
                    }}>
                        {row.grade || 'N/A'}
                    </span>
                );
            } 
        },
    ];

    if (loading) return <div style={{ padding: '2rem' }}>{t("កំពុងទាញយកទិន្នន័យ...", "Loading dynamic teacher dashboard...")}</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

    const teacher = data.teacher || {};
    const stats = data.stats || {};
    const todaySchedules = data.today_schedules || [];
    const recentScores = data.recent_scores || [];
    const classes = data.classes || [];

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("សូមស្វាគមន៍មកវិញ", "Welcome back")}, {teacher.name || t('លោកគ្រូ/អ្នកគ្រូ', 'Teacher')} 👋</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("នេះជាព័ត៌មានសង្ខេបជាក់ស្តែងនៃថ្នាក់បង្រៀន វត្តមានសិស្ស និង វឌ្ឍនភាពសិក្សាថ្ងៃនេះ។", "Here is your real-time overview for today's classes, students, and academic progress.")}
                    </p>
                </div>
            </div>

            {/* Dynamic Stat Cards */}
            <div className="dashboard-grid">
                <StatCard 
                    title={t("ថ្នាក់បង្រៀនសរុប", "Assigned Classes")} 
                    value={stats.total_classes} 
                    icon={<FiBook size={24} />} 
                    color="var(--primary-color)" 
                />
                <StatCard 
                    title={t("សិស្សសរុបដែលបង្រៀន", "Total Students Taught")} 
                    value={stats.total_students} 
                    icon={<FiUsers size={24} />} 
                    color="var(--secondary-color)" 
                />
                <StatCard 
                    title={t("មុខវិជ្ជាបង្រៀន", "Taught Subjects")} 
                    value={stats.total_subjects} 
                    icon={<FiAward size={24} />} 
                    color="#8b5cf6" 
                />
                <StatCard 
                    title={t("អត្រាវត្តមានថ្ងៃនេះ", "Today's Attendance Rate")} 
                    value={stats.today_attendance_rate} 
                    icon={<FiCalendar size={24} />} 
                    color="var(--success-color)" 
                />
            </div>

            {/* Today's Schedule & My Classes Quick Access */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                <Card title={`📅 ${t("កាលវិភាគបង្រៀនថ្ងៃនេះ", "Today's Teaching Schedule")}`}>
                    {todaySchedules.length > 0 && todaySchedules.every(s => isTimePassed(s.end_time)) && (
                        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🎉</span>
                            <span>{t("ថ្ងៃនេះបង្រៀនចប់ហើយ! សូមសម្រាកឲ្យបានសប្បាយរីករាយ។", "All classes for today have been completed! Have a great rest.")}</span>
                        </div>
                    )}
                    {todaySchedules.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>{t("មិនមានម៉ោងបង្រៀនសម្រាប់ថ្ងៃនេះទេ", "No classes scheduled for today.")}</p>
                            <span style={{ fontSize: '0.85rem' }}>{t("សូមរីករាយជាមួយពេលវេលាត្រៀមកិច្ចតែងការបង្រៀន!", "Enjoy your class preparation time!")}</span>
                        </div>
                    ) : (
                        <Table columns={scheduleColumns} data={todaySchedules} />
                    )}
                </Card>

                <Card title={`🏫 ${t("ថ្នាក់បង្រៀនរបស់ខ្ញុំ", "My Assigned Classes")}`}>
                    {classes.length === 0 ? (
                        <p style={{ color: '#64748b', fontStyle: 'italic' }}>{t("មិនទាន់បានចាត់តាំងថ្នាក់នៅឡើយទេ", "No classes assigned yet.")}</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {classes.map(c => (
                                <div 
                                    key={c.id} 
                                    style={{ 
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'
                                    }}
                                >
                                    <div>
                                        <strong style={{ color: '#0f172a', display: 'block' }}>{c.name}</strong>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{t('កម្រិតថ្នាក់', 'Grade')} {c.grade_level} • {c.students_count || 0} {t('សិស្ស', 'Students')}</span>
                                    </div>
                                    <Button size="small" variant="secondary" onClick={() => navigate('/teacher/classes')}>
                                        {t("គ្រប់គ្រងថ្នាក់", "Manage Class")}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            {/* Recent Student Performance Table */}
            <div style={{ marginTop: '1.5rem' }}>
                <Card title={`📊 ${t("ពិន្ទុវាយតម្លៃសិស្សថ្មីៗ", "Recent Student Assessment Scores")}`}>
                    {recentScores.length === 0 ? (
                        <p style={{ color: '#64748b', fontStyle: 'italic', padding: '1rem 0' }}>
                            {t("មិនទាន់មានការបញ្ចូលពិន្ទុសិស្សនៅឡើយទេ។ ចូលទៅកាន់ ", "No student scores recorded yet. Go to ")}
                            <strong style={{ color: '#3b82f6', cursor: 'pointer' }} onClick={() => navigate('/teacher/scores')}>
                                {t("បញ្ចូលពិន្ទុ", "Input Scores")}
                            </strong>
                            {t(" ដើម្បីបញ្ចូលនិទ្ទេស។", " to add grades.")}
                        </p>
                    ) : (
                        <Table columns={performanceColumns} data={recentScores} />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default TeacherDashboard;
