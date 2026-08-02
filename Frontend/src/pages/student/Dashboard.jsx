import { useState, useEffect } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import ProfileCard from '../../components/dashboard/ProfileCard';
import Button from '../../components/common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { FiCalendar, FiTarget, FiBookOpen, FiAward } from 'react-icons/fi';
import { getStudentDashboard } from '../../services/dashboardService';
import { useNavigate } from 'react-router-dom';

import StudentIDCardModal from '../../components/common/StudentIDCardModal';

const StudentDashboard = () => {
    const { lang, t } = useLanguage();
    const [showIdCardModal, setShowIdCardModal] = useState(false);
    const [data, setData] = useState({
        student: {},
        class: {},
        attendance: {},
        summary: {},
        today_schedules: [],
        recent_scores: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const res = await getStudentDashboard();
                setData(res.data || res);
            } catch (err) {
                console.error("Failed to load student dashboard data:", err);
                setError(t("មានបញ្ហាក្នុងការទាញយកទិន្នន័យផ្ទាំងបញ្ជាសិស្ស", "Failed to load dashboard data."));
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const scheduleColumns = [
        { header: t('មុខវិជ្ជា', 'Subject'), render: (row) => <strong>{row.subject_name}</strong> },
        { header: t('ម៉ោងសិក្សា', 'Time'), render: (row) => `${row.start_time} - ${row.end_time}` },
        { header: t('បន្ទប់', 'Room'), render: (row) => row.room || 'N/A' },
        { header: t('គ្រូបង្រៀន', 'Instructor'), render: (row) => row.teacher_name || 'N/A' },
    ];

    const scoreColumns = [
        { header: t('មុខវិជ្ជា', 'Subject'), render: (row) => <strong>{row.subject_name}</strong> },
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
                        fontSize: '0.85rem'
                    }}>
                        {row.grade || 'N/A'}
                    </span>
                );
            } 
        },
    ];

    if (loading) return <div style={{ padding: '2rem' }}>{t("កំពុងទាញយកទិន្នន័យ...", "Loading student dashboard...")}</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

    const student = data.student || {};
    const cls = data.class || {};
    const attendance = data.attendance || {};
    const summary = data.summary || {};
    const todaySchedules = data.today_schedules || [];
    const recentScores = data.recent_scores || [];

    const studentProfileMeta = [
        { label: t('ថ្នាក់រៀន', 'Class'), value: cls.name || t('មិនទាន់បានចាត់', 'Not Assigned') },
        { label: t('កម្រិតថ្នាក់', 'Grade Level'), value: cls.grade_level || 'N/A' },
        { label: t('គ្រូបន្ទុកថ្នាក់', 'Homeroom Teacher'), value: cls.homeroom_teacher || 'N/A' },
    ];

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">{t("សូមស្វាគមន៍មកវិញ", "Welcome back")}, {student.name || t('សិស្ស', 'Student')} 👋</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("ព័ត៌មានសង្ខេបជាក់ស្តែងអំពីការសិក្សា កាលវិភាគ និង លទ្ធផលវាយតម្លៃពិន្ទុថ្មីៗ។", "Your real-time academic overview, schedule, and recent assessment results.")}
                    </p>
                </div>
                <Button 
                    variant="primary" 
                    onClick={() => setShowIdCardModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700' }}
                >
                    🪪 {t("កាតសិស្ស & QR Code", "My ID Card & QR Code")}
                </Button>
            </div>

            <StudentIDCardModal 
                isOpen={showIdCardModal}
                onClose={() => setShowIdCardModal(false)}
                student={{
                    ...student,
                    class_name: cls.name,
                    grade_level: cls.grade_level
                }}
            />

            <div className="student-layout-grid">
                <ProfileCard 
                    name={student.name || t('សិស្ស', 'Student')} 
                    role={student.class_position && student.class_position !== 'Member' ? `👑 ${student.class_position}` : t('សិស្ស', 'Student')}
                    id={`${t('អត្តលេខ:', 'ID:')} ${student.student_code || 'N/A'}`}
                    photo={student.photo}
                    metaDetails={studentProfileMeta}
                />
                
                <div className="student-stat-cards">
                    <StatCard 
                        title={t("អត្រាវត្តមានសិក្សា", "Attendance Rate")} 
                        value={attendance.percentage || '0%'} 
                        icon={<FiCalendar size={24} />} 
                        color="var(--primary-color)" 
                    />
                    <StatCard 
                        title={t("ពិន្ទុមធ្យមភាគសរុប (GPA)", "Overall GPA (Est.)")} 
                        value={summary.gpa || '0.00'} 
                        icon={<FiTarget size={24} />} 
                        color="var(--secondary-color)" 
                    />
                    <StatCard 
                        title={t("ភាគរយពិន្ទុមធ្យម", "Average Score %")} 
                        value={`${summary.average_percentage || 0}%`} 
                        icon={<FiBookOpen size={24} />} 
                        color="var(--warning-color)" 
                    />
                    <StatCard 
                        title={t("តួនាទីក្នុងថ្នាក់", "Class Position")} 
                        value={student.class_position === 'Class Monitor' ? `👑 ${t("ប្រធានថ្នាក់", "Monitor")}` : student.class_position === 'Vice Monitor' ? `⭐ ${t("អនុប្រធាន", "Vice")}` : student.class_position || t("សមាជិក", "Member")} 
                        icon={<FiAward size={24} />} 
                        color="var(--info-color)" 
                    />
                </div>
            </div>

            <div className="dashboard-section" style={{ marginTop: 'var(--spacing-xl)' }}>
                <Card title={`📅 ${t("កាលវិភាគសិក្សាថ្ងៃនេះ", "Today's Class Schedule")}`}>
                    {todaySchedules.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>{t("មិនមានម៉ោងសិក្សាសម្រាប់ថ្ងៃនេះទេ", "No classes scheduled for today.")}</p>
                            <span style={{ fontSize: '0.85rem' }}>{t("សូមពិនិត្យមើលកាលវិភាគពេញលេញសម្រាប់ថ្ងៃបន្ទាប់។", "Check your full schedule for upcoming days.")}</span>
                        </div>
                    ) : (
                        <Table columns={scheduleColumns} data={todaySchedules} />
                    )}
                </Card>

                <Card title={`📊 ${t("ពិន្ទុវាយតម្លៃថ្មីៗ", "Recent Assessment Scores")}`}>
                    {recentScores.length === 0 ? (
                        <p style={{ color: '#64748b', fontStyle: 'italic', padding: '1rem 0' }}>
                            {t("មិនទាន់មានកំណត់ត្រាពិន្ទុវាយតម្លៃនៅឡើយទេ។", "No assessment scores recorded yet.")}
                        </p>
                    ) : (
                        <>
                            <Table columns={scoreColumns} data={recentScores} />
                            <Button 
                                variant="secondary" 
                                onClick={() => navigate('/student/report-card')}
                                style={{ marginTop: '1rem', width: '100%' }}
                            >
                                📜 {t("មើលសៀវភៅតាមដានលទ្ធផលសិក្សា", "View Full Report Card")}
                            </Button>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;
