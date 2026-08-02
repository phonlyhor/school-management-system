import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { getStudentAttendance } from '../../services/studentPortalService';

const Attendance = () => {
    const [attendances, setAttendances] = useState([]);
    const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: '0%' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            try {
                const res = await getStudentAttendance();
                setAttendances(res.data.attendances || []);
                if (res.data.summary) {
                    setSummary(res.data.summary);
                }
            } catch (err) {
                console.error("Failed to load student attendance:", err);
                setError("Failed to load your attendance history.");
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, []);

    const statusBadge = (status) => {
        const s = status?.toLowerCase();
        let bg = '#e2e8f0', color = '#475569';
        if (s === 'present') { bg = '#dcfce7'; color = '#166534'; }
        else if (s === 'absent') { bg = '#fee2e2'; color = '#991b1b'; }
        else if (s === 'late') { bg = '#fef3c7'; color = '#92400e'; }

        return (
            <span style={{
                padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem',
                fontWeight: '600', textTransform: 'capitalize', backgroundColor: bg, color: color
            }}>
                {status}
            </span>
        );
    };

    const columns = [
        { header: 'Date', accessor: 'date' },
        { header: 'Subject', render: (row) => row.subject?.name || 'N/A' },
        { header: 'Class', render: (row) => row.school_class?.name || 'N/A' },
        { header: 'Status', render: (row) => statusBadge(row.status) },
        { header: 'Note', render: (row) => row.note || '-' }
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">My Attendance (វត្តមានរបស់ខ្ញុំ)</h1>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <Card style={{ padding: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Attendance Rate</p>
                        <h2 style={{ margin: 0, color: '#4f46e5', fontSize: '1.6rem' }}>{summary.percentage}</h2>
                    </div>
                </Card>
                <Card style={{ padding: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Total Sessions</p>
                        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.6rem' }}>{summary.total}</h2>
                    </div>
                </Card>
                <Card style={{ padding: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Present Days</p>
                        <h2 style={{ margin: 0, color: '#16a34a', fontSize: '1.6rem' }}>{summary.present}</h2>
                    </div>
                </Card>
                <Card style={{ padding: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Absent Days</p>
                        <h2 style={{ margin: 0, color: '#dc2626', fontSize: '1.6rem' }}>{summary.absent}</h2>
                    </div>
                </Card>
                <Card style={{ padding: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Late Days</p>
                        <h2 style={{ margin: 0, color: '#d97706', fontSize: '1.6rem' }}>{summary.late}</h2>
                    </div>
                </Card>
            </div>

            <Card>
                <h3 style={{ margin: '0 0 1rem 0', color: '#334155' }}>My Attendance Log</h3>
                {loading ? (
                    <p>Loading attendance history...</p>
                ) : (
                    <Table columns={columns} data={attendances} />
                )}
            </Card>
        </div>
    );
};

export default Attendance;
