import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../../services/subjectService';
import toast from 'react-hot-toast';

const Subjects = () => {
    const { lang, t } = useLanguage();
    const [subjects, setSubjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [viewingSubject, setViewingSubject] = useState(null);

    const [viewMode, setViewMode] = useState('box'); // 'box' or 'table'
    const [streamFilter, setStreamFilter] = useState('all'); // 'all', 'science', 'social'

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        max_score: '100',
        stream: 'all' // 'all', 'science', 'social'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const presetScienceSubjects = [
        { name: t('គណិតវិទ្យា (វិទ្យាសាស្ត្រ)', 'Math (Science)'), code: 'MATH-SCI', desc: 'គណិតវិទ្យាថ្នាក់វិទ្យាសាស្ត្រ (ទី១១-ទី១២)', max_score: '125', stream: 'science' },
        { name: t('រូបវិទ្យា', 'Physics'), code: 'PHYS', desc: 'រូបវិទ្យាថ្នាក់វិទ្យាសាស្ត្រ (ទី១១-ទី១២)', max_score: '75', stream: 'science' },
        { name: t('គីមីវិទ្យា', 'Chemistry'), code: 'CHEM', desc: 'គីមីវិទ្យាថ្នាក់វិទ្យាសាស្ត្រ (ទី១១-ទី១២)', max_score: '75', stream: 'science' },
        { name: t('ជីវវិទ្យា', 'Biology'), code: 'BIOL', desc: 'ជីវវិទ្យាថ្នាក់វិទ្យាសាស្ត្រ (ទី១១-ទី១២)', max_score: '75', stream: 'science' },
        { name: t('អក្សរសាស្ត្រខ្មែរ (វិទ្យាសាស្ត្រ)', 'Khmer (Science)'), code: 'KHM-SCI', desc: 'អក្សរសាស្ត្រខ្មែរថ្នាក់វិទ្យាសាស្ត្រ', max_score: '75', stream: 'science' },
        { name: t('ភាសាអង់គ្លេស', 'English'), code: 'ENGL', desc: 'ភាសាអង់គ្លេសទូទៅ', max_score: '50', stream: 'science' }
    ];

    const presetSocialSubjects = [
        { name: t('អក្សរសាស្ត្រខ្មែរ (សង្គម)', 'Khmer (Social)'), code: 'KHM-SOC', desc: 'អក្សរសាស្ត្រខ្មែរថ្នាក់សង្គម (ទី១១-ទី១២)', max_score: '125', stream: 'social' },
        { name: t('ប្រវត្តិវិទ្យា', 'History'), code: 'HIST', desc: 'ប្រវត្តិវិទ្យាថ្នាក់សង្គម (ទី១១-ទី១២)', max_score: '75', stream: 'social' },
        { name: t('ភូមិវិទ្យា', 'Geography'), code: 'GEOG', desc: 'ភូមិវិទ្យាថ្នាក់សង្គម (ទី១១-ទី១២)', max_score: '75', stream: 'social' },
        { name: t('ពលរដ្ឋវិទ្យា', 'Moral-Civics'), code: 'CIVI', desc: 'សីលធម៌ និងពលរដ្ឋវិទ្យា (ទី១១-ទី១២)', max_score: '75', stream: 'social' },
        { name: t('ផែនដីវិទ្យា', 'Earth Science'), code: 'EART', desc: 'វិទ្យាសាស្ត្រផែនដី និងលំហ (ទី១១-ទី១២)', max_score: '75', stream: 'social' },
        { name: t('គណិតវិទ្យា (សង្គម)', 'Math (Social)'), code: 'MATH-SOC', desc: 'គណិតវិទ្យាថ្នាក់សង្គម', max_score: '75', stream: 'social' }
    ];

    const fetchSubjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getSubjects();
            setSubjects(response.data.subjects || []);
        } catch (err) {
            console.error("Failed to fetch subjects:", err);
            setError(t("មានបញ្ហាក្នុងការទាញយកទិន្នន័យមុខវិជ្ជា", "Failed to load subjects. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const generateSubjectCode = (subjectName = '') => {
        if (!subjectName || subjectName.trim() === '') {
            return `SUB-${String(subjects.length + 1).padStart(3, '0')}`;
        }
        const lower = subjectName.toLowerCase();
        if (lower.includes('math') || lower.includes('គណិត')) return 'MATH';
        if (lower.includes('khmer') || lower.includes('ខ្មែរ')) return 'KHM';
        if (lower.includes('physic') || lower.includes('រូប')) return 'PHYS';
        if (lower.includes('chem') || lower.includes('គីមី')) return 'CHEM';
        if (lower.includes('bio') || lower.includes('ជីវ')) return 'BIOL';
        if (lower.includes('hist') || lower.includes('ប្រវត្តិ')) return 'HIST';
        if (lower.includes('geog') || lower.includes('ភូមិ')) return 'GEOG';
        if (lower.includes('eng') || lower.includes('អង់គ្លេស')) return 'ENGL';
        if (lower.includes('comp') || lower.includes('ict') || lower.includes('កុំព្យូទ័រ')) return 'COMP';

        const cleanStr = subjectName.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanStr.length >= 3) {
            return cleanStr.substring(0, 4).toUpperCase();
        }
        return `SUB-${String(subjects.length + 1).padStart(3, '0')}`;
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'name') {
            const autoCode = generateSubjectCode(value);
            setFormData(prev => ({
                ...prev,
                name: value,
                code: autoCode
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateSubject(editingId, formData);
                toast.success(t("បានកែប្រែមេរៀន/មុខវិជ្ជាដោយជោគជ័យ!", "Subject updated successfully!"));
            } else {
                await createSubject(formData);
                toast.success(t("បានបន្ថែមមុខវិជ្ជាថ្មីដោយជោគជ័យ!", "Subject created successfully!"));
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ name: '', code: '', description: '', max_score: '100' });
            fetchSubjects();
        } catch (err) {
            console.error("Failed to save subject:", err);
            toast.error(t("មានបញ្ហាក្នុងការរក្សាទុកមុខវិជ្ជា៖ ", "Error saving subject: ") + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (subject) => {
        setEditingId(subject.id);
        setFormData({
            name: subject.name,
            code: subject.code || '',
            description: subject.description || '',
            max_score: subject.max_score || 100
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t("តើអ្នកពិតជាចង់លុបមុខវិជ្ជានេះមែនទេ?", "Are you sure you want to delete this subject?"))) {
            try {
                await deleteSubject(id);
                fetchSubjects();
                toast.success(t("បានលុបមុខវិជ្ជាដោយជោគជ័យ!", "Subject deleted successfully!"));
            } catch (err) {
                console.error("Failed to delete subject:", err);
                toast.error(t("មានបញ្ហាក្នុងការលុបមុខវិជ្ជា៖ ", "Error deleting subject: ") + (err.response?.data?.message || err.message));
            }
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' },
        { 
            header: t('កូដមុខវិជ្ជា', 'Subject Code'), 
            render: (row) => (
                <span style={{ fontWeight: '700', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {row.code}
                </span>
            ) 
        },
        { 
            header: t('ឈ្មោះមុខវិជ្ជា', 'Subject Name'), 
            render: (row) => <strong>📘 {row.name}</strong> 
        },
        { 
            header: t('ផ្នែក/កម្រិត (Stream)', 'Stream'), 
            render: (row) => {
                const stream = row.stream || 'all';
                if (stream === 'science') {
                    return (
                        <span style={{ fontWeight: '700', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.82rem', border: '1px solid #bae6fd' }}>
                            🧪 វិទ្យាសាស្ត្រ (ទី១១-១២)
                        </span>
                    );
                } else if (stream === 'social') {
                    return (
                        <span style={{ fontWeight: '700', color: '#c05621', backgroundColor: '#feebc8', padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.82rem', border: '1px solid #fbd38d' }}>
                            📚 សង្គម (ទី១១-១២)
                        </span>
                    );
                }
                return (
                    <span style={{ fontWeight: '600', color: '#475569', backgroundColor: '#f1f5f9', padding: '0.25rem 0.6rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                        🌐 ទូទៅ (គ្រប់ថ្នាក់)
                    </span>
                );
            }
        },
        { 
            header: t('ពិន្ទុអតិបរមា (Max Score)', 'Max Score'), 
            render: (row) => (
                <span style={{ fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    💯 {row.max_score || 100} ពិន្ទុ
                </span>
            ) 
        },
        { 
            header: t('ការពិពណ៌នា', 'Description'), 
            render: (row) => <span style={{ color: '#64748b', fontSize: '0.88rem' }}>{row.description || '-'}</span> 
        },
        { 
            header: t('សកម្មភាព', 'Actions'), 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button 
                        size="small" 
                        variant="secondary" 
                        onClick={(e) => { e.stopPropagation(); setViewingSubject(row); }}
                        title={t("មើលព័ត៌មានលម្អិត", "View Details")}
                    >
                        👁️
                    </Button>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}>{t("កែប្រែ", "Edit")}</Button>
                    <Button size="small" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>{t("លុប", "Delete")}</Button>
                </div>
            ) 
        }
    ];

    const filteredSubjects = subjects.filter(subject => {
        const matchesSearch = !search || 
            (subject.name && subject.name.toLowerCase().includes(search.toLowerCase())) ||
            (subject.code && subject.code.toLowerCase().includes(search.toLowerCase())) ||
            (subject.description && subject.description.toLowerCase().includes(search.toLowerCase()));

        const matchesStream = streamFilter === 'all' || (subject.stream || 'all') === streamFilter;

        return matchesSearch && matchesStream;
    });

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("គ្រប់គ្រងមុខវិជ្ជា 📚", "Manage Subjects 📚")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("បង្កើត កែប្រែ និង គ្រប់គ្រងបញ្ជីមុខវិជ្ជាសិក្សាក្នុងសាលា រួមទាំងថ្នាក់វិទ្យាសាស្ត្រ និង សង្គម។", "Add, edit, and manage school subjects and curriculum course codes.")}
                    </p>
                </div>
                <Button onClick={() => { 
                    setEditingId(null); 
                    setFormData({ name: '', code: generateSubjectCode(''), description: '', max_score: '100', stream: 'all' }); 
                    setIsModalOpen(true); 
                }}>
                    + {t("បន្ថែមមុខវិជ្ជា", "Add Subject")}
                </Button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <Card>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: '280px' }}>
                            <Input 
                                placeholder={t("ស្វែងរកឈ្មោះមុខវិជ្ជា, កូដ...", "Search subject name, code...")} 
                                value={search}
                                onChange={handleSearch}
                                style={{ margin: 0 }}
                            />
                        </div>

                        {/* Stream Filter Buttons */}
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setStreamFilter('all')}
                                style={{
                                    padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700',
                                    border: streamFilter === 'all' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                                    background: streamFilter === 'all' ? '#0284c7' : '#ffffff',
                                    color: streamFilter === 'all' ? '#ffffff' : '#475569', cursor: 'pointer'
                                }}
                            >
                                🌐 ទាំងអស់
                            </button>
                            <button
                                onClick={() => setStreamFilter('science')}
                                style={{
                                    padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700',
                                    border: streamFilter === 'science' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                                    background: streamFilter === 'science' ? '#0284c7' : '#ffffff',
                                    color: streamFilter === 'science' ? '#ffffff' : '#475569', cursor: 'pointer'
                                }}
                            >
                                🧪 ថ្នាក់វិទ្យាសាស្ត្រ (ទី១១-១២)
                            </button>
                            <button
                                onClick={() => setStreamFilter('social')}
                                style={{
                                    padding: '0.45rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700',
                                    border: streamFilter === 'social' ? '1px solid #c05621' : '1px solid #cbd5e1',
                                    background: streamFilter === 'social' ? '#c05621' : '#ffffff',
                                    color: streamFilter === 'social' ? '#ffffff' : '#475569', cursor: 'pointer'
                                }}
                            >
                                📚 ថ្នាក់សង្គម (ទី១១-១២)
                            </button>
                        </div>

                        {/* View Mode Switcher */}
                        <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                            <button
                                onClick={() => setViewMode('box')}
                                style={{
                                    padding: '0.4rem 0.75rem', border: 'none', fontSize: '0.8rem', fontWeight: '700',
                                    background: viewMode === 'box' ? '#0284c7' : 'transparent',
                                    color: viewMode === 'box' ? '#ffffff' : '#64748b', cursor: 'pointer'
                                }}
                            >
                                🎴 ទម្រង់ប្រអប់ (Box)
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                style={{
                                    padding: '0.4rem 0.75rem', border: 'none', fontSize: '0.8rem', fontWeight: '700',
                                    background: viewMode === 'table' ? '#0284c7' : 'transparent',
                                    color: viewMode === 'table' ? '#ffffff' : '#64748b', cursor: 'pointer'
                                }}
                            >
                                📋 ទម្រង់តារាង (Table)
                            </button>
                        </div>

                        {search && (
                            <Button size="small" variant="secondary" onClick={() => setSearch('')}>
                                {t("លុប ✖️", "Clear ✖️")}
                            </Button>
                        )}

                        <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.88rem', fontWeight: '600' }}>
                            {t(`បង្ហាញមុខវិជ្ជាចំនួន ${filteredSubjects.length}`, `Showing ${filteredSubjects.length} Subjects`)}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <p>{t("កំពុងទាញយកមុខវិជ្ជា...", "Loading subjects...")}</p>
                ) : filteredSubjects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{t("មិនទាន់មានមុខវិជ្ជាក្នុងប្រព័ន្ធនៅឡើយទេ", "No subjects found")}</p>
                    </div>
                ) : viewMode === 'box' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {filteredSubjects.map(subject => {
                            const stream = subject.stream || 'all';
                            const isScience = stream === 'science';
                            const isSocial = stream === 'social';

                            const cardBorder = isScience ? '1px solid #bae6fd' : isSocial ? '1px solid #fbd38d' : '1px solid #e2e8f0';
                            const cardHeaderBg = isScience ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : isSocial ? 'linear-gradient(135deg, #fffaf0 0%, #feebc8 100%)' : '#f8fafc';

                            return (
                                <div key={subject.id} style={{
                                    background: '#ffffff', borderRadius: '14px', border: cardBorder,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden',
                                    display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease'
                                }}>
                                    {/* Box Header */}
                                    <div style={{ background: cardHeaderBg, padding: '1rem 1.25rem', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                📘 {subject.name}
                                            </h3>
                                            <span style={{ fontWeight: '800', color: '#0369a1', backgroundColor: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #bae6fd' }}>
                                                {subject.code}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            {isScience ? (
                                                <span style={{ fontWeight: '700', color: '#0284c7', backgroundColor: '#ffffff', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #bae6fd' }}>
                                                    🧪 វិទ្យាសាស្ត្រ (ទី១១-១២)
                                                </span>
                                            ) : isSocial ? (
                                                <span style={{ fontWeight: '700', color: '#c05621', backgroundColor: '#ffffff', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #fbd38d' }}>
                                                    📚 សង្គម (ទី១១-១២)
                                                </span>
                                            ) : (
                                                <span style={{ fontWeight: '600', color: '#475569', backgroundColor: '#ffffff', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #e2e8f0' }}>
                                                    🌐 ទូទៅ (គ្រប់ថ្នាក់)
                                                </span>
                                            )}

                                            <span style={{ fontWeight: '800', color: '#166534', backgroundColor: '#dcfce7', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #bbf7d0' }}>
                                                💯 {subject.max_score || 100} ពិន្ទុ
                                            </span>
                                        </div>
                                    </div>

                                    {/* Box Body */}
                                    <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
                                            {subject.description || 'គ្មានការពិពណ៌នា'}
                                        </p>

                                        {/* Box Footer Actions */}
                                        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0' }}>
                                            <Button 
                                                size="small" 
                                                variant="secondary" 
                                                onClick={() => setViewingSubject(subject)}
                                                style={{ flex: 1, fontSize: '0.8rem' }}
                                            >
                                                👁️ មើល
                                            </Button>
                                            <Button 
                                                size="small" 
                                                variant="secondary" 
                                                onClick={() => handleEditClick(subject)}
                                                style={{ flex: 1, fontSize: '0.8rem' }}
                                            >
                                                ✏️ កែប្រែ
                                            </Button>
                                            <Button 
                                                size="small" 
                                                variant="danger" 
                                                onClick={() => handleDelete(subject.id)}
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                            >
                                                🗑️
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <Table columns={columns} data={filteredSubjects} />
                )}
            </Card>

            {/* Modal Add/Edit Subject */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => { if (!isSubmitting) { setIsModalOpen(false); setEditingId(null); } }}
                title={`${editingId ? '✏️' : '📘'} ${editingId ? t("កែប្រែព័ត៌មានមុខវិជ្ជា", "Edit Subject Information") : t("បន្ថែមមុខវិជ្ជាថ្មីក្នុងប្រព័ន្ធ", "Add New Subject to System")}`}
                maxWidth="650px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} style={{ padding: '0.6rem 1.25rem' }}>
                            {t("បោះបង់ (Cancel)", "Cancel")}
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={isSubmitting}
                            style={{
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: '#ffffff', fontWeight: '700', padding: '0.6rem 1.5rem',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                            }}
                        >
                            {isSubmitting ? t("កំពុងរក្សាទុក...", "Saving...") : (editingId ? t("💾 បច្ចុប្បន្នភាពមុខវិជ្ជា", "Update Subject") : t("➕ រក្សាទុកមុខវិជ្ជា", "Save Subject"))}
                        </Button>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Preset Quick Select Buttons */}
                    {!editingId && (
                        <div style={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '0.75rem'
                        }}>
                            {/* Science Stream Presets */}
                            <div>
                                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                                    🧪 មុខវិជ្ជាថ្នាក់វិទ្យាសាស្ត្រ (Grade 11 & 12 Science Stream Presets) ៖
                                </span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {presetScienceSubjects.map(preset => {
                                        const isSelected = formData.name === preset.name;
                                        return (
                                            <button
                                                key={preset.code}
                                                type="button"
                                                onClick={() => setFormData({ name: preset.name, code: preset.code, description: preset.desc, max_score: preset.max_score, stream: preset.stream })}
                                                style={{
                                                    padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700',
                                                    border: isSelected ? '1px solid #0284c7' : '1px solid #bae6fd',
                                                    background: isSelected ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#e0f2fe',
                                                    color: isSelected ? '#ffffff' : '#0369a1',
                                                    cursor: 'pointer', transition: 'all 0.15s ease'
                                                }}
                                            >
                                                🧪 {preset.name} ({preset.max_score}ពិន្ទុ)
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Social Stream Presets */}
                            <div>
                                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#c05621', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                                    📚 មុខវិជ្ជាថ្នាក់សង្គម (Grade 11 & 12 Social Stream Presets) ៖
                                </span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {presetSocialSubjects.map(preset => {
                                        const isSelected = formData.name === preset.name;
                                        return (
                                            <button
                                                key={preset.code}
                                                type="button"
                                                onClick={() => setFormData({ name: preset.name, code: preset.code, description: preset.desc, max_score: preset.max_score, stream: preset.stream })}
                                                style={{
                                                    padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700',
                                                    border: isSelected ? '1px solid #c05621' : '1px solid #fbd38d',
                                                    background: isSelected ? 'linear-gradient(135deg, #ea580c 0%, #c05621 100%)' : '#feebc8',
                                                    color: isSelected ? '#ffffff' : '#9c4221',
                                                    cursor: 'pointer', transition: 'all 0.15s ease'
                                                }}
                                            >
                                                📚 {preset.name} ({preset.max_score}ពិន្ទុ)
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subject Name, Code & Stream Card */}
                    <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.75rem' }}>
                            <Input 
                                label={t("📘 ឈ្មោះមុខវិជ្ជា", "Subject Name")} 
                                name="name" 
                                value={formData.name} 
                                onChange={handleInputChange} 
                                required 
                                placeholder="ឧទាហរណ៍ ៖ គណិតវិទ្យា, ភាសាខ្មែរ..." 
                            />
                            <Input 
                                label={t("🏷️ កូដមុខវិជ្ជា", "Subject Code")} 
                                name="code" 
                                value={formData.code} 
                                onChange={handleInputChange} 
                                required 
                                placeholder="e.g. MATH" 
                            />
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#334155' }}>
                                    🎓 ផ្នែក (Stream) ៖
                                </label>
                                <select
                                    name="stream"
                                    value={formData.stream || 'all'}
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '700' }}
                                >
                                    <option value="all">🌐 មុខវិជ្ជាទូទៅ (គ្រប់ថ្នាក់)</option>
                                    <option value="science">🧪 ថ្នាក់វិទ្យាសាស្ត្រ (ទី១១-១២)</option>
                                    <option value="social">📚 ថ្នាក់សង្គម (ទី១១-១២)</option>
                                </select>
                            </div>
                        </div>

                        {/* Max Score Setting Block */}
                        <div style={{ background: '#f0fdf4', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.88rem', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    💯 ពិន្ទុអតិបរមា / ពិន្ទុពេញ (Max Score) ៖
                                </label>
                                <span style={{ fontSize: '0.78rem', color: '#15803d' }}>កំណត់ពិន្ទុអតិបរមាសម្រាបទំព័របញ្ចូលពិន្ទុសិស្ស</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {[100, 75, 50].map(score => (
                                    <button
                                        key={score}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, max_score: String(score) }))}
                                        style={{
                                            padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700',
                                            border: String(formData.max_score) === String(score) ? '1px solid #16a34a' : '1px solid #cbd5e1',
                                            background: String(formData.max_score) === String(score) ? '#16a34a' : '#ffffff',
                                            color: String(formData.max_score) === String(score) ? '#ffffff' : '#334155',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {score} ពិន្ទុ
                                    </button>
                                ))}
                                <input
                                    type="number"
                                    name="max_score"
                                    value={formData.max_score}
                                    onChange={handleInputChange}
                                    required
                                    min="1"
                                    style={{
                                        width: '80px', padding: '0.45rem', borderRadius: '8px',
                                        border: '1px solid #86efac', fontSize: '0.95rem', fontWeight: '800',
                                        textAlign: 'center', color: '#15803d', backgroundColor: '#ffffff'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description Block */}
                    <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: '800', color: '#334155' }}>
                            📝 {t("ការពិពណ៌នាអំពីមុខវិជ្ជា (Description)", "Subject Description")}
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder={t("ពិពណ៌នាសង្ខេបអំពីកម្មវិធីសិក្សានៃមុខវិជ្ជានេះ...", "Brief description of subject curriculum...")}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
                        />
                    </div>
                </form>
            </Modal>

            {/* View Details Modal */}
            <Modal
                isOpen={!!viewingSubject}
                onClose={() => setViewingSubject(null)}
                title={t("ព័ត៌មានលម្អិតមុខវិជ្ជា 👁️", "Subject Details 👁️")}
                footer={<Button variant="secondary" onClick={() => setViewingSubject(null)}>{t("បិទ (Close)", "Close")}</Button>}
            >
                {viewingSubject && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f0f9ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                            <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', boxShadow: '0 4px 10px rgba(2,132,199,0.3)' }}>
                                📘
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>{viewingSubject.name}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: '800', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                                        កូដ ៖ {viewingSubject.code}
                                    </span>
                                    {viewingSubject.stream === 'science' ? (
                                        <span style={{ fontWeight: '700', color: '#0284c7', backgroundColor: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #bae6fd' }}>
                                            🧪 វិទ្យាសាស្ត្រ (ទី១១-១២)
                                        </span>
                                    ) : viewingSubject.stream === 'social' ? (
                                        <span style={{ fontWeight: '700', color: '#c05621', backgroundColor: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #fbd38d' }}>
                                            📚 សង្គម (ទី១១-១២)
                                        </span>
                                    ) : (
                                        <span style={{ fontWeight: '600', color: '#475569', backgroundColor: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                                            🌐 ទូទៅ (គ្រប់ថ្នាក់)
                                        </span>
                                    )}
                                    <span style={{ fontWeight: '800', color: '#166534', backgroundColor: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #bbf7d0' }}>
                                        💯 ពិន្ទុពេញ ៖ {viewingSubject.max_score || 100} ពិន្ទុ
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ display: 'block', fontSize: '0.88rem', color: '#64748b', marginBottom: '0.4rem' }}>{t("ការពិពណ៌នាមុខវិជ្ជា ៖", "Description:")}</strong>
                            <p style={{ margin: 0, color: '#0f172a', lineHeight: '1.5' }}>{viewingSubject.description || t("គ្មានការពិពណ៌នាឡើយ", "No description provided.")}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Subjects;
