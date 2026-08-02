import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { getStudentAttendance } from '../../services/studentPortalService';

const Attendance = () => {
    const [attendances, setAttendances] = useState([]);
    const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: '0%' });
    const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            try {
                const params = {};
                if (selectedDate) params.date = selectedDate;
                const res = await getStudentAttendance(params);
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
    }, [selectedDate]);

    const statusBadge = (status) => {
        const s = status?.toLowerCase();
        let bg = '#e2e8f0', color = '#475569';
        if (s === 'present') { bg = '#dcfce7'; color = '#166534'; }
        else if (s === 'absent') { bg = '#fee2e2'; color = '#991b1b'; }
        else if (s === 'late') { bg = '#fef3c7'; color = '#92400e'; }
        else if (s === 'permission') { bg = '#dbeafe'; color = '#1d4ed8'; }

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
        { header: 'Date (កាលបរិច្ឆេទ)', accessor: 'date' },
        { header: 'Subject (មុខវិជ្ជា)', render: (row) => row.subject?.name || 'N/A' },
        { header: 'Class (ថ្នាក់រៀន)', render: (row) => row.school_class?.name || 'N/A' },
        { header: 'Status (ស្ថានភាព)', render: (row) => statusBadge(row.status) },
        { header: 'Note (ចំណាំ)', render: (row) => row.note || '-' }
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📜 My Attendance Log (ប្រវត្តិវត្តមាន)
                        {selectedDate && (
                            <span style={{ fontSize: '0.8rem', background: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '600' }}>
                                {selectedDate}
                            </span>
                        )}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label htmlFor="student-attendance-date" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                            ជ្រើសរើសថ្ងៃ (Select Date):
                        </label>
                        <input 
                            id="student-attendance-date"
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                                padding: '0.4rem 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.88rem',
                                color: '#1e293b',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        />
                        {selectedDate && (
                            <button
                                type="button"
                                onClick={() => setSelectedDate('')}
                                style={{
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f8fafc',
                                    fontSize: '0.82rem',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                🔄 មើលទាំងអស់ (Show All)
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <p>Loading attendance history...</p>
                ) : attendances.length > 0 ? (
                    <Table columns={columns} data={attendances} />
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        <p style={{ margin: 0, fontWeight: '500' }}>
                            {selectedDate ? `មិនមានកត់ត្រាវត្តមានសម្រាប់ថ្ងៃទី ${selectedDate} ឡើយ។` : 'មិនទាន់មានប្រវត្តិវត្តមាននៅឡើយទេ'}
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Attendance;
