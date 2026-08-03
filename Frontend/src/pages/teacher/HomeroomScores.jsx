import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { getTeacherHomeroomSchedule, getClassStudents } from '../../services/teacherService';
import { getClassSummaryReportCard } from '../../services/reportCardService';
import { exportToCSV } from '../../utils/excelExporter';
import toast from 'react-hot-toast';

const HomeroomScores = () => {
    const { lang, t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [homeroomClass, setHomeroomClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [subjectTeachers, setSubjectTeachers] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [classSummaryData, setClassSummaryData] = useState(null);
    const [isClassSummaryModalOpen, setIsClassSummaryModalOpen] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);

    useEffect(() => {
        const fetchHomeroomData = async () => {
            setLoading(true);
            try {
                const schedRes = await getTeacherHomeroomSchedule();
                const sched = schedRes.data.schedule || [];
                const cls = schedRes.data.class || sched[0]?.schoolClass || sched[0]?.class;
                
                if (cls && cls.id) {
                    setHomeroomClass(cls);
                    const studentsRes = await getClassStudents(cls.id);
                    setStudents(studentsRes.data.students || []);
                    setSubjectTeachers(studentsRes.data.subject_teachers || []);
                }
            } catch (err) {
                console.error("Failed to load homeroom scores data:", err);
                toast.error(t("មានបញ្ហាក្នុងការទាញយកទិន្នន័យពិន្ទុថ្នាក់បន្ទុក", "Failed to load homeroom scores"));
            } finally {
                setLoading(false);
            }
        };

        fetchHomeroomData();
    }, [lang]);

    const handleViewClassSummary = async () => {
        if (!homeroomClass?.id) return;
        setLoadingSummary(true);
        try {
            const res = await getClassSummaryReportCard(homeroomClass.id);
            setClassSummaryData(res.data || res);
            setIsClassSummaryModalOpen(true);
        } catch (err) {
            console.error("Failed to load homeroom class summary:", err);
            toast.error(t("មានបញ្ហាក្នុងការទាញយកតារាងចំណាត់ថ្នាក់", "Failed to load class ranking broadsheet."));
        } finally {
            setLoadingSummary(false);
        }
    };

    const filteredStudents = students.filter(st => {
        const query = search.toLowerCase();
        return !search || 
            (st.user?.name && st.user.name.toLowerCase().includes(query)) ||
            (st.student_code && st.student_code.toLowerCase().includes(query)) ||
            (st.class_position && st.class_position.toLowerCase().includes(query));
    });

    const handleExportExcel = () => {
        if (!students || students.length === 0) {
            toast.error("មិនទាន់មានទិន្នន័យសិស្សសម្រាប់ទាញយកទេ!");
            return;
        }

        const className = homeroomClass?.name || 'Homeroom';
        const exportCols = [
            { header: 'កូដសិស្ស', accessor: 'student_code' },
            { header: 'ឈ្មោះសិស្ស', renderText: (s) => s.user?.name || s.name || '' },
            { header: 'តួនាទីក្នុងថ្នាក់', renderText: (s) => s.class_position || 'Member' },
            { header: 'ចំនួនមុខវិជ្ជាមានពិន្ទុ', renderText: (s) => s.scores?.length || 0 },
        ];

        exportToCSV(`Homeroom_Scores_${className}_${new Date().toISOString().slice(0, 10)}.csv`, exportCols, students);
    };

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

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{t("កំពុងទាញយកទិន្នន័យពិន្ទុថ្នាក់បន្ទុក...", "Loading homeroom student scores...")}</p>
            </div>
        );
    }

    if (!homeroomClass) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    <h2 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>👑 {t("លោកគ្រូ/អ្នកគ្រូ មិនទាន់មានថ្នាក់បន្ទុកនៅឡើយទេ", "No Homeroom Class Assigned")}</h2>
                    <p style={{ margin: 0 }}>{t("ទំព័រនេះសម្រាប់តែ គ្រូបន្ទុកថ្នាក់ (Homeroom Teacher) ដើម្បិពិនិត្យមើលពិន្ទុកូនសិស្ស និង បញ្ជីគ្រូបង្រៀនតាមមុខវិជ្ជា។", "This page is for Homeroom Teachers to inspect student scores and subject teachers.")}</p>
                </div>
            </Card>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title">{t(`👑 ពិន្ទុ និង ចំណាត់ថ្នាក់ថ្នាក់បន្ទុក (${homeroomClass.name})`, `Homeroom Scores & Ranks (${homeroomClass.name})`)}</h1>
                    <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.95rem' }}>
                        {t("ពិនិត្យមើលបញ្ជីកូនសិស្សក្នុងថ្នាក់បន្ទុក ចំណាត់ថ្នាក់តាមស្ដង់ដារក្រសួង និង ពិន្ទុតាមមុខវិជ្ជា។", "Inspect homeroom student roster, MoEYS class broadsheet ranking, and subject scores.")}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button 
                        variant="primary" 
                        onClick={handleViewClassSummary}
                        style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                    >
                        📊 {t("មើលតារាងចំណាត់ថ្នាក់ (Broadsheet)", "View Class Broadsheet Ranking")}
                    </Button>
                    <Button variant="secondary" onClick={handleExportExcel} disabled={students.length === 0}>
                        📥 {t("ទាញយក Excel", "Export Excel")}
                    </Button>
                </div>
            </div>

            {/* Subject Teachers Card Summary */}
            {subjectTeachers.length > 0 && (
                <div style={{ background: '#f0f9ff', padding: '1.1rem 1.25rem', borderRadius: '14px', border: '1px solid #bae6fd', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    <strong style={{ color: '#0369a1', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
                        👨‍🏫 {t(`បញ្ជីគ្រូបង្រៀនតាមមុខវិជ្ជា ក្នុងថ្នាក់ ${homeroomClass.name} ៖`, `Subject Teachers of Class ${homeroomClass.name}:`)}
                    </strong>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.65rem' }}>
                        {subjectTeachers.map(st => (
                            <div key={st.subject_id} style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #e0f2fe', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                <div style={{ fontWeight: '800', color: '#0284c7', fontSize: '0.88rem' }}>📘 {st.subject_name} ({st.subject_code})</div>
                                <div style={{ color: '#334155', fontWeight: '700', fontSize: '0.85rem', marginTop: '3px' }}>
                                    👨‍🏫 {st.teacher_name}
                                </div>
                                {st.study_times && st.study_times.length > 0 && (
                                    <div style={{ color: '#059669', fontSize: '0.78rem', fontWeight: '700', marginTop: '4px', background: '#ecfdf5', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                                        ⏰ ម៉ោងសិក្សា ៖ {st.study_times.join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Students Scores Roster */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ width: '300px' }}>
                        <Input 
                            placeholder={t("ស្វែងរកឈ្មោះសិស្ស, កូដ, តួនាទី...", "Search student name, code, position...")} 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ margin: 0 }}
                        />
                    </div>

                    <div style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: '700' }}>
                        {t(`សរុបសិស្ស ៖ ${filteredStudents.length} នាក់`, `Total Students: ${filteredStudents.length}`)}
                    </div>
                </div>

                {filteredStudents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        <p style={{ fontSize: '1rem', fontWeight: '600' }}>{t("រកមិនឃើញសិស្សក្នុងថ្នាក់បន្ទុកនេះទេ", "No students found")}</p>
                    </div>
                ) : (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                    <th style={{ padding: '0.85rem 1rem' }}>#</th>
                                    <th style={{ padding: '0.85rem 1rem' }}>{t("កូដសិស្ស", "Code")}</th>
                                    <th style={{ padding: '0.85rem 1rem' }}>{t("ឈ្មោះសិស្ស", "Student Name")}</th>
                                    <th style={{ padding: '0.85rem 1rem' }}>{t("តួនាទីក្នុងថ្នាក់", "Position")}</th>
                                    <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>{t("មុខវិជ្ជាមានពិន្ទុ", "Scored Subjects")}</th>
                                    <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>{t("សកម្មភាព", "Action")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((st, idx) => {
                                    const scoreCount = st.scores?.length || 0;
                                    return (
                                        <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                            <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{idx + 1}</td>
                                            <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#0284c7' }}>{st.student_code}</td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                <strong>🎓 {st.user?.name || st.name}</strong>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700',
                                                    backgroundColor: st.class_position === 'Class Monitor' ? '#fef3c7' : st.class_position === 'Vice Monitor' ? '#e0e7ff' : '#f1f5f9',
                                                    color: st.class_position === 'Class Monitor' ? '#92400e' : st.class_position === 'Vice Monitor' ? '#3730a3' : '#475569'
                                                }}>
                                                    {st.class_position === 'Class Monitor' ? '👑 ប្រធានថ្នាក់' : st.class_position === 'Vice Monitor' ? '⭐ អនុប្រធានថ្នាក់' : st.class_position || 'សមាជិក'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                <span style={{ fontWeight: '800', color: scoreCount > 0 ? '#15803d' : '#94a3b8', backgroundColor: scoreCount > 0 ? '#dcfce7' : '#f1f5f9', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                                                    📊 {scoreCount} មុខវិជ្ជា
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                <Button 
                                                    size="small"
                                                    onClick={() => setSelectedStudent(st)}
                                                    style={{ backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0', fontWeight: '700', fontSize: '0.82rem' }}
                                                >
                                                    📊 មើលពិន្ទុ & គ្រូបង្រៀន
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Score Modal */}
            <Modal
                isOpen={!!selectedStudent}
                onClose={() => setSelectedStudent(null)}
                title={`📊 ${t("ព័ត៌មានពិន្ទុ និង គ្រូបង្រៀន ៖", "Student Subject Scores & Teachers:")} ${selectedStudent?.user?.name || selectedStudent?.name || ''}`}
                maxWidth="850px"
                footer={<Button variant="secondary" onClick={() => setSelectedStudent(null)}>{t("បិទ", "Close")}</Button>}
            >
                {selectedStudent && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Student Info Card */}
                        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold' }}>
                                    🎓
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#14532d', fontWeight: '800' }}>{selectedStudent.user?.name || selectedStudent.name}</h3>
                                    <span style={{ fontSize: '0.82rem', color: '#166534', fontWeight: '700' }}>
                                        កូដសិស្ស ៖ {selectedStudent.student_code} | តួនាទី ៖ {selectedStudent.class_position || 'សមាជិកថ្នាក់ (Member)'}
                                    </span>
                                </div>
                            </div>

                            <span style={{ backgroundColor: '#ffffff', padding: '0.4rem 0.85rem', borderRadius: '8px', fontWeight: '800', color: '#15803d', fontSize: '0.88rem', border: '1px solid #86efac' }}>
                                🏫 ថ្នាក់ ៖ {homeroomClass?.name}
                            </span>
                        </div>

                        {/* Subject Scores Table */}
                        {(!selectedStudent.scores || selectedStudent.scores.length === 0) ? (
                            <div style={{ textAlign: 'center', padding: '2.5rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                                <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>📭 {t("មិនទាន់មានទិន្នន័យពិន្ទុដែលបានបញ្ចូលសម្រាប់សិស្សនេះនៅឡើយទេ", "No scores recorded for this student yet.")}</p>
                                <span style={{ fontSize: '0.82rem' }}>{t("នៅពេលគ្រូបង្រៀនតាមមុខវិជ្ជាបញ្ចូលពិន្ទុ វានឹងបង្ហាញនៅទីនេះភ្លាមៗ។", "Scores will appear here once subject teachers enter them.")}</span>
                            </div>
                        ) : (
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem 1rem' }}>📘 មុខវិជ្ជា (Subject)</th>
                                            <th style={{ padding: '0.75rem 1rem' }}>👨‍🏫 គ្រូបង្រៀន (Teacher)</th>
                                            <th style={{ padding: '0.75rem 1rem' }}>📝 ការវាយតម្លៃ (Assessment)</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>💯 ពិន្ទុ (Score)</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>📊 ភាគរយ (%)</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>🏆 និទ្ទេស (Grade)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedStudent.scores.map((sc, idx) => (
                                            <tr key={sc.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <strong style={{ color: '#0369a1' }}>📘 {sc.subject_name || 'N/A'}</strong>
                                                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{sc.subject_code}</div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#334155' }}>
                                                    👨‍🏫 {sc.teacher_name || 'មិនទាន់កំណត់'}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                                                    {sc.assessment_name || 'ការវាយតម្លៃទូទៅ'}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '800', color: '#0f172a' }}>
                                                    {sc.score} / {sc.max_score}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                    <span style={{ fontWeight: '800', color: sc.percentage >= 50 ? '#15803d' : '#dc2626', backgroundColor: sc.percentage >= 50 ? '#dcfce7' : '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.82rem' }}>
                                                        {sc.percentage}%
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                    <span style={{ fontWeight: '800', color: '#1e40af', backgroundColor: '#dbeafe', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.82rem' }}>
                                                        {sc.grade || 'N/A'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
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
                        <Button variant="primary" onClick={() => window.print()} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
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

export default HomeroomScores;
