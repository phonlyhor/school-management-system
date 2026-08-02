import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { getLeaveRequests, createLeaveRequest, updateLeaveStatus } from '../../services/leaveService';
import { useAuth } from '../../context/AuthContext';
import { getUser, getRole } from '../../utils/storage';
import toast from 'react-hot-toast';

const LeaveRequests = () => {
    const { lang, t } = useLanguage();
    const { user: authUser, role: authRole } = useAuth();
    const storageUser = getUser();
    const storageRole = getRole();

    const user = authUser || storageUser;
    const role = authRole || storageRole;

    const roleId = user?.role_id ? parseInt(user.role_id, 10) : 0;
    const isAdmin = roleId === 1 || role === 'admin';
    const isTeacher = roleId === 2 || role === 'teacher';
    const isStudent = roleId === 3 || role === 'student';
    const isParent = roleId === 4 || role === 'parent';
    const canSubmit = isStudent; // ONLY Students can submit leave requests!

    const [requests, setRequests] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        reason: '',
        start_date: '',
        end_date: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await getLeaveRequests();
            setRequests(res.data.leave_requests || []);
            setSummary(res.data.leave_summary || null);
        } catch (err) {
            toast.error(t('មានបញ្ហាក្នុងការទាញយកសំណើច្បាប់', 'Failed to load leave requests'));
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
        if (!formData.reason || !formData.start_date || !formData.end_date) {
            toast.error(t('សូមបំពេញព័ត៌មានដែលត្រូវការទាំងអស់', 'Please fill in all required fields'));
            return;
        }

        try {
            setIsSubmitting(true);
            await createLeaveRequest(formData);
            toast.success(t('បានផ្ញើសំណើសុំច្បាប់ដោយជោគជ័យ!', 'Leave request submitted successfully!'));
            setIsModalOpen(false);
            setFormData({ reason: '', start_date: '', end_date: '' });
            fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.message || t('មានបញ្ហាក្នុងការផ្ញើសំណើសុំច្បាប់', 'Failed to submit leave request'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (requestId, newStatus) => {
        try {
            await updateLeaveStatus(requestId, newStatus);
            toast.success(t(`បានកែប្រែស្ថានភាពទៅជា "${newStatus}"`, `Status updated to ${newStatus}`));
            fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.message || t('មានបញ្ហាក្នុងការធ្វើបច្ចុប្បន្នភាពស្ថានភាព', 'Failed to update status'));
        }
    };

    const statusBadge = (st) => {
        const s = (st || 'pending').toLowerCase();
        if (s === 'approved') return <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.82rem' }}>✅ {t('បានអនុញ្ញាត (Approved)', 'Approved')}</span>;
        if (s === 'rejected') return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.82rem' }}>❌ {t('បដិសេធ (Rejected)', 'Rejected')}</span>;
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.82rem' }}>⏳ {t('រង់ចាំការត្រួតពិនិត្យ (Pending)', 'Pending')}</span>;
    };

    const columns = [
        { 
            header: t('ឈ្មោះសិស្ស', 'Student Name'), 
            render: (row) => <strong>{row.student?.user?.name || row.student_name || 'N/A'}</strong> 
        },
        { 
            header: t('ថ្នាក់រៀន', 'Class'), 
            render: (row) => row.school_class?.name || row.class_name || 'N/A' 
        },
        { header: t('មូលហេតុសុំច្បាប់', 'Reason'), accessor: 'reason' },
        { 
            header: t('ថ្ងៃចាប់ផ្តើម - ថ្ងៃបញ្ចប់', 'Dates (Start - End)'), 
            render: (row) => `${row.start_date} ➔ ${row.end_date}` 
        },
        { 
            header: t('ចំនួនថ្ងៃ', 'Total Days'), 
            render: (row) => <span style={{ fontWeight: '700', color: '#4f46e5' }}>{row.total_days || 1} {t('ថ្ងៃ', 'Days')}</span> 
        },
        { 
            header: t('ស្ថានភាព', 'Status'), 
            render: (row) => statusBadge(row.status) 
        },
        {
            header: t('សកម្មភាព', 'Action / Review'),
            render: (row) => {
                if ((isTeacher || isAdmin) && row.status === 'pending') {
                    return (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <Button size="small" variant="primary" onClick={() => handleStatusChange(row.id, 'approved')} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                                ✅ {t('យល់ព្រម', 'Approve')}
                            </Button>
                            <Button size="small" variant="danger" onClick={() => handleStatusChange(row.id, 'rejected')}>
                                ❌ {t('បដិសេធ', 'Reject')}
                            </Button>
                        </div>
                    );
                }
                return <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>{row.status === 'pending' ? t('កំពុងរង់ចាំ', 'Awaiting review') : t('បានពិនិត្យរួចរាល់', 'Reviewed')}</span>;
            }
        }
    ];

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("ការសុំច្បាប់សម្រាក 📝", "Leave Requests 📝")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {isStudent 
                            ? t("ដាក់ពាក្យសុំច្បាប់សម្រាកសិក្សា ទៅកាន់គ្រូបន្ទុកថ្នាក់របស់អ្នក។", "Submit and track leave requests for your class teacher approval.")
                            : t("ត្រួតពិនិត្យ និង យល់ព្រមលើពាក្យសុំច្បាប់សម្រាករបស់សិស្សក្នុងថ្នាក់។", "Review and approve or reject student leave requests.")}
                    </p>
                </div>
                {canSubmit && (
                    <Button onClick={() => setIsModalOpen(true)}>
                        + {t("សុំច្បាប់សម្រាក", "Request Leave")}
                    </Button>
                )}
            </div>

            {/* Leave Balance Summary Bar for Students */}
            {isStudent && summary && (
                <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'center', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
                    <div>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block' }}>{t("ច្បាប់អតិបរមា / ឆ្នាំ", "Max Leave Days Allowed")}</span>
                        <strong style={{ fontSize: '1.3rem', color: '#0f172a' }}>{summary.max_leave_days} {t("ថ្ងៃ", "Days")}</strong>
                    </div>
                    <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '2rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#16a34a', display: 'block' }}>{t("បានច្បាប់រួចហើយ", "Approved Days Taken")}</span>
                        <strong style={{ fontSize: '1.3rem', color: '#15803d' }}>{summary.approved_days_taken} {t("ថ្ងៃ", "Days")}</strong>
                    </div>
                    <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '2rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#4f46e5', display: 'block' }}>{t("ថ្ងៃច្បាប់នៅសល់", "Remaining Leave Balance")}</span>
                        <strong style={{ fontSize: '1.3rem', color: '#4338ca' }}>{summary.remaining_leave_days} {t("ថ្ងៃ", "Days")}</strong>
                    </div>
                </div>
            )}

            <Card>
                {loading ? (
                    <p style={{ padding: '1rem' }}>{t("កំពុងទាញយកទិន្នន័យ...", "Loading leave requests...")}</p>
                ) : requests.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        <p style={{ margin: 0, fontWeight: '500' }}>{t("មិនទាន់មានសំណើច្បាប់នៅឡើយទេ", "No leave requests found.")}</p>
                    </div>
                ) : (
                    <Table columns={columns} data={requests} />
                )}
            </Card>

            {/* Modal Request Leave (Students Only) */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { if (!isSubmitting) setIsModalOpen(false); }}
                title={t("សុំច្បាប់សម្រាកសិក្សា", "Submit Leave Request")}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>{t("បោះបង់", "Cancel")}</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? t("កំពុងផ្ញើ...", "Submitting...") : t("ផ្ញើសំណើសុំច្បាប់", "Submit Request")}
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input 
                        label={t("មូលហេតុសុំច្បាប់", "Reason for Leave")} 
                        name="reason" 
                        value={formData.reason} 
                        onChange={handleInputChange} 
                        required 
                        placeholder={t("ឧ. មានធុរៈគ្រួសារ ឬ មានជំងឺ", "e.g. Family emergency, feeling sick")} 
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input 
                            label={t("ថ្ងៃចាប់ផ្តើម", "Start Date")} 
                            name="start_date" 
                            type="date" 
                            value={formData.start_date} 
                            onChange={handleInputChange} 
                            required 
                        />
                        <Input 
                            label={t("ថ្ងៃបញ្ចប់", "End Date")} 
                            name="end_date" 
                            type="date" 
                            value={formData.end_date} 
                            onChange={handleInputChange} 
                            required 
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default LeaveRequests;
