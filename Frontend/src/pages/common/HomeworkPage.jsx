import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { getHomeworkList, createHomework, deleteHomework } from '../../services/homeworkService';
import { getClasses } from '../../services/classService';
import { getSubjects } from '../../services/subjectService';
import { getUser } from '../../utils/storage';
import toast from 'react-hot-toast';

const HomeworkPage = () => {
    const { lang, t } = useLanguage();
    const user = getUser();
    const roleId = parseInt(user?.role_id, 10);
    const canAssign = roleId === 1 || roleId === 2;

    const [homework, setHomework] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        class_id: '',
        subject_id: '',
        due_date: '',
    });
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [hwRes, clsRes, sbjRes] = await Promise.all([
                getHomeworkList(),
                getClasses(),
                getSubjects()
            ]);
            setHomework(hwRes.data.homework || []);
            setClasses(clsRes.data.classes || []);
            setSubjects(sbjRes.data.subjects || []);
        } catch (err) {
            toast.error(t('មានបញ្ហាក្នុងការទាញយកកិច្ចការផ្ទះ', 'Failed to load homework assignments'));
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

        const payload = new FormData();
        payload.append('title', formData.title);
        payload.append('description', formData.description);
        payload.append('class_id', formData.class_id);
        payload.append('subject_id', formData.subject_id);
        payload.append('due_date', formData.due_date);

        if (attachmentFile) {
            payload.append('attachment', attachmentFile);
        }

        try {
            await createHomework(payload);
            toast.success(t('បានដាក់កិច្ចការផ្ទះដោយជោគជ័យ!', 'Homework created successfully!'));
            setIsModalOpen(false);
            setFormData({ title: '', description: '', class_id: '', subject_id: '', due_date: '' });
            setAttachmentFile(null);
            fetchInitialData();
        } catch (err) {
            toast.error(err.response?.data?.message || t('មានបញ្ហាក្នុងការដាក់កិច្ចការផ្ទះ', 'Failed to create homework'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t("តើអ្នកពិតជាចង់លុបកិច្ចការផ្ទះនេះមែនទេ?", "Are you sure you want to delete this homework?"))) {
            try {
                await deleteHomework(id);
                toast.success(t("បានលុបកិច្ចការផ្ទះដោយជោគជ័យ!", "Homework deleted successfully!"));
                fetchInitialData();
            } catch (err) {
                toast.error(t("មានបញ្ហាក្នុងការលុបកិច្ចការផ្ទះ", "Failed to delete homework"));
            }
        }
    };

    const columns = [
        { 
            header: t('ចំណងជើងកិច្ចការ', 'Title'), 
            render: (row) => <strong>📎 {row.title}</strong> 
        },
        { 
            header: t('ថ្នាក់រៀន', 'Class'), 
            render: (row) => row.school_class?.name || 'N/A' 
        },
        { 
            header: t('មុខវិជ្ជា', 'Subject'), 
            render: (row) => row.subject?.name || 'N/A' 
        },
        { 
            header: t('ថ្ងៃកំណត់ប្រគល់', 'Due Date'), 
            render: (row) => <span style={{ fontWeight: '700', color: '#dc2626' }}>⏰ {row.due_date}</span> 
        },
        { 
            header: t('គ្រូអ្នកដាក់', 'Assigned By'), 
            render: (row) => row.teacher?.name || 'N/A' 
        },
        {
            header: t('ឯកសារភ្ជាប់', 'Attachment'),
            render: (row) => {
                if (row.attachment_url) {
                    return (
                        <a href={row.attachment_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'underline' }}>
                            📁 {t("ទាញយក", "Download")}
                        </a>
                    );
                }
                return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>{t("គ្មាន", "None")}</span>;
            }
        },
        {
            header: t('សកម្មភាព', 'Action'),
            render: (row) => {
                if (canAssign) {
                    return (
                        <Button size="small" variant="danger" onClick={() => handleDelete(row.id)}>
                            {t("លុប", "Delete")}
                        </Button>
                    );
                }
                return null;
            }
        }
    ];

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("កិច្ចការផ្ទះ & លំហាត់ 📎", "Homework Assignments 📎")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {canAssign 
                            ? t("ដាក់កិច្ចការផ្ទះ ភ្ជាប់ឯកសារ និង កំណត់ថ្ងៃប្រគល់ជូនសិស្សតាមថ្នាក់។", "Create and post homework assignments with file attachments for students.")
                            : t("ពិនិត្យមើលកិច្ចការផ្ទះ ឯកសារមេរៀន និង កាលបរិច្ឆេទប្រគល់កិច្ចការ។", "View assigned homework, instructions, and due dates.")}
                    </p>
                </div>
                {canAssign && (
                    <Button onClick={() => setIsModalOpen(true)}>
                        + {t("ដាក់កិច្ចការផ្ទះ", "Assign Homework")}
                    </Button>
                )}
            </div>

            <Card>
                {loading ? (
                    <p style={{ padding: '1rem' }}>{t("កំពុងទាញយកទិន្នន័យ...", "Loading homework assignments...")}</p>
                ) : homework.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        <p style={{ margin: 0, fontWeight: '500' }}>{t("មិនទាន់មានកិច្ចការផ្ទះនៅឡើយទេ", "No homework assignments found.")}</p>
                    </div>
                ) : (
                    <Table columns={columns} data={homework} />
                )}
            </Card>

            {/* Modal Assign Homework (Teacher / Admin) */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { if (!isSubmitting) setIsModalOpen(false); }}
                title={t("ដាក់កិច្ចការផ្ទះថ្មី", "Assign New Homework")}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>{t("បោះបង់", "Cancel")}</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? t("កំពុងរក្សាទុក...", "Saving...") : t("រក្សាទុកកិច្ចការផ្ទះ", "Assign Homework")}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input 
                        label={t("ចំណងជើងកិច្ចការ", "Homework Title")} 
                        name="title" 
                        value={formData.title} 
                        onChange={handleInputChange} 
                        required 
                        placeholder={t("ឧ. ធ្វើលំហាត់គណិតវិទ្យា ទំព័រ ១៥", "e.g. Mathematics Chapter 3 Exercises")} 
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                {t("ថ្នាក់រៀន", "Target Class")} <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select 
                                name="class_id" 
                                value={formData.class_id} 
                                onChange={handleInputChange} 
                                required
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                <option value="">-- {t("ជ្រើសរើសថ្នាក់", "Select Class")} --</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>🏫 {c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                {t("មុខវិជ្ជា", "Subject")} <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select 
                                name="subject_id" 
                                value={formData.subject_id} 
                                onChange={handleInputChange} 
                                required
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                            >
                                <option value="">-- {t("ជ្រើសរើសមុខវិជ្ជា", "Select Subject")} --</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>📘 {s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Input 
                        label={t("ថ្ងៃកំណត់ប្រគល់", "Due Date")} 
                        name="due_date" 
                        type="date" 
                        value={formData.due_date} 
                        onChange={handleInputChange} 
                        required 
                    />

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                            {t("ការណែនាំលម្អិត", "Instructions / Description")}
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder={t("សរសេរការណែនាំអំពីកិច្ចការផ្ទះ...", "Write homework instructions...")}
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                            {t("ឯកសារភ្ជាប់ (PDF / រូបភាព / Word)", "Attachment File (Optional)")}
                        </label>
                        <input 
                            type="file" 
                            onChange={(e) => setAttachmentFile(e.target.files[0])}
                            style={{ fontSize: '0.9rem' }}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default HomeworkPage;
