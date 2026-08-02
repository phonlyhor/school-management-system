import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import { useLanguage } from '../../context/LanguageContext';
import { getParentChildren } from '../../services/parentPortalService';
import { getStudentReportCard } from '../../services/reportCardService';

const ReportCard = () => {
    const { lang, t } = useLanguage();
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState('');
    
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);
    const [error, setError] = useState(null);

    // Strip English in parentheses if in Khmer mode
    const formatSubjectName = (name) => {
        if (!name) return 'N/A';
        if (lang === 'kh') {
            return name.replace(/\s*\([A-Za-z\s-]+\)\s*/g, '').trim();
        }
        return name;
    };

    const formatGrade = (gl) => {
        if (!gl) return t('មិនទាន់កំណត់', 'N/A');
        return gl.toLowerCase().startsWith('grade') ? gl : `${t('កម្រិតថ្នាក់', 'Grade')} ${gl}`;
    };

    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await getParentChildren();
                const childrenList = res.data.children || [];
                setChildren(childrenList);
                if (childrenList.length > 0) {
                    setSelectedChild(childrenList[0].id);
                }
            } catch (err) {
                console.error(err);
                setError(t("មានបញ្ហាក្នុងការទាញយកបញ្ជីកូនៗ", "Failed to load your children."));
            } finally {
                setInitLoading(false);
            }
        };
        fetchChildren();
    }, [lang]);

    useEffect(() => {
        if (!selectedChild) return;
        
        const fetchReportCard = async () => {
            setLoading(true);
            setError(null);
            try {
                const repRes = await getStudentReportCard(selectedChild);
                setReport(repRes.data);
            } catch (err) {
                console.error(err);
                setError(t("មានបញ្ហាក្នុងការទាញយកសៀវភៅតាមដានសម្រាប់កូនសិស្សនេះ", "Failed to load report card for the selected child."));
                setReport(null);
            } finally {
                setLoading(false);
            }
        };
        fetchReportCard();
    }, [selectedChild, lang]);

    const renderScoresTable = (scores, assessmentName) => {
        if (!scores || scores.length === 0) return null;
        
        const columns = [
            { header: t('មុខវិជ្ជា', 'Subject'), render: (row) => <strong>📘 {formatSubjectName(row.subject?.name)}</strong> },
            { header: t('ពិន្ទុ', 'Score'), render: (row) => `${row.score} / ${row.max_score}` },
            { header: t('ភាគរយ', 'Percentage'), render: (row) => `${row.percentage}%` },
            { 
                header: t('និទ្ទេស', 'Grade'), 
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
            <div style={{ marginBottom: '2rem' }} key={assessmentName}>
                <h4 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>{assessmentName}</h4>
                <Table columns={columns} data={scores} />
            </div>
        );
    };

    if (initLoading) return <div style={{ padding: '2rem' }}>{t("កំពុងទាញយកទិន្នន័យ...", "Loading data...")}</div>;

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title">{t("សៀវភៅតាមដានលទ្ធផលសិក្សារបស់កូនៗ 📜", "Children's Report Cards 📜")}</h1>
                <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                    {t("ពិនិត្យមើលលទ្ធផលសិក្សា និទ្ទេសពិន្ទុ និង ពិន្ទុមធ្យមភាគរបស់កូនៗ។", "View academic report cards, grades, and average percentages for your children.")}
                </p>
            </div>

            <Card>
                {children.length === 0 ? (
                    <div style={{ padding: '2rem', color: '#64748b' }}>{t("មិនទាន់មានគណនីកូនសិស្សភ្ជាប់ជាមួយគណនីអាណាព្យាបាលឡើយ", "No children assigned to your account.")}</div>
                ) : (
                    <>
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                                {t("ជ្រើសរើសកូនសិស្សដើមី្បមើលសៀវភៅតាមដាន:", "Select Child to View Report Card:")}
                            </label>
                            <select 
                                value={selectedChild} 
                                onChange={(e) => setSelectedChild(e.target.value)}
                                style={{ width: '100%', maxWidth: '350px', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', color: '#4f46e5' }}
                            >
                                {children.map(child => (
                                    <option key={child.id} value={child.id}>👤 {child.user?.name || child.name} ({t('អត្តលេខ:', 'ID:')} {child.student_code})</option>
                                ))}
                            </select>
                        </div>

                        {loading ? (
                            <p>{t("កំពុងទាញយកសៀវភៅតាមដាន...", "Loading report card...")}</p>
                        ) : error ? (
                            <p style={{ color: 'red' }}>{error}</p>
                        ) : report ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.4rem' }}>{report.student?.user?.name || report.student?.name || t('កូនសិស្ស', 'Student')}</h2>
                                        <p style={{ margin: 0, color: '#64748b', fontWeight: '600' }}>{t("អត្តលេខ:", "ID:")} {report.student?.student_code || 'N/A'}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{t("ថ្នាក់រៀន:", "Class:")} {report.class?.name || t('មិនទាន់ចាត់', 'Unassigned')}</h3>
                                        <p style={{ margin: 0, color: '#64748b', fontWeight: '600' }}>{t("កម្រិតថ្នាក់:", "Grade Level:")} {formatGrade(report.class?.grade_level)}</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>{t("ភាគរយពិន្ទុមធ្យម", "Average Percentage")}</p>
                                        <h2 style={{ margin: '0.5rem 0 0 0', color: '#3b82f6', fontSize: '1.8rem' }}>{report.summary?.average_percentage || 0}%</h2>
                                    </div>
                                    <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid #e2e8f0' }}>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>{t("ពិន្ទុមធ្យមភាគសរុប (GPA)", "Overall GPA (Est.)")}</p>
                                        <h2 style={{ margin: '0.5rem 0 0 0', color: '#10b981', fontSize: '1.8rem' }}>{report.summary?.gpa || '0.00'}</h2>
                                    </div>
                                </div>

                                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>📘 {t("ពិន្ទុ និង និទ្ទេសលម្អិត", "Detailed Scores")}</h3>
                                
                                {report?.scores && !Array.isArray(report.scores) && Object.keys(report.scores).length > 0 ? (
                                    Object.keys(report.scores).map(assessmentId => {
                                        const scoresGroup = report.scores[assessmentId];
                                        const assessmentName = scoresGroup[0]?.assessment?.name || `Assessment ${assessmentId}`;
                                        return renderScoresTable(scoresGroup, assessmentName);
                                    })
                                ) : (
                                    <p style={{ color: '#64748b', fontStyle: 'italic', padding: '1rem 0' }}>{t("មិនទាន់មានទិន្នន័យពិន្ទុត្រូវបានបញ្ចូលនៅឡើយទេ", "No scores have been recorded yet.")}</p>
                                )}
                            </>
                        ) : (
                            <p>{t("មិនមានទិន្នន័យសៀវភៅតាមដានឡើយ", "No report card available.")}</p>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
};

export default ReportCard;
