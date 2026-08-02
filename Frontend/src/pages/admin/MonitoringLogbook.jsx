import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { FiBookOpen, FiPrinter, FiUser, FiPhone, FiAlertTriangle, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MonitoringLogbook = () => {
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Load list of all classes for selector
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await api.get('/classes');
                const classList = res.data.classes || res.data || [];
                setClasses(classList);
                if (classList.length > 0) {
                    setSelectedClassId(classList[0].id);
                }
            } catch (err) {
                console.error("Failed to load classes:", err);
                toast.error("Failed to load class list.");
            }
        };
        fetchClasses();
    }, []);

    // Load report when selected class or filters change
    const fetchClassLogbook = async (classId, month, year) => {
        if (!classId) return;
        setLoading(true);
        try {
            let url = `/attendance/report/class/${classId}`;
            const params = [];
            if (month) params.push(`month=${month}`);
            if (year) params.push(`year=${year}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            const res = await api.get(url);
            setReportData(res.data);
        } catch (err) {
            console.error("Failed to load class logbook report:", err);
            toast.error("Failed to load class logbook.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedClassId) {
            fetchClassLogbook(selectedClassId, selectedMonth, selectedYear);
        }
    }, [selectedClassId, selectedMonth, selectedYear]);

    const handlePrint = () => {
        window.print();
    };

    // Filter students by search
    const filteredStudents = (reportData?.students || []).filter(st => 
        (st.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (st.student_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (st.parent_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Class Officers
    const monitor = reportData?.students?.find(s => s.class_position === 'Class Monitor');
    const viceMonitor = reportData?.students?.find(s => s.class_position === 'Vice Monitor');
    const treasurer = reportData?.students?.find(s => s.class_position === 'Treasurer');
    const secretary = reportData?.students?.find(s => s.class_position === 'Secretary');

    // High Risk Students (absent > 1 or attendance rate < 85%)
    const highRiskStudents = (reportData?.students || []).filter(st => st.attendance?.absent > 1 || st.attendance?.status_warning);

    const studentColumns = [
        { header: '#', render: (_, idx) => idx + 1 },
        { header: 'Student Code', accessor: 'student_code' },
        { 
            header: 'Student Name (ឈ្មោះសិស្ស)', 
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <strong>{row.name}</strong>
                    {row.attendance?.status_warning && (
                        <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', background: '#ef4444', color: '#ffffff', fontSize: '0.72rem', fontWeight: '700' }}>
                            ⚠️ អវត្តមានច្រើន
                        </span>
                    )}
                </div>
            ) 
        },
        { header: 'Gender (ភេទ)', render: (row) => row.gender || 'N/A' },
        { 
            header: 'Class Position (តួនាទីក្នុងថ្នាក់)', 
            render: (row) => (
                <span style={{
                    padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700',
                    backgroundColor: row.class_position === 'Class Monitor' ? '#fef3c7' : row.class_position === 'Vice Monitor' ? '#e0e7ff' : '#f1f5f9',
                    color: row.class_position === 'Class Monitor' ? '#92400e' : row.class_position === 'Vice Monitor' ? '#4338ca' : '#475569'
                }}>
                    {row.class_position === 'Class Monitor' ? '👑 ប្រធានថ្នាក់' : row.class_position === 'Vice Monitor' ? '⭐ អនុប្រធាន' : row.class_position === 'Treasurer' ? '💰 បេឡា' : row.class_position === 'Secretary' ? '📝 លេខា' : '👤 សមាជិក'}
                </span>
            ) 
        },
        { header: 'Present (វត្តមាន)', render: (row) => <strong style={{ color: '#16a34a' }}>{row.attendance?.present}</strong> },
        { header: 'Absent (អវត្តមាន)', render: (row) => <strong style={{ color: row.attendance?.absent > 0 ? '#dc2626' : '#64748b' }}>{row.attendance?.absent}</strong> },
        { header: 'Late / Perm', render: (row) => `${row.attendance?.late} / ${row.attendance?.permission}` },
        { 
            header: 'Attendance Rate', 
            render: (row) => (
                <span style={{
                    padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem',
                    backgroundColor: row.attendance?.status_warning ? '#fecaca' : '#dcfce7',
                    color: row.attendance?.status_warning ? '#991b1b' : '#166534'
                }}>
                    {row.attendance?.rate}
                </span>
            ) 
        },
        {
            header: 'Parent Contact (អាណាព្យាបាល)',
            render: (row) => (
                <div>
                    <div><strong>{row.parent_name}</strong></div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>📞 {row.parent_phone}</div>
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1300px', margin: '0 auto' }}>
            {/* Header & Filter Actions */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title" style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiBookOpen style={{ color: '#4f46e5' }} /> សៀវភៅតាមដានថ្នាក់រៀន (Admin Monitoring Logbook)
                    </h1>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                        តាមដានវត្តមាន សិស្សអវត្តមានច្រើន ព័ត៌មានគ្រូបន្ទុកថ្នាក់ និង គណៈកម្មការថ្នាក់រៀន
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <Button onClick={handlePrint} variant="secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiPrinter /> 🖨️ បោះពុម្ភសៀវភៅតាមដាន (Print)
                    </Button>
                </div>
            </div>

            {/* Controls / Filter Section */}
            <Card style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                            🏫 ជ្រើសរើសថ្នាក់រៀន ៖
                        </label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            style={{ padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', minWidth: '180px' }}
                        >
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>
                                    Grade {c.grade_level} - {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                            📅 ប្រចាំខែ ៖
                        </label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{ padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600' }}
                        >
                            <option value="">-- All Months (គ្រប់ខែ) --</option>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    Month {i + 1} ({new Date(2026, i, 1).toLocaleString('km-KH', { month: 'long' })})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                            📆 ឆ្នាំសិក្សា ៖
                        </label>
                        <input
                            type="number"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            style={{ padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', width: '100px' }}
                        />
                    </div>

                    <div style={{ marginLeft: 'auto', minWidth: '220px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                            🔍 ស្វែងរកសិស្ស ៖
                        </label>
                        <input
                            type="text"
                            placeholder="ឈ្មោះសិស្ស, លេខកូដ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '0.45rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}
                        />
                    </div>
                </div>
            </Card>

            {loading ? (
                <p style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading class logbook...</p>
            ) : reportData ? (
                <div>
                    {/* Class & Homeroom Overview Header Banner */}
                    <Card style={{ marginBottom: '1.5rem', borderLeft: '5px solid #4f46e5', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.4rem' }}>
                                    ថ្នាក់រៀន ៖ <span style={{ color: '#4f46e5' }}>{reportData.class?.name}</span> (Grade {reportData.class?.grade_level})
                                </h2>
                                <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#334155' }}>
                                    <strong>👨‍🏫 គ្រូបន្ទុកថ្នាក់ (Homeroom Teacher) ៖</strong>{' '}
                                    <span style={{ fontWeight: '700', color: reportData.class?.homeroom_teacher?.name ? '#1e293b' : '#dc2626' }}>
                                        {reportData.class?.homeroom_teacher?.name || 'មិនទាន់បានចាត់តាំង (Unassigned)'}
                                    </span>
                                </p>
                                {reportData.class?.homeroom_teacher?.email && (
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                        ✉️ {reportData.class?.homeroom_teacher?.email}
                                    </p>
                                )}
                            </div>

                            {/* Class Officers Summary */}
                            <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <strong style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    👑 គណៈកម្មការថ្នាក់រៀន (Class Officers) ៖
                                </strong>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.84rem' }}>
                                    <div>👑 <strong>ប្រធានថ្នាក់ ៖</strong> {monitor?.name || 'N/A'}</div>
                                    <div>⭐ <strong>អនុប្រធាន ៖</strong> {viceMonitor?.name || 'N/A'}</div>
                                    <div>💰 <strong>បេឡា ៖</strong> {treasurer?.name || 'N/A'}</div>
                                    <div>📝 <strong>លេខា ៖</strong> {secretary?.name || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Stats Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Card style={{ textAlign: 'center', background: '#f8fafc' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>សិស្សសរុប</span>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: '#0f172a' }}>{reportData.summary?.total_students || 0} នាក់</h3>
                        </Card>

                        <Card style={{ textAlign: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <span style={{ color: '#166534', fontSize: '0.85rem', fontWeight: '600' }}>វត្តមានសរុប (Present)</span>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: '#15803d' }}>{reportData.summary?.present || 0} លើក</h3>
                        </Card>

                        <Card style={{ textAlign: 'center', background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <span style={{ color: '#991b1b', fontSize: '0.85rem', fontWeight: '600' }}>អវត្តមានសរុប (Absent)</span>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: '#dc2626' }}>{reportData.summary?.absent || 0} លើក</h3>
                        </Card>

                        <Card style={{ textAlign: 'center', background: '#fefce8', border: '1px solid #fef08a' }}>
                            <span style={{ color: '#854d0e', fontSize: '0.85rem', fontWeight: '600' }}>មកយឺត/ច្បាប់</span>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: '#b45309' }}>{(reportData.summary?.late || 0) + (reportData.summary?.permission || 0)} លើក</h3>
                        </Card>

                        <Card style={{ textAlign: 'center', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                            <span style={{ color: '#1e40af', fontSize: '0.85rem', fontWeight: '600' }}>អត្រាវត្តមានសរុប</span>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: '#2563eb' }}>{reportData.summary?.overall_rate || '100%'}</h3>
                        </Card>
                    </div>

                    {/* High Risk Students Warning Section */}
                    {highRiskStudents.length > 0 && (
                        <Card style={{ marginBottom: '1.5rem', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                            <h3 style={{ margin: '0 0 0.8rem 0', color: '#c2410c', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <FiAlertTriangle /> 🚨 បញ្ជីឈ្មោះសិស្សត្រូវតាមដានជាពិសេស (High Risk Absentee Students - {highRiskStudents.length} នាក់) ៖
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.8rem' }}>
                                {highRiskStudents.map(st => (
                                    <div key={st.id} style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ffedd5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <strong style={{ color: '#7c2d12', fontSize: '0.95rem' }}>{st.name} ({st.student_code})</strong>
                                            <div style={{ fontSize: '0.82rem', color: '#dc2626', marginTop: '2px' }}>
                                                ❌ អវត្តមាន ៖ <strong>{st.attendance?.absent} ថ្ងៃ</strong> (អត្រាវត្តមាន ៖ {st.attendance?.rate})
                                            </div>
                                            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                                                👤 អាណាព្យាបាល ៖ <strong>{st.parent_name}</strong> (📞 {st.parent_phone})
                                            </div>
                                        </div>
                                        <a href={`tel:${st.parent_phone}`} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', background: '#ea580c', color: '#ffffff', fontWeight: '700', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <FiPhone /> ទូរស័ព្ទ
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Main Student Attendance & Logbook Table */}
                    <Card padding={false}>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>
                                📖 បញ្ជីឈ្មោះសៀវភៅតាមដានសិស្សក្នុងថ្នាក់ ({filteredStudents.length} នាក់)
                            </h3>
                        </div>
                        <Table
                            columns={studentColumns}
                            data={filteredStudents}
                        />
                    </Card>
                </div>
            ) : null}
        </div>
    );
};

export default MonitoringLogbook;
