import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../../services/announcementService';
import { getUser } from '../../utils/storage';
import toast from 'react-hot-toast';

const Announcements = () => {
    const { lang, t } = useLanguage();
    const user = getUser();
    const isAdmin = parseInt(user?.role_id, 10) === 1;

    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'General',
        target_role: 'all',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await getAnnouncements();
            setAnnouncements(res.data.announcements || []);
        } catch (err) {
            toast.error(t('មានបញ្ហាក្នុងការទាញយកការប្រកាសដំណឹង', 'Failed to load announcements'));
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createAnnouncement(formData);
            toast.success(t('បានបង្កើតសេចក្តីប្រកាសដំណឹងដោយជោគជ័យ!', 'Announcement posted successfully!'));
            setIsModalOpen(false);
            setFormData({ title: '', content: '', category: 'General', target_role: 'all' });
            fetchAnnouncements();
        } catch (err) {
            toast.error(err.response?.data?.message || t('មានបញ្ហាក្នុងការបង្កើតដំណឹង', 'Failed to post announcement'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t("តើអ្នកពិតជាចង់លុបសេចក្តីប្រកាសដំណឹងនេះមែនទេ?", "Are you sure you want to delete this announcement?"))) {
            try {
                await deleteAnnouncement(id);
                toast.success(t("បានលុបសេចក្តីប្រកាសដំណឹងដោយជោគជ័យ!", "Announcement deleted successfully!"));
                fetchAnnouncements();
            } catch (err) {
                toast.error(t("មានបញ្ហាក្នុងការលុបដំណឹង", "Failed to delete announcement"));
            }
        }
    };

    const getCategoryBadge = (cat) => {
        if (cat === 'Urgent') return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.78rem' }}>🚨 {t('ប្រញាប់', 'Urgent')}</span>;
        if (cat === 'Academic') return <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.78rem' }}>📚 {t('ការសិក្សា', 'Academic')}</span>;
        if (cat === 'Event') return <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.78rem' }}>🎉 {t('កម្មវិធី', 'Event')}</span>;
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.78rem' }}>📢 {t('ទូទៅ', 'General')}</span>;
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("ការប្រកាសដំណឹងសាលា 📢", "School Announcements 📢")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("ទទួលបានព័ត៌មាន និង សេចក្តីជូនដំណឹងផ្លូវការពីសាលារៀន។", "Stay updated with official school news, notices, and events.")}
                    </p>
                </div>
                {isAdmin && (
                    <Button onClick={() => setIsModalOpen(true)}>
                        + {t("បង្កើតសេចក្តីជូនដំណឹង", "Post Announcement")}
                    </Button>
                )}
            </div>

            {loading ? (
                <p>{t("កំពុងទាញយកដំណឹង...", "Loading announcements...")}</p>
            ) : announcements.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <p style={{ margin: 0, fontWeight: '500' }}>{t("មិនទាន់មានសេចក្តីប្រកាសដំណឹងនៅឡើយទេ", "No announcements posted yet.")}</p>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {announcements.map((item) => (
                        <div 
                            key={item.id} 
                            style={{ 
                                background: '#ffffff', 
                                padding: '1.5rem', 
                                borderRadius: '12px', 
                                border: '1px solid #e2e8f0', 
                                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '700' }}>
                                        {item.title}
                                    </h3>
                                    {getCategoryBadge(item.category)}
                                </div>
                                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '500' }}>
                                    {item.created_at || 'Recently'}
                                </span>
                            </div>

                            <p style={{ margin: 0, color: '#334155', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
                                {item.content}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                    ✍️ {t("បោះពុម្ពផ្សាយដោយ", "Posted by")}: <strong style={{ color: '#475569' }}>{item.author?.name || t('រដ្ឋបាលសាលា', 'School Admin')}</strong>
                                </span>

                                {isAdmin && (
                                    <Button size="small" variant="danger" onClick={() => handleDelete(item.id)}>
                                        {t("លុបដំណឹង", "Delete")}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Create Announcement (Admin Only) */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { if (!isSubmitting) setIsModalOpen(false); }}
                title={t("បង្កើតសេចក្តីប្រកាសដំណឹងថ្មី", "Post New Announcement")}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>{t("បោះបង់", "Cancel")}</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? t("កំពុងផ្សាយ...", "Posting...") : t("បោះពុម្ពផ្សាយដំណឹង", "Post Announcement")}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input 
                        label={t("ចំណងជើងដំណឹង", "Announcement Title")} 
                        name="title" 
                        value={formData.title} 
                        onChange={handleInputChange} 
                        required 
                        placeholder={t("ឧ. ដំណឹងឈប់សម្រាកបុណ្យភ្ជុំបិណ្ឌ", "e.g. Mid-term Exam Schedule Announced")} 
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                {t("ប្រភេទដំណឹង", "Category")}
                            </label>
                            <select 
                                name="category" 
                                value={formData.category} 
                                onChange={handleInputChange} 
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                <option value="General">📢 {t("ទូទៅ (General)", "General")}</option>
                                <option value="Academic">📚 {t("ការសិក្សា (Academic)", "Academic")}</option>
                                <option value="Urgent">🚨 {t("ប្រញាប់ (Urgent)", "Urgent")}</option>
                                <option value="Event">🎉 {t("កម្មវិធី (Event)", "Event")}</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                {t("ផ្ញើជូនអ្នកណា", "Target Audience")}
                            </label>
                            <select 
                                name="target_role" 
                                value={formData.target_role} 
                                onChange={handleInputChange} 
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                <option value="all">🌐 {t("មនុស្សគ្រប់គ្នា (Everyone)", "Everyone")}</option>
                                <option value="teachers">👨‍🏫 {t("គ្រូបង្រៀនតែប៉ុណ្ណោះ (Teachers Only)", "Teachers Only")}</option>
                                <option value="students">🎓 {t("សិស្សសាលាតែប៉ុណ្ណោះ (Students Only)", "Students Only")}</option>
                                <option value="parents">👨‍👩‍👧‍👦 {t("មាតាបិតាតែប៉ុណ្ណោះ (Parents Only)", "Parents Only")}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                            {t("ខ្លឹមសារព័ត៌មានលម្អិត", "Announcement Content")} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleInputChange}
                            required
                            rows={5}
                            placeholder={t("សរសេរខ្លឹមសារសេចក្តីប្រកាសដំណឹងនៅទីនេះ...", "Type detailed announcement contents here...")}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Announcements;
