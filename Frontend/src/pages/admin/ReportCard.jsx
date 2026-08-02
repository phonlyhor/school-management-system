import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { getClasses } from '../../services/classService';
import { getStudents } from '../../services/studentService';
import { getStudentReportCard } from '../../services/reportCardService';
import toast from 'react-hot-toast';

const ReportCard = () => {
    const { lang, t } = useLanguage();
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [search, setSearch] = useState('');
    const [reportData, setReportData] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [loadingReport, setLoadingReport] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingData(true);
            try {
                const [clsRes, stuRes] = await Promise.all([
                    getClasses(),
                    getStudents()
                ]);
                setClasses(clsRes.data.classes || []);
                setStudents(stuRes.data.students || []);
            } catch (err) {
                console.error("Failed to load initial data for report cards:", err);
                toast.error(t("មានបញ្ហាក្នុងការទាញយកបញ្ជីថ្នាក់ និង សិស្ស", "Failed to load classes and students list."));
            } finally {
                setLoadingData(false);
            }
        };
        loadInitialData();
    }, []);

    const handleViewReportCard = async (studentId) => {
        if (!studentId) return;
        setLoadingReport(true);
        try {
            const res = await getStudentReportCard(studentId);
            setReportData(res.data || res);
            setIsReportModalOpen(true);
        } catch (err) {
            console.error("Failed to load report card:", err);
            toast.error(t("មានបញ្ហាក្នុងការទាញយកសៀវភៅតាមដានលទ្ធផលសិក្សា", "Failed to load student report card."));
        } finally {
            setLoadingReport(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const columns = [
        { header: 'ID', accessor: 'id' },
        { 
            header: t('ឈ្មោះសិស្ស', 'Student Name'), 
            render: (row) => <strong>🎓 {row.user?.name || row.name || 'N/A'}</strong> 
        },
        { header: t('អាសយដ្ឋានអ៊ីមែល', 'Email'), render: (row) => row.user?.email || row.email || 'N/A' },
        { 
            header: t('ថ្នាក់រៀន', 'Class'), 
            render: (row) => (
                <span style={{ fontWeight: '600', color: '#0f172a' }}>
                    {row.school_class?.name || row.schoolClass?.name || row.student?.school_class?.name || 'N/A'}
                </span>
            )
        },
        { 
            header: t('អត្តលេខសិស្ស', 'Student Code'), 
            render: (row) => (
                <span style={{ fontWeight: '700', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                    {row.student_code || row.student?.student_code || 'N/A'}
                </span>
            ) 
        },
        {
            header: t('សកម្មភាព', 'Action'),
            render: (row) => (
                <Button 
                    size="small" 
                    variant="primary" 
                    onClick={() => handleViewReportCard(row.id || row.student?.id)}
                    style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}
                >
                    📜 {t("មើលសៀវភៅតាមដាន", "View Report Card")}
                </Button>
            )
        }
    ];

    const filteredStudents = students.filter(s => {
        const nameStr = s.user?.name || s.name || '';
        const emailStr = s.user?.email || s.email || '';
        const codeStr = s.student_code || s.student?.student_code || '';
        const classIdStr = String(s.class_id || s.student?.class_id || '');

        const matchesSearch = !search || 
            nameStr.toLowerCase().includes(search.toLowerCase()) ||
            emailStr.toLowerCase().includes(search.toLowerCase()) ||
            codeStr.toLowerCase().includes(search.toLowerCase());

        const matchesClass = !selectedClassId || classIdStr === String(selectedClassId);

        return matchesSearch && matchesClass;
    });

    const subjectColumns = [
        { header: t('មុខវិជ្ជា', 'Subject'), render: (row) => <strong>{row.subject_name}</strong> },
        { header: t('ពិន្ទុ', 'Score Obtained'), render: (row) => `${row.score} / ${row.max_score}` },
        { header: t('ភាគរយ', 'Percentage'), render: (row) => `${row.percentage}%` },
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
        { header: t('ការវាយតម្លៃ', 'Assessment'), accessor: 'assessment_name' }
    ];

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("សៀវភៅតាមដានលទ្ធផលសិក្សា 📜", "Student Report Cards 📜")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("ពិនិត្យ និង បោះពុម្ពសៀវភៅតាមដានលទ្ធផលសិក្សា និទ្ទេសពិន្ទុ និង វត្តមានរបស់សិស្ស។", "Inspect and print academic report cards, GPA calculations, and attendance breakdown.")}
                    </p>
                </div>
            </div>

            <Card>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: '250px' }}>
                            <Input 
                                placeholder={t("ស្វែងរកឈ្មោះសិស្ស...", "Search student...")} 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ margin: 0 }}
                            />
                        </div>

                        {/* Class Filter */}
                        <div style={{ minWidth: '200px' }}>
                            <select 
                                value={selectedClassId} 
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}
                            >
                                <option value="">🏫 {t("ថ្នាក់រៀនទាំងអស់", "All Classes")}</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>ថ្នាក់ {c.name}</option>
                                ))}
                            </select>
                        </div>

                        {(search || selectedClassId) && (
                            <Button size="small" variant="secondary" onClick={() => { setSearch(''); setSelectedClassId(''); }}>
                                {t("លុបការស្វែងរក ✖️", "Clear Search ✖️")}
                            </Button>
                        )}

                        <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.88rem', fontWeight: '600' }}>
                            {t(`បង្ហាញសិស្សចំនួន ${filteredStudents.length} នាក់`, `Showing ${filteredStudents.length} Students`)}
                        </div>
                    </div>
                </div>

                {loadingData ? (
                    <p style={{ padding: '1rem' }}>{t("កំពុងទាញយកទិន្នន័យ...", "Loading students list...")}</p>
                ) : (
                    <Table columns={columns} data={filteredStudents} />
                )}
            </Card>

            {/* Report Card Preview Modal */}
            <Modal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                title={t("សៀវភៅតាមដានលទ្ធផលសិក្សាផ្លូវការ", "Official Academic Report Card")}
                maxWidth="800px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>{t("បិទ", "Close")}</Button>
                        <Button variant="primary" onClick={handlePrint} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                            🖨️ {t("បោះពុម្ពសៀវភៅតាមដាន (Print)", "Print Report Card")}
                        </Button>
                    </div>
                }
            >
                {loadingReport ? (
                    <p style={{ padding: '2rem', textAlign: 'center' }}>{t("កំពុងរៀបចំទិន្នន័យសៀវភៅតាមដាន...", "Generating report card...")}</p>
                ) : reportData ? (
                    <div className="printable-report-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem' }}>
                        
                        {/* School & Student Header */}
                        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: '800' }}>
                                    {t("វិទ្យាល័យ ហ៊ុន សែន ចំការលើ 🏫", "HUN SEN CHAMKAR LOE HIGH SCHOOL")}
                                </h2>
                                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
                                    {t("សៀវភៅតាមដានលទ្ធផលសិក្សាផ្លូវការ", "OFFICIAL STUDENT ACADEMIC REPORT CARD")}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <strong style={{ display: 'block', fontSize: '1.1rem', color: '#4f46e5' }}>{reportData.student?.name}</strong>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    {t("អត្តលេខ:", "Code:")} {reportData.student?.code} | {t("ថ្នាក់:", "Class:")} {reportData.class?.name || 'N/A'}
                                </span>
                            </div>
                        </div>

                        {/* Overall GPA & Summary Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>{t("ពិន្ទុមធ្យមភាគសរុប (GPA)", "Estimated GPA")}</span>
                                <strong style={{ fontSize: '1.4rem', color: '#16a34a' }}>{reportData.summary?.gpa || '0.00'}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>{t("ភាគរយពិន្ទុមធ្យម", "Average Percentage")}</span>
                                <strong style={{ fontSize: '1.4rem', color: '#2563eb' }}>{reportData.summary?.average_percentage || 0}%</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>{t("អត្រាវត្តមានសិក្សា", "Attendance Rate")}</span>
                                <strong style={{ fontSize: '1.4rem', color: '#0284c7' }}>{reportData.attendance?.percentage || '0%'}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>{t("ចំណាត់ថ្នាក់ក្នុងថ្នាក់", "Rank Position")}</span>
                                <strong style={{ fontSize: '1.4rem', color: '#8b5cf6' }}>{reportData.student?.class_position || t('សមាជិក', 'Member')}</strong>
                            </div>
                        </div>

                        {/* Subject Assessment Table */}
                        <div>
                            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', color: '#0f172a' }}>
                                📘 {t("ពិន្ទុ និង និទ្ទេសតាមមុខវិជ្ជា", "Subject Assessment Scores & Grades")}
                            </h3>
                            <Table columns={subjectColumns} data={reportData.scores || []} />
                        </div>

                    </div>
                ) : (
                    <p style={{ color: 'red' }}>{t("មិនមានទិន្នន័យសម្រាប់បង្ហាញឡើយ", "No report card data available.")}</p>
                )}
            </Modal>
        </div>
    );
};

export default ReportCard;
