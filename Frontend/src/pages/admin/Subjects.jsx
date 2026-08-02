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

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const presetSubjects = [
        { name: t('គណិតវិទ្យា', 'Mathematics'), code: 'MATH', desc: 'គណិតវិទ្យា និងពិជគណិត' },
        { name: t('អក្សរសាស្ត្រខ្មែរ', 'Khmer Literature'), code: 'KHM', desc: 'ភាសា និងអក្សរសាស្ត្រខ្មែរ' },
        { name: t('រូបវិទ្យា', 'Physics'), code: 'PHYS', desc: 'រូបវិទ្យា និងថាមពល' },
        { name: t('គីមីវិទ្យា', 'Chemistry'), code: 'CHEM', desc: 'គីមីវិទ្យា និងប្រតិកម្ម' },
        { name: t('ជីវវិទ្យា', 'Biology'), code: 'BIOL', desc: 'ជីវវិទ្យា និងប្រព័ន្ធរាងកាយ' },
        { name: t('ប្រវត្តិវិទ្យា', 'History'), code: 'HIST', desc: 'ប្រវត្តិវិទ្យាខ្មែរ និងអន្តរជាតិ' },
        { name: t('ភូមិវិទ្យា', 'Geography'), code: 'GEOG', desc: 'ភូមិវិទ្យា និងបរិស្ថាន' },
        { name: t('ពលរដ្ឋវិទ្យា', 'Moral-Civics'), code: 'CIVI', desc: 'សីលធម៌ និងពលរដ្ឋវិទ្យា' },
        { name: t('ផែនដីវិទ្យា', 'Earth Science'), code: 'EART', desc: 'វិទ្យាសាស្ត្រផែនដី និងលំហ' },
        { name: t('ភាសាអង់គ្លេស', 'English'), code: 'ENGL', desc: 'ភាសាអង់គ្លេសទូទៅ' },
        { name: t('កុំព្យូទ័រ / ICT', 'Computer Science'), code: 'COMP', desc: 'បច្ចេកវិទ្យា និងកុំព្យូទ័រ' },
        { name: t('អប់រំកាយ', 'Physical Education'), code: 'PHYS-ED', desc: 'កីឡា និងសុខភាព' }
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
            setFormData({ name: '', code: '', description: '' });
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
            description: subject.description || ''
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
        return !search || 
            (subject.name && subject.name.toLowerCase().includes(search.toLowerCase())) ||
            (subject.code && subject.code.toLowerCase().includes(search.toLowerCase())) ||
            (subject.description && subject.description.toLowerCase().includes(search.toLowerCase()));
    });

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("គ្រប់គ្រងមុខវិជ្ជា 📚", "Manage Subjects 📚")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("បង្កើត កែប្រែ និង គ្រប់គ្រងបញ្ជីមុខវិជ្ជាសិក្សាក្នុងសាលា។", "Add, edit, and manage school subjects and curriculum course codes.")}
                    </p>
                </div>
                <Button onClick={() => { 
                    setEditingId(null); 
                    setFormData({ name: '', code: generateSubjectCode(''), description: '' }); 
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
                ) : (
                    <Table columns={columns} data={filteredSubjects} />
                )}
            </Card>

            {/* Modal Add/Edit Subject */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => { if (!isSubmitting) { setIsModalOpen(false); setEditingId(null); } }}
                title={editingId ? t("កែប្រែមុខវិជ្ជា", "Edit Subject") : t("បន្ថែមមុខវិជ្ជាថ្មី", "Add New Subject")}
                maxWidth="600px"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>{t("បោះបង់", "Cancel")}</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? t("កំពុងរក្សាទុក...", "Saving...") : t("រក្សាទុក", "Save Subject")}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Preset Quick Select Buttons */}
                    {!editingId && (
                        <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                                ⚡ {t("ជ្រើសរើសមុខវិជ្ជាលឿនៗ (Quick Suggestions):", "Quick Preset Subjects:")}
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {presetSubjects.map(preset => (
                                    <button
                                        key={preset.code}
                                        type="button"
                                        onClick={() => setFormData({ name: preset.name, code: preset.code, description: preset.desc })}
                                        style={{
                                            padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '600',
                                            border: formData.name === preset.name ? '1px solid #0284c7' : '1px solid #cbd5e1',
                                            background: formData.name === preset.name ? '#e0f2fe' : '#ffffff',
                                            color: formData.name === preset.name ? '#0369a1' : '#475569',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        📘 {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <Input 
                            label={t("ឈ្មោះមុខវិជ្ជា", "Subject Name")} 
                            name="name" 
                            value={formData.name} 
                            onChange={handleInputChange} 
                            required 
                            placeholder="e.g. Mathematics, Khmer" 
                        />
                        <Input 
                            label={t("កូដមុខវិជ្ជា", "Subject Code")} 
                            name="code" 
                            value={formData.code} 
                            onChange={handleInputChange} 
                            required 
                            placeholder="e.g. MATH" 
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                            {t("ការពិពណ៌នាអំពីមុខវិជ្ជា", "Subject Description")}
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder={t("ការពិពណ៌នាសង្ខេបអំពីមុខវិជ្ជា...", "Brief description of curriculum...")}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                        />
                    </div>
                </form>
            </Modal>

            {/* View Details Modal */}
            <Modal
                isOpen={!!viewingSubject}
                onClose={() => setViewingSubject(null)}
                title={t("ព័ត៌មានលម្អិតមុខវិជ្ជា 👁️", "Subject Details 👁️")}
                footer={<Button variant="secondary" onClick={() => setViewingSubject(null)}>{t("បិទ", "Close")}</Button>}
            >
                {viewingSubject && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f0f9ff', padding: '1rem', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold' }}>
                                📘
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{viewingSubject.name}</h3>
                                <span style={{ fontWeight: '700', color: '#0369a1', fontSize: '0.85rem' }}>Code: {viewingSubject.code}</span>
                            </div>
                        </div>
                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ display: 'block', fontSize: '0.88rem', color: '#64748b', marginBottom: '0.4rem' }}>{t("ការពិពណ៌នាមុខវិជ្ជា", "Description:")}</strong>
                            <p style={{ margin: 0, color: '#0f172a', lineHeight: '1.5' }}>{viewingSubject.description || t("គ្មានការពិពណ៌នាឡើយ", "No description provided.")}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Subjects;
