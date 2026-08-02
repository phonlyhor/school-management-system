import { useState, useEffect } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { FiUsers, FiUserCheck, FiBookOpen, FiMonitor, FiCheckCircle, FiClock, FiXCircle, FiUserPlus, FiPlusCircle } from 'react-icons/fi';
import { getAdminDashboard } from '../../services/dashboardService';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { lang, t } = useLanguage();
    const todayFormatted = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayFormatted);
    const [data, setData] = useState({
        users: { teachers: 0, students: 0, parents: 0 },
        classes: 0,
        subjects: 0,
        buildings: 0,
        admin_offices: 0,
        total_rooms: 0,
        attendance_today: { present: 0, absent: 0, late: 0, permission: 0, total: 0 },
        recent_students: [],
        recent_teachers: [],
        class_distribution: [],
        today_schedules: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const res = await getAdminDashboard(selectedDate);
                setData(res);
            } catch (err) {
                console.error("Failed to load admin dashboard data:", err);
                setError(t("មានបញ្ហាក្នុងការទាញយកទិន្នន័យផ្ទាំងបញ្ជា Admin", "Failed to load admin dashboard data."));
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [selectedDate]);

    const getImageUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
        return `${baseUrl}/${photo.replace(/^\//, '')}`;
    };

    const studentColumns = [
        { header: t('កូដសិស្ស', 'Student Code'), accessor: 'student_code' },
        { 
            header: t('ឈ្មោះសិស្ស', 'Student Name'), 
            render: (row) => {
                const img = getImageUrl(row.photo);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {img ? (
                            <img src={img} alt={row.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                {row.name?.charAt(0) || 'S'}
                            </div>
                        )}
                        <div>
                            <strong style={{ color: '#0f172a', display: 'block' }}>{row.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{row.email}</span>
                        </div>
                    </div>
                );
            } 
        },
        { header: t('ថ្នាក់រៀន', 'Class'), accessor: 'class_name' },
        { 
            header: t('ភេទ', 'Gender'), 
            render: (row) => (row.gender === 'female' ? t('👩 ស្រី', 'Female') : t('👨 ប្រុស', 'Male')) 
        },
        { header: t('ថ្ងៃចូលរៀន', 'Enrolled Date'), accessor: 'created_at' },
    ];

    const teacherColumns = [
        { 
            header: t('ឈ្មោះគ្រូបង្រៀន', 'Teacher Name'), 
            render: (row) => {
                const img = getImageUrl(row.photo);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {img ? (
                            <img src={img} alt={row.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                        ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#166534', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                {row.name?.charAt(0) || 'T'}
                            </div>
                        )}
                        <div>
                            <strong style={{ color: '#0f172a', display: 'block' }}>{row.name}</strong>
                        </div>
                    </div>
                );
            } 
        },
        { header: t('អាសយដ្ឋានអ៊ីមែល', 'Email Address'), accessor: 'email' },
        { header: t('ថ្ងៃចូលបម្រើការ', 'Joined Date'), accessor: 'created_at' },
    ];

    const scheduleColumns = [
        { header: t('ថ្នាក់រៀន', 'Class'), render: (row) => <strong style={{ color: '#4338ca' }}>{row.class_name}</strong> },
        { header: t('មុខវិជ្ជា', 'Subject'), render: (row) => <strong>{row.subject_name}</strong> },
        { header: t('ថ្ងៃសិក្សា', 'Day'), render: (row) => <span style={{ color: '#0369a1', fontWeight: '600' }}>{row.day_of_week || 'Today'}</span> },
        { header: t('ម៉ោងសិក្សា', 'Time'), render: (row) => `${row.start_time} - ${row.end_time}` },
        { header: t('បន្ទប់', 'Room'), accessor: 'room' },
        { header: t('គ្រូបង្រៀន', 'Instructor'), accessor: 'teacher_name' }
    ];

    if (loading) return <div style={{ padding: '2rem' }}>{t("កំពុងទាញយកទិន្នន័យ...", "Loading dynamic admin dashboard...")}</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

    const users = data.users || { teachers: 0, students: 0, parents: 0 };
    const attendance = data.attendance_today || { present: 0, absent: 0, late: 0, permission: 0, total: 0 };
    const recentStudents = data.recent_students || [];
    const recentTeachers = data.recent_teachers || [];
    const classDistribution = data.class_distribution || [];
    const todaySchedules = data.today_schedules || [];

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.6rem', color: '#0f172a', fontWeight: '800' }}>
                        {t("ផ្ទាំងបញ្ជា វិទ្យាល័យ ហ៊ុន សែន ចំការលើ 🏫", "Hun Sen Chamkar Loe High School Dashboard 🏫")}
                    </h1>
                    <p style={{ color: '#64748b', margin: '0.3rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("ទិន្នន័យស្ថិតិជាក់ស្តែង កាលវិភាគប្រចាំថ្ងៃ សិស្សចុះឈ្មោះថ្មី និង ការគ្រប់គ្រងទូទៅ។", "Real-time stats, daily timetables, recent enrollments, and administrative management.")}
                    </p>
                </div>
            </div>

            {/* Dynamic Stat Cards */}
            <div className="dashboard-grid">
                <StatCard 
                    title={t("សិស្សសរុប", "Total Students")} 
                    value={users.students || 0} 
                    icon={<FiUsers size={24} />} 
                    color="var(--primary-color)" 
                />
                <StatCard 
                    title={t("គ្រូបង្រៀនសរុប", "Total Teachers")} 
                    value={users.teachers || 0} 
                    icon={<FiMonitor size={24} />} 
                    color="var(--secondary-color)" 
                />
                <StatCard 
                    title={t("អគារសិក្សា", "School Buildings")} 
                    value={data.buildings || 0} 
                    icon={<FiBookOpen size={24} />} 
                    color="#4338ca" 
                />
                <StatCard 
                    title={t("បន្ទប់ទីចាត់ការ", "Admin Offices")} 
                    value={data.admin_offices || 0} 
                    icon={<FiUserCheck size={24} />} 
                    color="var(--warning-color)" 
                />
            </div>

            {/* Attendance Overview Card */}
            <div style={{ marginTop: '1.5rem', background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📊 {t("សង្ខេបវត្តមាន", "Attendance Overview")} 
                        <span style={{ fontSize: '0.78rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '12px', background: selectedDate === todayFormatted ? '#e0e7ff' : '#f1f5f9', color: selectedDate === todayFormatted ? '#3730a3' : '#475569' }}>
                            {selectedDate === todayFormatted ? t("ថ្ងៃនេះ", "Today") : selectedDate}
                        </span>
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label htmlFor="attendance-date-picker" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                            {t("ជ្រើសរើសថ្ងៃ៖", "Select Date:")}
                        </label>
                        <input 
                            id="attendance-date-picker"
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                                color: '#1e293b',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        />
                        {selectedDate !== todayFormatted && (
                            <button
                                type="button"
                                onClick={() => setSelectedDate(todayFormatted)}
                                style={{
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f8fafc',
                                    fontSize: '0.8rem',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                {t("ថ្ងៃនេះ", "Today")}
                            </button>
                        )}
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <FiCheckCircle size={32} color="#16a34a" />
                        <div>
                            <span style={{ fontSize: '0.85rem', color: '#15803d', display: 'block', fontWeight: '500' }}>{t("វត្តមាន (មកសិក្សា)", "Present")}</span>
                            <strong style={{ fontSize: '1.4rem', color: '#166534' }}>{attendance.present || 0}</strong>
                        </div>
                    </div>
                    <div style={{ background: '#fffbe6', padding: '1rem', borderRadius: '8px', border: '1px solid #ffe58f', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <FiClock size={32} color="#d97706" />
                        <div>
                            <span style={{ fontSize: '0.85rem', color: '#b45309', display: 'block', fontWeight: '500' }}>{t("យឺត / សុំច្បាប់", "Late / Permission")}</span>
                            <strong style={{ fontSize: '1.4rem', color: '#92400e' }}>{(attendance.late || 0) + (attendance.permission || 0)}</strong>
                        </div>
                    </div>
                    <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <FiXCircle size={32} color="#dc2626" />
                        <div>
                            <span style={{ fontSize: '0.85rem', color: '#b91c1c', display: 'block', fontWeight: '500' }}>{t("អវត្តមាន (អត់ច្បាប់)", "Absent")}</span>
                            <strong style={{ fontSize: '1.4rem', color: '#991b1b' }}>{attendance.absent || 0}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Timetable Section */}
            <div style={{ marginTop: '1.5rem' }}>
                <Card title={`🗓️ ${t("កាលវិភាគបង្រៀន/រៀនថ្ងៃនេះ", "Today's Class Timetable")}`}>
                    {todaySchedules.length === 0 ? (
                        <div style={{ padding: '1.2rem', color: '#64748b', textAlign: 'center' }}>
                            <p style={{ margin: '0 0 0.4rem 0', fontWeight: '500' }}>{t("មិនមានម៉ោងសិក្សាសម្រាប់ថ្ងៃនេះទេ", "No active classes scheduled for today.")}</p>
                            <span style={{ fontSize: '0.85rem' }}>{t("ពិនិត្យមើលកាលវិភាគពេញលេញក្នុងផ្នែកគ្រប់គ្រងកាលវិភាគ", "Check full class timetables in the schedule management section.")}</span>
                        </div>
                    ) : (
                        <>
                            <Table columns={scheduleColumns} data={todaySchedules} />
                            <Button 
                                variant="secondary" 
                                onClick={() => navigate('/admin/schedule')} 
                                style={{ marginTop: '0.85rem', width: '100%' }}
                            >
                                🗓️ {t("គ្រប់គ្រងកាលវិភាគពេញលេញ", "Manage Full Timetable")}
                            </Button>
                        </>
                    )}
                </Card>
            </div>

            {/* Recent Tables & Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card title={`🎓 ${t("សិស្សចុះឈ្មោះថ្មីៗ", "Newly Enrolled Students")}`}>
                        {recentStudents.length === 0 ? (
                            <p style={{ color: '#64748b', fontStyle: 'italic' }}>{t("មិនទាន់មានទិន្នន័យសិស្សនៅឡើយទេ", "No student records found.")}</p>
                        ) : (
                            <Table columns={studentColumns} data={recentStudents} />
                        )}
                    </Card>

                    <Card title={`👨‍🏫 ${t("បញ្ជីគ្រូបង្រៀន", "Teachers List")}`}>
                        {recentTeachers.length === 0 ? (
                            <p style={{ color: '#64748b', fontStyle: 'italic' }}>{t("មិនទាន់មានទិន្នន័យគ្រូបង្រៀននៅឡើយទេ", "No teacher records found.")}</p>
                        ) : (
                            <Table columns={teacherColumns} data={recentTeachers} />
                        )}
                    </Card>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Quick Administrative Actions */}
                    <Card title={`⚡ ${t("សកម្មភាពរហ័ស", "Quick Actions")}`}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <Button 
                                variant="primary" 
                                onClick={() => navigate('/admin/students')} 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
                            >
                                <FiUserPlus /> {t("គ្រប់គ្រង & បន្ថែមសិស្ស", "Manage & Add Student")}
                            </Button>
                            <Button 
                                variant="secondary" 
                                onClick={() => navigate('/admin/teachers')} 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
                            >
                                <FiUserPlus /> {t("គ្រប់គ្រង & បន្ថែមគ្រូ", "Manage & Add Teacher")}
                            </Button>
                            <Button 
                                variant="secondary" 
                                onClick={() => navigate('/admin/classes')} 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
                            >
                                <FiPlusCircle /> {t("គ្រប់គ្រងថ្នាក់រៀន", "Manage Classes")}
                            </Button>
                            <Button 
                                variant="secondary" 
                                onClick={() => navigate('/admin/buildings')} 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
                            >
                                🏢 {t("គ្រប់គ្រងអគារ & បន្ទប់", "Manage Buildings & Offices")}
                            </Button>
                            <Button 
                                variant="secondary" 
                                onClick={() => navigate('/admin/teacher-assignments')} 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
                            >
                                🔗 {t("ចាត់តាំងគ្រូបង្រៀនតាមថ្នាក់", "Assign Teacher to Class")}
                            </Button>
                            <Button 
                                variant="secondary" 
                                onClick={() => navigate('/admin/schedule')} 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
                            >
                                🗓️ {t("គ្រប់គ្រងកាលវិភាគ", "Manage Timetable")}
                            </Button>
                        </div>
                    </Card>

                    {/* Class Enrolled Distribution */}
                    <Card title={`🏫 ${t("សង្ខេបថ្នាក់រៀន", "Classes Overview")}`}>
                        {classDistribution.length === 0 ? (
                            <p style={{ color: '#64748b', fontStyle: 'italic' }}>{t("មិនទាន់មានទិន្នន័យថ្នាក់នៅឡើយទេ", "No class data available.")}</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {classDistribution.map(cls => (
                                    <div key={cls.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div>
                                            <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.9rem' }}>{cls.name}</strong>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{cls.grade_level}</span>
                                        </div>
                                        <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
                                            {cls.students_count} {t("សិស្ស", "Students")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;