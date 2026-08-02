import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import StatCard from '../../components/dashboard/StatCard';
import { useLanguage } from '../../context/LanguageContext';
import { FiCheckCircle, FiClock, FiXCircle, FiCalendar } from 'react-icons/fi';
import { getAllAttendances } from '../../services/attendanceService';
import { exportToCSV } from '../../utils/excelExporter';

const Attendance = () => {
    const { lang, t } = useLanguage();
    const [attendances, setAttendances] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAttendances = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getAllAttendances();
            setAttendances(res.data.attendances || []);
        } catch (err) {
            console.error("Failed to load attendance records:", err);
            setError(t("មានបញ្ហាក្នុងការទាញយកកំណត់ត្រាវត្តមាន", "Failed to load global attendance records."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendances();
    }, []);

    const getImageUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
        return `${baseUrl}/${photo.replace(/^\//, '')}`;
    };

    const handleExportAttendanceExcel = () => {
        const exportCols = [
            { header: 'កាលបរិច្ឆេទ (Date)', accessor: 'date' },
            { header: 'កូដសិស្ស (Student ID)', renderText: (a) => a.student?.student_code || '-' },
            { header: 'ឈ្មោះសិស្ស (Student Name)', renderText: (a) => a.student?.user?.name || '-' },
            { header: 'ថ្នាក់រៀន (Class)', renderText: (a) => a.school_class?.name || '-' },
            { header: 'មុខវិជ្ជា (Subject)', renderText: (a) => a.subject?.name || '-' },
            { header: 'ស្ថានភាព (Status)', accessor: 'status' },
            { header: 'កំណត់សម្គាល់ (Remarks)', renderText: (a) => a.remarks || '-' },
        ];

        exportToCSV(`Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`, exportCols, filteredAttendances);
    };

    // Calculate Summary Stats
    const totalCount = attendances.length;
    const presentCount = attendances.filter(a => (a.status || '').toLowerCase() === 'present').length;
    const absentCount = attendances.filter(a => (a.status || '').toLowerCase() === 'absent').length;
    const lateCount = attendances.filter(a => ['late', 'permission'].includes((a.status || '').toLowerCase())).length;

    const presentRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) + '%' : '0%';

    const statusBadges = {
        present: { label: t('✅ វត្តមាន (មកសិក្សា)', '✅ Present'), bg: '#dcfce7', color: '#15803d' },
        late: { label: t('⚠️ មកយឺត', '⚠️ Late'), bg: '#fef3c7', color: '#b45309' },
        permission: { label: t('📝 សុំច្បាប់', '📝 Permission'), bg: '#e0f2fe', color: '#0369a1' },
        absent: { label: t('❌ អវត្តមាន (អត់ច្បាប់)', '❌ Absent'), bg: '#fee2e2', color: '#b91c1c' }
    };

    const columns = [
        { 
            header: t('កាលបរិច្ឆេទ', 'Date'), 
            render: (row) => <strong style={{ color: '#334155' }}>{row.date}</strong> 
        },
        { 
            header: t('អត្តលេខ', 'Student Code'), 
            render: (row) => (
                <span style={{ fontWeight: '700', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '0.2rem 0.55rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                    {row.student?.student_code || 'STU-0000'}
                </span>
            ) 
        },
        { 
            header: t('ឈ្មោះសិស្ស', 'Student Name'), 
            render: (row) => {
                const img = getImageUrl(row.student?.photo);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {img ? (
                            <img src={img} alt={row.student?.user?.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.82rem' }}>
                                {row.student?.user?.name?.charAt(0) || 'S'}
                            </div>
                        )}
                        <div>
                            <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.9rem' }}>{row.student?.user?.name || 'Unknown Student'}</strong>
                        </div>
                    </div>
                );
            } 
        },
        { 
            header: t('ថ្នាក់រៀន', 'Class'), 
            render: (row) => (
                <span style={{ fontWeight: '700', color: '#0369a1' }}>
                    🏫 {row.school_class?.name || 'N/A'}
                </span>
            ) 
        },
        { 
            header: t('ស្ថានភាពវត្តមាន', 'Status'), 
            render: (row) => {
                const st = (row.status || 'present').toLowerCase();
                const badge = statusBadges[st] || statusBadges.present;
                return (
                    <span style={{ 
                        fontWeight: '700', 
                        color: badge.color, 
                        backgroundColor: badge.bg, 
                        padding: '0.25rem 0.65rem', 
                        borderRadius: '12px', 
                        fontSize: '0.82rem' 
                    }}>
                        {badge.label}
                    </span>
                );
            } 
        },
        { 
            header: t('មូលហេតុ / កំណត់សម្គាល់', 'Remarks'), 
            render: (row) => <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{row.remarks || '-'}</span> 
        }
    ];

    // Extract unique classes for filter
    const uniqueClasses = Array.from(new Set(attendances.map(a => a.school_class?.name).filter(Boolean)));

    const filteredAttendances = attendances.filter(a => {
        const matchesSearch = !search || 
            (a.student?.user?.name && a.student.user.name.toLowerCase().includes(search.toLowerCase())) ||
            (a.student?.student_code && a.student.student_code.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = !statusFilter || (a.status || '').toLowerCase() === statusFilter.toLowerCase();
        const matchesClass = !classFilter || (a.school_class?.name || '') === classFilter;
        const matchesDate = !dateFilter || a.date === dateFilter;

        return matchesSearch && matchesStatus && matchesClass && matchesDate;
    });

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("គ្រប់គ្រងវត្តមានសិស្ស 📅", "Student Attendance Management 📅")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("ពិនិត្យ និង ចម្រោះកំណត់ត្រាវត្តមានសិស្សប្រចាំថ្ងៃនៅគ្រប់ថ្នាក់រៀនទាំងអស់។", "Track and inspect real-time student attendance records across all school classes.")}
                    </p>
                </div>
                <Button variant="secondary" onClick={handleExportAttendanceExcel}>
                    📊 Export Excel
                </Button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* Summary Stat Cards */}
            <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
                <StatCard 
                    title={t("កំណត់ត្រាវត្តមានសរុប", "Total Records")} 
                    value={totalCount} 
                    icon={<FiCalendar size={24} />} 
                    color="var(--primary-color)" 
                />
                <StatCard 
                    title={t("អត្រាវត្តមាន (មករៀន)", "Attendance Rate")} 
                    value={presentRate} 
                    icon={<FiCheckCircle size={24} />} 
                    color="#16a34a" 
                />
                <StatCard 
                    title={t("មកយឺត / សុំច្បាប់", "Late / Permission")} 
                    value={lateCount} 
                    icon={<FiClock size={24} />} 
                    color="#d97706" 
                />
                <StatCard 
                    title={t("អវត្តមាន (អត់ច្បាប់)", "Absent Count")} 
                    value={absentCount} 
                    icon={<FiXCircle size={24} />} 
                    color="#dc2626" 
                />
            </div>

            <Card>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: '220px' }}>
                            <Input 
                                placeholder={t("ស្វែងរកឈ្មោះសិស្ស...", "Search student...")} 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ margin: 0 }}
                            />
                        </div>

                        {/* Status Filter */}
                        <div style={{ minWidth: '160px' }}>
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}
                            >
                                <option value="">🎯 {t("ស្ថានភាពទាំងអស់", "All Statuses")}</option>
                                <option value="present">✅ {t("វត្តមាន (មករៀន)", "Present")}</option>
                                <option value="late">⚠️ {t("មកយឺត", "Late")}</option>
                                <option value="permission">📝 {t("សុំច្បាប់", "Permission")}</option>
                                <option value="absent">❌ {t("អវត្តមាន", "Absent")}</option>
                            </select>
                        </div>

                        {/* Class Filter */}
                        <div style={{ minWidth: '160px' }}>
                            <select 
                                value={classFilter} 
                                onChange={(e) => setClassFilter(e.target.value)}
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}
                            >
                                <option value="">🏫 {t("ថ្នាក់រៀនទាំងអស់", "All Classes")}</option>
                                {uniqueClasses.map(c => (
                                    <option key={c} value={c}>ថ្នាក់ {c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div style={{ minWidth: '160px' }}>
                            <input 
                                type="date" 
                                value={dateFilter} 
                                onChange={(e) => setDateFilter(e.target.value)}
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            />
                        </div>

                        {(search || statusFilter || classFilter || dateFilter) && (
                            <Button size="small" variant="secondary" onClick={() => { setSearch(''); setStatusFilter(''); setClassFilter(''); setDateFilter(''); }}>
                                {t("លុបការស្វែងរក ✖️", "Clear Search ✖️")}
                            </Button>
                        )}

                        <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.88rem', fontWeight: '600' }}>
                            {t(`បង្ហាញ ${filteredAttendances.length} នៃកំណត់ត្រាសរុប ${attendances.length}`, `Showing ${filteredAttendances.length} of ${attendances.length} Records`)}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <p>{t("កំពុងទាញយកទិន្នន័យ...", "Loading attendance records...")}</p>
                ) : (
                    <Table columns={columns} data={filteredAttendances} />
                )}
            </Card>
        </div>
    );
};

export default Attendance;
