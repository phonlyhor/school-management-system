import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { useLanguage } from '../../context/LanguageContext';
import { getParentAttendance, getParentChildren } from '../../services/parentPortalService';

const Attendance = () => {
    const { lang, t } = useLanguage();
    const [children, setChildren] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('all');
    const [attendances, setAttendances] = useState([]);
    const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: '0%' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Clean English parentheses if in Khmer mode
    const formatSubjectName = (name) => {
        if (!name) return 'N/A';
        if (lang === 'kh') {
            return name.replace(/\s*\([A-Za-z\s-]+\)\s*/g, '').trim();
        }
        return name;
    };

    // Fetch children list first
    useEffect(() => {
        const initChildren = async () => {
            try {
                const res = await getParentChildren();
                const kids = res.data.children || [];
                setChildren(kids);
            } catch (err) {
                console.error("Failed to load children:", err);
            }
        };
        initChildren();
    }, []);

    // Fetch attendance when selected student changes
    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            try {
                const res = await getParentAttendance(selectedStudentId);
                setAttendances(res.data.attendances || []);
                if (res.data.summary) {
                    setSummary(res.data.summary);
                }
            } catch (err) {
                console.error("Failed to load attendance:", err);
                setError(t("មានបញ្ហាក្នុងការទាញយកកំណត់ត្រាវត្តមានកូនៗ", "Failed to load attendance records."));
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, [selectedStudentId, lang]);

    const statusBadge = (status) => {
        const s = (status || '').toLowerCase();
        let bg = '#e2e8f0', color = '#475569', label = status;
        if (s === 'present') { 
            bg = '#dcfce7'; 
            color = '#15803d'; 
            label = t('✅ វត្តមាន', '✅ Present'); 
        } else if (s === 'absent') { 
            bg = '#fee2e2'; 
            color = '#991b1b'; 
            label = t('❌ អវត្តមាន', '❌ Absent'); 
        } else if (s === 'late') { 
            bg = '#fef3c7'; 
            color = '#92400e'; 
            label = t('⚠️ មកយឺត', '⚠️ Late'); 
        } else if (s === 'permission') { 
            bg = '#e0f2fe'; 
            color = '#0369a1'; 
            label = t('📝 សុំច្បាប់', '📝 Permission'); 
        }

        return (
            <span style={{
                padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem',
                fontWeight: '700', backgroundColor: bg, color: color
            }}>
                {label}
            </span>
        );
    };

    const columns = [
        { header: t('កាលបរិច្ឆេទ', 'Date'), accessor: 'date' },
        { 
            header: t('ឈ្មោះកូនសិស្ស', 'Student Name'), 
            render: (row) => (
                <strong style={{ color: '#4f46e5' }}>
                    {row.student?.user?.name || t('កូនសិស្ស', 'Child')}
                </strong>
            )
        },
        { header: t('មុខវិជ្ជា', 'Subject'), render: (row) => formatSubjectName(row.subject?.name) },
        { header: t('ថ្នាក់រៀន', 'Class'), render: (row) => row.school_class?.name || 'N/A' },
        { header: t('ស្ថានភាពវត្តមាន', 'Status'), render: (row) => statusBadge(row.status) },
        { header: t('កំណត់សម្គាល់', 'Note'), render: (row) => row.note || '-' }
    ];

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 className="page-title">{t("វត្តមានកូនៗ 📅", "Children's Attendance 📅")}</h1>

                {/* Child Selector Dropdown */}
                {children.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontWeight: '600', color: '#475569' }}>{t("ជ្រើសរើសកូន:", "Filter Child:")}</label>
                        <select 
                            value={selectedStudentId} 
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1',
                                fontWeight: '600', color: '#4f46e5', backgroundColor: '#f8fafc'
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

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* Attendance Summary Grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1.25rem', marginBottom: '1.5rem'
            }}>
                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #4f46e5' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', display: 'block' }}>{t("អត្រាវត្តមានសិក្សា", "Attendance Rate")}</span>
                    <strong style={{ fontSize: '1.6rem', color: '#4f46e5', display: 'block', marginTop: '0.2rem' }}>{summary.percentage}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', display: 'block' }}>{t("ចំនួនម៉ោងសិក្សាសរុប", "Total Sessions")}</span>
                    <strong style={{ fontSize: '1.6rem', color: '#0284c7', display: 'block', marginTop: '0.2rem' }}>{summary.total}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #16a34a' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', display: 'block' }}>{t("ចំនួនថ្ងៃវត្តមាន (មករៀន)", "Present Days")}</span>
                    <strong style={{ fontSize: '1.6rem', color: '#16a34a', display: 'block', marginTop: '0.2rem' }}>{summary.present}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #dc2626' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', display: 'block' }}>{t("ចំនួនថ្ងៃអវត្តមាន", "Absent Days")}</span>
                    <strong style={{ fontSize: '1.6rem', color: '#dc2626', display: 'block', marginTop: '0.2rem' }}>{summary.absent}</strong>
                </div>
                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #d97706' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', display: 'block' }}>{t("ចំនួនថ្ងៃមកយឺត/សុំច្បាប់", "Late Days")}</span>
                    <strong style={{ fontSize: '1.6rem', color: '#d97706', display: 'block', marginTop: '0.2rem' }}>{summary.late}</strong>
                </div>
            </div>

            <Card title={`📅 ${t("ប្រវត្តិវត្តមានសិក្សារបស់កូនៗ", "All Children's Attendance History")}`}>
                {loading ? (
                    <p style={{ padding: '1rem' }}>{t("កំពុងទាញយកទិន្នន័យ...", "Loading attendance records...")}</p>
                ) : (
                    <Table columns={columns} data={attendances} />
                )}
            </Card>
        </div>
    );
};

export default Attendance;
