import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { getClasses } from '../../services/classService';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheckSquare, FiAward, FiArrowRight, FiCheckCircle, FiAlertTriangle, FiUserCheck } from 'react-icons/fi';

const getImageUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
    return `${baseUrl}/${photo.replace(/^\//, '')}`;
};

const StudentPromotion = () => {
    const { lang, t } = useLanguage();
    const [classes, setClasses] = useState([]);
    
    const [sourceClassId, setSourceClassId] = useState('');
    const [targetClassId, setTargetClassId] = useState('');
    const [action, setAction] = useState('promote'); // 'promote', 'repeat', 'graduate'
    
    const [students, setStudents] = useState([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);

    useEffect(() => {
        const fetchClassesList = async () => {
            try {
                const res = await getClasses();
                const clsList = res.data.classes || res.data || [];
                setClasses(clsList);
                if (clsList.length > 0) {
                    setSourceClassId(clsList[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch classes:", err);
                toast.error(t("មានបញ្ហាក្នុងការទាញយកបញ្ជីថ្នាក់រៀន", "Failed to load classes list."));
            } finally {
                setLoadingClasses(false);
            }
        };
        fetchClassesList();
    }, []);

    // Fetch students preview when sourceClassId changes
    useEffect(() => {
        if (!sourceClassId) return;

        const fetchPreview = async () => {
            setLoadingPreview(true);
            try {
                const res = await api.get(`/admin/promotion/preview?class_id=${sourceClassId}`);
                const studentList = res.data.students || [];
                setStudents(studentList);
                
                // By default select all PASSED students if action is 'promote'
                const passedIds = studentList.filter(s => s.is_passed).map(s => s.id);
                setSelectedStudentIds(passedIds);
            } catch (err) {
                console.error("Failed to fetch promotion preview:", err);
                toast.error(t("មានបញ្ហាក្នុងការទាញយកទិន្នន័យសិស្ស", "Failed to preview class students."));
            } finally {
                setLoadingPreview(false);
            }
        };

        fetchPreview();
    }, [sourceClassId]);

    // Handle Select All / Filter Selection
    const handleSelectPassedOnly = () => {
        const passedIds = students.filter(s => s.is_passed).map(s => s.id);
        setSelectedStudentIds(passedIds);
    };

    const handleSelectFailedOnly = () => {
        const failedIds = students.filter(s => !s.is_passed).map(s => s.id);
        setSelectedStudentIds(failedIds);
    };

    const handleSelectAllToggle = (e) => {
        if (e.target.checked) {
            setSelectedStudentIds(students.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleStudentCheckboxToggle = (id) => {
        setSelectedStudentIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleExecutePromotion = async () => {
        if (selectedStudentIds.length === 0) {
            toast.error("សូមជ្រើសរើសសិស្សយ៉ាងហោចណាស់ 1 នាក់ដើម្បីដំឡើងថ្នាក់!");
            return;
        }

        if (action !== 'graduate' && !targetClassId) {
            toast.error("សូមជ្រើសរើសថ្នាក់គោលដៅឆ្នាំសិក្សាថ្មី!");
            return;
        }

        const actionConfirmText = action === 'graduate' 
            ? t('បញ្ចប់ការសិក្សា', 'Graduate') 
            : action === 'promote' 
            ? t('ដំឡើងថ្នាក់', 'Promote') 
            : t('ត្រួតថ្នាក់', 'Repeat');

        if (!window.confirm(`តើអ្នកពិតជាចង់អនុវត្ត «${actionConfirmText}» សម្រាប់សិស្សចំនួន ${selectedStudentIds.length} នាក់មែនទេ?`)) {
            return;
        }

        setIsExecuting(true);
        try {
            const payload = {
                student_ids: selectedStudentIds,
                action: action,
                target_class_id: action === 'graduate' ? null : targetClassId
            };

            const res = await api.post('/admin/promotion/execute', payload);
            toast.success(res.data.message || "អនុវត្តការដំឡើងថ្នាក់ដោយជោគជ័យ! 🎉");

            // Refresh preview
            const previewRes = await api.get(`/admin/promotion/preview?class_id=${sourceClassId}`);
            setStudents(previewRes.data.students || []);
            setSelectedStudentIds([]);
        } catch (err) {
            console.error("Promotion failed:", err);
            toast.error(err.response?.data?.message || "មានបញ្ហាក្នុងការដំឡើងថ្នាក់សិស្ស");
        } finally {
            setIsExecuting(false);
        }
    };

    const statusBadge = (row) => {
        if (row.is_passed) {
            return (
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontWeight: '700', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    🟢 {t("ជាប់ (PASS)", "PASS")}
                </span>
            );
        }
        return (
            <span style={{ padding: '0.25rem 0.75rem', borderRadius: '12px', background: '#fee2e2', color: '#b91c1c', fontWeight: '700', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                🔴 {t("ធ្លាក់ (FAIL)", "FAIL")}
            </span>
        );
    };

    const columns = [
        {
            header: (
                <input 
                    type="checkbox" 
                    checked={students.length > 0 && selectedStudentIds.length === students.length} 
                    onChange={handleSelectAllToggle}
                />
            ),
            render: (row) => (
                <input 
                    type="checkbox" 
                    checked={selectedStudentIds.includes(row.id)} 
                    onChange={() => handleStudentCheckboxToggle(row.id)}
                />
            )
        },
        { header: t('អត្តលេខ', 'Code'), accessor: 'student_code' },
        {
            header: t('ឈ្មោះសិស្ស', 'Name'),
            render: (row) => {
                const photoUrl = getImageUrl(row.photo);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {photoUrl ? (
                            <img src={photoUrl} alt={row.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1' }} />
                        ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {row.name ? row.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                        )}
                        <strong style={{ color: '#0f172a' }}>{row.name}</strong>
                    </div>
                );
            }
        },
        { header: t('ភេទ', 'Gender'), accessor: 'gender' },
        { header: t('មធ្យមភាគ %', 'Average %'), render: (row) => <strong>{row.average}%</strong> },
        { header: t('ពិន្ទុលើ ៥០', 'Score / 50'), render: (row) => <strong>{row.score_on_50} ➔ {row.final_score_50}</strong> },
        { header: t('លទ្ធផល', 'Result Status'), render: (row) => statusBadge(row) }
    ];

    const sourceClass = classes.find(c => c.id === parseInt(sourceClassId));
    const passedCount = students.filter(s => s.is_passed).length;
    const failedCount = students.filter(s => !s.is_passed).length;

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("🎓 ការដំឡើងថ្នាក់សិស្សចុងឆ្នាំ (Student Promotion)", "Student Promotion & Year-End Rollover 🎓")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("ប្រព័ន្ធគណនាលទ្ធផល «ជាប់/ធ្លាក់» ស្វ័យប្រវត្តិ និង ផ្លាស់ប្តូរសិស្សទៅកាន់ថ្នាក់ថ្មីប្រចាំឆ្នាំសិក្សា។", "Automated year-end grade promotion tool to advance passing students to new classes.")}
                    </p>
                </div>
            </div>

            {/* Workflow Step Control Panel */}
            <Card style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⚙️ {t("ការកំណត់ការដំឡើងថ្នាក់ (Promotion Control Panel)", "Promotion Controls")}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', alignItems: 'flex-end' }}>
                    
                    {/* 1. Source Class */}
                    <div>
                        <label style={{ display: 'block', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                            {t("១. ថ្នាក់ដើមឆ្នាំសិក្សាចាស់ ៖", "1. Source Class:")}
                        </label>
                        <select
                            value={sourceClassId}
                            onChange={(e) => setSourceClassId(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', color: '#0f172a', backgroundColor: '#f8fafc' }}
                        >
                            {classes.map(c => {
                                const streamTag = c.stream === 'science' 
                                    ? ' • 🧪 វិទ្យាសាស្ត្រ' 
                                    : c.stream === 'social_science' 
                                    ? ' • 📜 វិទ្យាសាស្ត្រសង្គម' 
                                    : '';
                                return (
                                    <option key={c.id} value={c.id}>
                                        🏫 {c.name} ({t("ថ្នាក់ទី", "Grade")} {c.grade_level}){streamTag}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* 2. Action Type */}
                    <div>
                        <label style={{ display: 'block', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                            {t("២. សកម្មភាព ៖", "2. Action:")}
                        </label>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', color: '#4f46e5', backgroundColor: '#f8fafc' }}
                        >
                            <option value="promote">🎓 {t("ដំឡើងថ្នាក់សិស្សដែល «ជាប់»", "Promote Passed Students")}</option>
                            <option value="repeat">🔴 {t("រក្សាទុកថ្នាក់ដដែលសម្រាប់សិស្ស «ធ្លាក់»", "Retain Failed Students")}</option>
                            <option value="graduate">👨‍🎓 {t("បញ្ចប់ការសិក្សា ថ្នាក់ទី១២", "Graduate Grade 12")}</option>
                        </select>
                    </div>

                    {/* 3. Target Class */}
                    {action !== 'graduate' && (
                        <div>
                            <label style={{ display: 'block', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                                {t("៣. ថ្នាក់គោលដៅឆ្នាំសិក្សាថ្មី ៖", "3. Target Class:")}
                            </label>
                            <select
                                value={targetClassId}
                                onChange={(e) => setTargetClassId(e.target.value)}
                                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', color: '#16a34a', backgroundColor: '#f8fafc' }}
                            >
                                <option value="">-- {t("ជ្រើសរើសថ្នាក់គោលដៅ", "Select Target Class")} --</option>
                                {classes.map(c => {
                                    const streamTag = c.stream === 'science' 
                                        ? ' • 🧪 វិទ្យាសាស្ត្រ' 
                                        : c.stream === 'social_science' 
                                        ? ' • 📜 វិទ្យាសាស្ត្រសង្គម' 
                                        : '';
                                    return (
                                        <option key={c.id} value={c.id}>
                                            ➡️ {c.name} ({t("ថ្នាក់ទី", "Grade")} {c.grade_level}){streamTag}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}

                    {/* Execute Button */}
                    <div>
                        <Button 
                            variant="primary" 
                            onClick={handleExecutePromotion}
                            loading={isExecuting}
                            style={{ width: '100%', padding: '0.65rem 1.25rem', fontWeight: '700', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: '#16a34a' }}
                        >
                            🚀 {t("អនុវត្តការដំឡើងថ្នាក់", "Execute Promotion")} ({selectedStudentIds.length})
                        </Button>
                    </div>

                </div>
            </Card>

            {/* Student Preview Table */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.8rem' }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#0f172a' }}>
                            📋 {t("បញ្ជីសិស្សក្នុងថ្នាក់", "Student List for Class")} {sourceClass?.name || ''} ({students.length} {t("សិស្ស", "Students")})
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', gap: '1rem' }}>
                            <span>🟢 {t("ជាប់:", "Passed:")} <strong>{passedCount}</strong></span>
                            <span>🔴 {t("ធ្លាក់:", "Failed:")} <strong>{failedCount}</strong></span>
                        </div>
                    </div>

                    {/* Filter Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Button size="small" variant="secondary" onClick={handleSelectPassedOnly}>
                            🟢 {t("ជ្រើសរើសតែសិស្ស «ជាប់»", "Select Passed Only")}
                        </Button>
                        <Button size="small" variant="secondary" onClick={handleSelectFailedOnly}>
                            🔴 {t("ជ្រើសរើសតែសិស្ស «ធ្លាក់»", "Select Failed Only")}
                        </Button>
                    </div>
                </div>

                {loadingPreview ? (
                    <p style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>{t("កំពុងគណនាលទ្ធផលចុងឆ្នាំ...", "Calculating annual results...")}</p>
                ) : students.length === 0 ? (
                    <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>{t("មិនមានសិស្សនៅក្នុងថ្នាក់នេះឡើយ", "No students in this class.")}</p>
                ) : (
                    <Table columns={columns} data={students} />
                )}
            </Card>
        </div>
    );
};

export default StudentPromotion;
