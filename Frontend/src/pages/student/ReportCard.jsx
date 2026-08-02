import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { getStudentReportCard } from '../../services/reportCardService';
import api from '../../services/api';

const ReportCard = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReportCard = async () => {
            try {
                // First get student ID from dashboard
                const dashRes = await api.get('/student/dashboard');
                const studentId = dashRes.data.student?.id;
                
                if (!studentId) {
                    setError("You are not assigned to a class yet.");
                    setLoading(false);
                    return;
                }

                // Then fetch report card
                const repRes = await getStudentReportCard(studentId);
                setReport(repRes.data);
            } catch (err) {
                console.error(err);
                setError("Failed to load your report card.");
            } finally {
                setLoading(false);
            }
        };
        fetchReportCard();
    }, []);

    const renderScoresTable = (scores, assessmentName) => {
        if (!scores || scores.length === 0) return <p>No scores recorded for this assessment.</p>;
        
        const columns = [
            { header: 'Subject', render: (row) => row.subject?.name },
            { header: 'Score', render: (row) => `${row.score} / ${row.max_score}` },
            { header: 'Percentage', render: (row) => `${row.percentage}%` },
            { 
                header: 'Grade', 
                render: (row) => {
                    const colors = { A: '#16a34a', B: '#3b82f6', C: '#eab308', D: '#f97316', F: '#ef4444' };
                    return (
                        <span style={{ 
                            color: colors[row.grade] || '#000', 
                            fontWeight: 'bold', fontSize: '1.1rem' 
                        }}>
                            {row.grade}
                        </span>
                    );
                } 
            }
        ];

        return (
            <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>{assessmentName}</h4>
                <Table columns={columns} data={scores} />
            </div>
        );
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading report card...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;
    if (!report) return <div style={{ padding: '2rem' }}>No data available.</div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">My Report Card</h1>
            </div>

            <Card>
                <div className="report-card-header">
                    <div>
                        <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{report.student?.user?.name || report.student?.name || 'Student'}</h2>
                        <p style={{ margin: 0, color: '#64748b' }}>ID: {report.student?.student_code || 'N/A'}</p>
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>Class: {report.class?.name || 'Unassigned'}</h3>
                        <p style={{ margin: 0, color: '#64748b' }}>Grade Level: {report.class?.grade_level || 'N/A'}</p>
                    </div>
                </div>

                <div className="report-card-summary">
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Average Percentage</p>
                        <h2 style={{ margin: '0.4rem 0 0 0', color: '#3b82f6', fontSize: '1.75rem' }}>{report.summary?.average_percentage || 0}%</h2>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Overall GPA (Est.)</p>
                        <h2 style={{ margin: '0.4rem 0 0 0', color: '#10b981', fontSize: '1.75rem' }}>{report.summary?.gpa || '0.00'}</h2>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>Total Assessments</p>
                        <h2 style={{ margin: '0.4rem 0 0 0', color: '#8b5cf6', fontSize: '1.75rem' }}>{report.summary?.total_assessments || 0}</h2>
                    </div>
                </div>

                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Detailed Scores</h3>
                
                {report?.scores && !Array.isArray(report.scores) && Object.keys(report.scores).length > 0 ? (
                    Object.keys(report.scores).map(assessmentId => {
                        const scoresGroup = report.scores[assessmentId];
                        const assessmentName = scoresGroup[0]?.assessment?.name || `Assessment ${assessmentId}`;
                        return (
                            <div key={assessmentId}>
                                {renderScoresTable(scoresGroup, assessmentName)}
                            </div>
                        );
                    })
                ) : (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>No scores have been recorded yet.</p>
                )}
            </Card>
        </div>
    );
};

export default ReportCard;
