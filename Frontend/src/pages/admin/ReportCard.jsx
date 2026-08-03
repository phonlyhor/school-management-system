import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { getClasses } from '../../services/classService';
import { getStudents } from '../../services/studentService';
import { getStudentReportCard, getClassSummaryReportCard } from '../../services/reportCardService';
import { getSemesters } from '../../services/semesterService';
import toast from 'react-hot-toast';

const ReportCard = () => {
    const { lang, t } = useLanguage();
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
    const [selectedSemesterId, setSelectedSemesterId] = useState('');
    const [search, setSearch] = useState('');
    const [reportData, setReportData] = useState(null);
    const [classSummaryData, setClassSummaryData] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isClassSummaryModalOpen, setIsClassSummaryModalOpen] = useState(false);
    const [loadingReport, setLoadingReport] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoadingData(true);
            try {
                const [clsRes, stuRes, semRes] = await Promise.all([
                    getClasses(),
                    getStudents(),
                    getSemesters().catch(() => ({ data: [] }))
                ]);
                setClasses(clsRes.data.classes || clsRes.data || []);
                setStudents(stuRes.data.students || stuRes.data || []);
                setSemesters(semRes.data.semesters || semRes.data || []);
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
            const res = await getStudentReportCard(studentId, selectedAcademicYear, selectedSemesterId);
            setReportData(res.data || res);
            setIsReportModalOpen(true);
        } catch (err) {
            console.error("Failed to load report card:", err);
            toast.error(t("មានបញ្ហាក្នុងការទាញយកសៀវភៅតាមដានលទ្ធផលសិក្សា", "Failed to load student report card."));
        } finally {
            setLoadingReport(false);
        }
    };

    const handleViewClassSummary = async () => {
        if (!selectedClassId) {
            toast.error(t("សូមជ្រើសរើសថ្នាក់រៀនជាមុនសិន", "Please select a class first."));
            return;
        }
        setLoadingReport(true);
        try {
            const res = await getClassSummaryReportCard(selectedClassId, selectedAcademicYear, selectedSemesterId);
            setClassSummaryData(res.data || res);
            setIsClassSummaryModalOpen(true);
        } catch (err) {
            console.error("Failed to load class summary broadsheet:", err);
            toast.error(t("មានបញ្ហាក្នុងការទាញយកតារាងចំណាត់ថ្នាក់សិស្សប្រចាំថ្នាក់", "Failed to load class summary ranking broadsheet."));
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
        { header: t('អត្តលេខសិស្ស', 'Student Code'), render: (row) => (
            <span style={{ fontWeight: '700', color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                {row.student_code || row.student?.student_code || 'N/A'}
            </span>
        ) },
        { 
            header: t('ថ្នាក់រៀន', 'Class'), 
            render: (row) => (
                <span style={{ fontWeight: '600', color: '#0f172a' }}>
                    {row.school_class?.name || row.schoolClass?.name || row.student?.school_class?.name || 'N/A'}
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
        { header: t('មុខវិជ្ជា', 'Subject'), render: (row) => <strong>{row.subject}</strong> },
        { header: t('ពិន្ទុទទួលបាន', 'Score Obtained'), render: (row) => `${row.score} / ${row.max_score}` },
        { header: t('ភាគរយ %', 'Percentage'), render: (row) => `${row.percentage}%` },
        { 
            header: t('និទ្ទេស (MoEYS Grade)', 'Grade Mention'), 
            render: (row) => {
                const gm = row.grade_mention || {};
                return (
                    <span style={{ 
                        fontWeight: '700', 
                        color: gm.color || '#334155',
                        backgroundColor: '#f1f5f9',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.88rem'
                    }}>
                        {gm.code || row.grade_code || 'N/A'} - {gm.khmer || ''}
                    </span>
                );
            } 
        },
        { header: t('ការវាយតម្លៃ', 'Assessment'), accessor: 'assessment' }
    ];

    const rankingColumns = [
        { header: t('ចំណាត់ថ្នាក់ (Rank)', 'Rank'), render: (row) => <strong style={{ color: '#4f46e5', fontSize: '1.05rem' }}>#{row.rank}</strong> },
        { header: t('អត្តលេខ', 'Code'), render: (row) => row.student_code || 'N/A' },
        { header: t('ឈ្មោះសិស្ស', 'Student Name'), render: (row) => <strong>{row.student_name}</strong> },
        { header: t('ពិន្ទុសរុប', 'Total Score'), render: (row) => row.total_score },
        { header: t('មធ្យមភាគ %', 'Average %'), render: (row) => <strong>{row.average_percentage}%</strong> },
        { header: t('ពិន្ទុលើ៥០', 'Score / 50'), render: (row) => row.score_out_of_50 },
        { 
            header: t('និទ្ទេស', 'Grade'), 
            render: (row) => (
                <span style={{ fontWeight: '700', color: row.grade_mention?.color }}>
                    {row.grade_mention?.code} - {row.grade_mention?.khmer}
                </span>
            ) 
        },
        { 
            header: t('លទ្ធផល', 'Result'), 
            render: (row) => (
                <span style={{ 
                    fontWeight: '700', 
                    color: row.pass_status?.is_passed ? '#16a34a' : '#dc2626',
                    backgroundColor: row.pass_status?.is_passed ? '#dcfce7' : '#fee2e2',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                }}>
                    {row.pass_status?.label || 'N/A'}
                </span>
            ) 
        }
    ];

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">{t("សៀវភៅតាមដានលទ្ធផលសិក្សា (ស្ដង់ដារក្រសួងអប់រំ) 📜", "MoEYS Standard Academic Report Cards 📜")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("ពិនិត្យ គណនានិទ្ទេស (ល្អប្រសើរ, ល្អណាស់...) ចំណាត់ថ្នាក់ និង បោះពុម្ពសៀវភៅតាមដានសិស្ស។", "Inspect MoEYS grade mentions, calculate class ranks, and print official report cards.")}
                    </p>
                </div>
                {selectedClassId && (
                    <Button 
                        variant="primary" 
                        onClick={handleViewClassSummary}
                        style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                    >
                        📊 {t("មើលតារាងចំណាត់ថ្នាក់ប្រចាំថ្នាក់", "View Class Broadsheet Ranking")}
                    </Button>
                )}
            </div>

            <Card>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: '220px' }}>
                            <Input 
                                placeholder={t("ស្វែងរកឈ្មោះ/អត្តលេខ...", "Search student...")} 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ margin: 0 }}
                            />
                        </div>

                        {/* Academic Year Filter */}
                        <div style={{ minWidth: '160px' }}>
                            <select 
                                value={selectedAcademicYear} 
                                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#4f46e5', fontWeight: '700', backgroundColor: '#f8fafc' }}
                            >
                                <option value="">🗓️ {t("ឆ្នាំសិក្សាទាំងអស់", "All Academic Years")}</option>
                                <option value="2026-2027">2026-2027</option>
                                <option value="2025-2026">2025-2026</option>
                                <option value="2024-2025">2024-2025</option>
                            </select>
                        </div>

                        {/* Semester Filter */}
                        <div style={{ minWidth: '160px' }}>
                            <select 
                                value={selectedSemesterId} 
                                onChange={(e) => setSelectedSemesterId(e.target.value)}
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}
                            >
                                <option value="">🔖 {t("ឆមាសទាំងអស់", "All Semesters")}</option>
                                {semesters.map(sem => (
                                    <option key={sem.id} value={sem.id}>{sem.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Class Filter */}
                        <div style={{ minWidth: '180px' }}>
                            <select 
                                value={selectedClassId} 
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}
                            >
                                <option value="">🏫 {t("ថ្នាក់រៀនទាំងអស់", "All Classes")}</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>
                                        ថ្នាក់ {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {(search || selectedClassId || selectedAcademicYear || selectedSemesterId) && (
                            <Button size="small" variant="secondary" onClick={() => { setSearch(''); setSelectedClassId(''); setSelectedAcademicYear(''); setSelectedSemesterId(''); }}>
                                {t("លុបការស្វែងរក ✖️", "Clear Filters ✖️")}
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

            {/* Official MoEYS Student Report Card Preview Modal */}
            <Modal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                title={t("សៀវភៅតាមដានលទ្ធផលសិក្សាផ្លូវការ", "Official Academic Report Card")}
                maxWidth="850px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>{t("បិទ", "Close")}</Button>
                        <Button variant="primary" onClick={handlePrint} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                            🖨️ {t("បោះពុម្ពសៀវភៅតាមដាន (Print PDF)", "Print Official PDF")}
                        </Button>
                    </div>
                }
            >
                {loadingReport ? (
                    <p style={{ padding: '2rem', textAlign: 'center' }}>{t("កំពុងរៀបចំទិន្នន័យសៀវភៅតាមដាន...", "Generating report card...")}</p>
                ) : reportData ? (
                    <div className="printable-report-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem' }}>
                        
                        {/* MoEYS Official Kingdom Header */}
                        <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.1rem', fontWeight: '700' }}>
                                ព្រះរាជាណាចក្រកម្ពុជា ជាតិ សាសនា ព្រះមហាក្សត្រ
                            </h3>
                            <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                                KINGDOM OF CAMBODIA • NATION RELIGION KING
                            </div>
                            <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '1.35rem', color: '#0f172a', fontWeight: '800' }}>
                                សៀវភៅតាមដានលទ្ធផលសិក្សាសិស្ស (សាលារដ្ឋ)
                            </h2>
                            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
                                ឆ្នាំសិក្សា ៖ {reportData.academic_year} | ឆមាស ៖ {reportData.semester}
                            </span>
                        </div>

                        {/* Student Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                            <div>
                                <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>{t("ឈ្មោះសិស្ស", "Student Name")}</span>
                                <strong style={{ color: '#0f172a', fontSize: '1.05rem' }}>{reportData.student?.name}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>{t("អត្តលេខសិស្ស", "Student Code")}</span>
                                <strong style={{ color: '#4f46e5' }}>{reportData.student?.student_code || 'N/A'}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>{t("ថ្នាក់រៀន", "Class")}</span>
                                <strong style={{ color: '#0f172a' }}>{reportData.student?.class?.name || 'N/A'}</strong>
                            </div>
                        </div>

                        {/* MoEYS Summary Metrics Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                            <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                                <span style={{ fontSize: '0.75rem', color: '#1e40af', display: 'block' }}>{t("ពិន្ទុសរុប", "Total Score")}</span>
                                <strong style={{ fontSize: '1.2rem', color: '#1d4ed8' }}>{reportData.total_score}</strong>
                            </div>
                            <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block' }}>{t("មធ្យមភាគ %", "Average %")}</span>
                                <strong style={{ fontSize: '1.2rem', color: '#15803d' }}>{reportData.average}%</strong>
                            </div>
                            <div style={{ background: '#faf5ff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                                <span style={{ fontSize: '0.75rem', color: '#6b21a8', display: 'block' }}>{t("ពិន្ទុលើ ៥០", "Score / 50")}</span>
                                <strong style={{ fontSize: '1.2rem', color: '#7e22ce' }}>{reportData.score_out_of_50}</strong>
                            </div>
                            <div style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                                <span style={{ fontSize: '0.75rem', color: '#92400e', display: 'block' }}>{t("និទ្ទេស (Grade)", "Grade")}</span>
                                <strong style={{ fontSize: '1.1rem', color: reportData.grade_mention?.color || '#b45309' }}>
                                    {reportData.grade_mention?.code} ({reportData.grade_mention?.khmer})
                                </strong>
                            </div>
                            <div style={{ background: '#fdf2f8', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fbcfe8' }}>
                                <span style={{ fontSize: '0.75rem', color: '#9d174d', display: 'block' }}>{t("ចំណាត់ថ្នាក់", "Rank")}</span>
                                <strong style={{ fontSize: '1.2rem', color: '#be185d' }}>
                                    {reportData.rank ? `#${reportData.rank} / ${reportData.total_students}` : 'N/A'}
                                </strong>
                            </div>
                        </div>

                        {/* Result Status Banner */}
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            backgroundColor: reportData.is_passed ? '#dcfce7' : '#fee2e2',
                            color: reportData.is_passed ? '#15803d' : '#b91c1c',
                            fontWeight: '800',
                            fontSize: '1.1rem',
                            border: `1px solid ${reportData.is_passed ? '#86efac' : '#fca5a5'}`
                        }}>
                            {t("លទ្ធផលសិក្សា ៖", "Result Status:")} {reportData.result_status} (ពិន្ទុជាប់ ៖ ២៥.០០ / ៥០)
                        </div>

                        {/* Subject Assessment Table */}
                        <div>
                            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', color: '#0f172a' }}>
                                📘 {t("ពិន្ទុ និង និទ្ទេសតាមមុខវិជ្ជា", "Subject Assessment Scores & Grades")}
                            </h3>
                            <Table columns={subjectColumns} data={reportData.subjects || []} />
                        </div>

                        {/* Signatures Footer */}
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '0.88rem' }}>
                            <div>
                                <p style={{ margin: 0, fontWeight: '700' }}>បានឃើញ និង ឯកភាព</p>
                                <p style={{ margin: '0.2rem 0 3rem 0', color: '#64748b' }}>នាយក/នាយិកាសាលា</p>
                                <p style={{ fontStyle: 'italic', color: '#94a3b8' }}>(ហត្ថលេខា និង ត្រា)</p>
                            </div>
                            <div>
                                <p style={{ margin: 0, fontWeight: '700' }}>គ្រូបន្ទុកថ្នាក់</p>
                                <p style={{ margin: '0.2rem 0 3rem 0', color: '#64748b' }}>គ្រូប្រចាំថ្នាក់</p>
                                <p style={{ fontStyle: 'italic', color: '#94a3b8' }}>(ហត្ថលេខា)</p>
                            </div>
                        </div>

                    </div>
                ) : (
                    <p style={{ color: 'red' }}>{t("មិនមានទិន្នន័យសម្រាប់បង្ហាញឡើយ", "No report card data available.")}</p>
                )}
            </Modal>

            {/* Class Broadsheet Summary Ranking Modal */}
            <Modal
                isOpen={isClassSummaryModalOpen}
                onClose={() => setIsClassSummaryModalOpen(false)}
                title={t("តារាងចំណាត់ថ្នាក់សិស្សប្រចាំថ្នាក់ (MoEYS Class Broadsheet)", "Class Ranking Summary Broadsheet")}
                maxWidth="900px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Button variant="secondary" onClick={() => setIsClassSummaryModalOpen(false)}>{t("បិទ", "Close")}</Button>
                        <Button variant="primary" onClick={handlePrint} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                            🖨️ {t("បោះពុម្ពតារាងចំណាត់ថ្នាក់", "Print Ranking Sheet")}
                        </Button>
                    </div>
                }
            >
                {classSummaryData ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>ថ្នាក់ ៖ {classSummaryData.class?.name}</h3>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    សិស្សសរុប ៖ {classSummaryData.summary?.total_students} នាក់ | ជាប់ ៖ {classSummaryData.summary?.passed_count} នាក់ | ធ្លាក់ ៖ {classSummaryData.summary?.failed_count} នាក់
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block' }}>មធ្យមភាគថ្នាក់</span>
                                <strong style={{ fontSize: '1.2rem', color: '#4f46e5' }}>{classSummaryData.summary?.class_average}%</strong>
                            </div>
                        </div>

                        <Table columns={rankingColumns} data={classSummaryData.rankings || []} />
                    </div>
                ) : (
                    <p style={{ padding: '1rem' }}>{t("កំពុងរៀបចំទិន្នន័យ...", "Loading class ranking summary...")}</p>
                )}
            </Modal>
        </div>
    );
};

export default ReportCard;
