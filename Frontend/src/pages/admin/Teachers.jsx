import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../../services/teacherService';
import { getClasses } from '../../services/classService';
import CambodianAddressSelector from '../../components/common/CambodianAddressSelector';
import TeacherIDCardModal from '../../components/common/TeacherIDCardModal';
import toast from 'react-hot-toast';

const Teachers = () => {
    const { lang, t } = useLanguage();
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [homeroomFilter, setHomeroomFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [techFilter, setTechFilter] = useState('');
    const [provinceFilter, setProvinceFilter] = useState('');
    const [districtFilter, setDistrictFilter] = useState('');
    const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'civil', 'education', 'teaching', 'awards'

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [viewingTeacher, setViewingTeacher] = useState(null);
    const [cardTeacher, setCardTeacher] = useState(null);

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    // Initial state for form data
    const initialFormState = {
        name: '',
        first_name: '',
        last_name: '',
        email: '',
        gender: 'male',
        password: '',
        date_of_birth: '',
        specialization: '',
        address: '',
        phone: '',
        class_id: '',
        photo: '',
        // Extended fields requested by user
        position: 'គ្រូបង្រៀន', // តួនាទី
        civil_service_framework: 'គ្រូឧត្តម', // ក្របខណ្ឌ
        education_level: 'បរិញ្ញាបត្រ', // កម្រិតវប្បធម៏
        qualification: 'គរុកោសល្យ+១', // គុណវិវឌ្ឍ
        specialization_1: '', // ឯកទេស១
        specialization_2: '', // ឯកទេស២
        specialization_3: '', // ឯកទេស៣
        teaching_level: 'អនុវិទ្យាល័យ', // កម្រិតបង្រៀន
        activity_status: 'កំពុងបម្រើការ', // សកម្មភាព
        class_charge: '', // បន្ទុកថ្នាក់ទី
        civil_service_date: '', // ថ្ងៃខែឆ្នាំបម្រើរាជការ
        service_duration: '', // រយៈពេល
        awards: '', // ស្នាដៃពានរង្វាន់
        honors: '', // ជ័យលាភីទទួលបាន
        grades_taught: '', // បង្រៀនកំរិតថ្នាក់
        technology_usage: 'ប្រើប្រាស់', // គ្រូប្រើបច្ចេកវិទ្យា
        civil_servant_id: '', // អត្តលេខមន្ត្រីរាជការ
    };

    const [formData, setFormData] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [teacherRes, classRes] = await Promise.all([
                getTeachers(),
                getClasses()
            ]);
            setTeachers(teacherRes.data.teachers || []);
            setClasses(classRes.data.classes || []);
        } catch (err) {
            console.error("Failed to fetch teachers data:", err);
            setError("Failed to load teachers. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getImageUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
        let cleanPath = photo.replace(/^\//, '');
        if (!cleanPath.startsWith('storage/') && !cleanPath.startsWith('public/')) {
            cleanPath = `storage/${cleanPath}`;
        }
        return `${baseUrl}/${cleanPath}`;
    };

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return isNaN(age) || age < 0 ? 'N/A' : `${age} ${t('ឆ្នាំ', 'years')}`;
    };

    const calculateServiceDuration = (startDate) => {
        if (!startDate) return '';
        const start = new Date(startDate);
        const today = new Date();
        if (isNaN(start.getTime())) return '';

        let years = today.getFullYear() - start.getFullYear();
        let months = today.getMonth() - start.getMonth();

        if (months < 0) {
            years--;
            months += 12;
        }

        const yearStr = years > 0 ? `${years} ឆ្នាំ` : '';
        const monthStr = months > 0 ? `${months} ខែ` : '';

        if (!yearStr && !monthStr) return 'ទើបតែចូលបម្រើការ';
        return [yearStr, monthStr].filter(Boolean).join(' ');
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const updated = { ...prev, [name]: value };

            // Auto update full name if first_name or last_name changes
            if (name === 'first_name' || name === 'last_name') {
                const fn = name === 'first_name' ? value : (prev.first_name || '');
                const ln = name === 'last_name' ? value : (prev.last_name || '');
                updated.name = `${fn} ${ln}`.trim();
            }

            // Auto calculate duration if civil_service_date changes
            if (name === 'civil_service_date') {
                const autoDuration = calculateServiceDuration(value);
                if (autoDuration) {
                    updated.service_duration = autoDuration;
                }
            }

            // Sync specialization_1 with primary specialization field
            if (name === 'specialization_1') {
                updated.specialization = value;
            }

            return updated;
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setEditingId(null);
        setPhotoFile(null);
        setPhotoPreview(null);
        setActiveTab('personal');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = new FormData();
        payload.append('name', formData.name || `${formData.first_name || ''} ${formData.last_name || ''}`.trim());
        payload.append('first_name', formData.first_name || '');
        payload.append('last_name', formData.last_name || '');
        payload.append('email', formData.email);
        payload.append('gender', formData.gender || 'male');

        if (formData.password) {
            payload.append('password', formData.password);
        }

        if (formData.date_of_birth) {
            payload.append('date_of_birth', formData.date_of_birth);
        }

        if (formData.address) {
            payload.append('address', formData.address);
        }

        if (formData.phone) {
            payload.append('phone', formData.phone);
        }

        if (formData.class_id) {
            payload.append('class_id', formData.class_id);
        }

        if (photoFile) {
            payload.append('photo', photoFile);
        }

        // Extended profile fields
        payload.append('position', formData.position || '');
        payload.append('civil_service_framework', formData.civil_service_framework || '');
        payload.append('education_level', formData.education_level || '');
        payload.append('qualification', formData.qualification || '');
        payload.append('specialization', formData.specialization_1 || formData.specialization || '');
        payload.append('specialization_1', formData.specialization_1 || '');
        payload.append('specialization_2', formData.specialization_2 || '');
        payload.append('specialization_3', formData.specialization_3 || '');
        payload.append('teaching_level', formData.teaching_level || '');
        payload.append('activity_status', formData.activity_status || 'កំពុងបម្រើការ');
        payload.append('class_charge', formData.class_charge || '');
        if (formData.civil_service_date) payload.append('civil_service_date', formData.civil_service_date);
        payload.append('service_duration', formData.service_duration || '');
        payload.append('awards', formData.awards || '');
        payload.append('honors', formData.honors || '');
        payload.append('grades_taught', formData.grades_taught || '');
        payload.append('technology_usage', formData.technology_usage || '');
        payload.append('civil_servant_id', formData.civil_servant_id || '');

        try {
            if (editingId) {
                await updateTeacher(editingId, payload);
                toast.success(t("បានកែប្រែព័ត៌មានគ្រូបង្រៀនដោយជោគជ័យ!", "Teacher updated successfully!"));
            } else {
                await createTeacher(payload);
                toast.success(t("បានបន្ថែមគ្រូបង្រៀនថ្មីដោយជោគជ័យ!", "Teacher added successfully!"));
            }
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error("Failed to save teacher:", err);
            toast.error(t("មានបញ្ហាក្នុងការរក្សាទុក៖ ", "Error saving teacher: ") + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (row) => {
        setEditingId(row.id);
        setPhotoFile(null);
        setPhotoPreview(getImageUrl(row.photo));

        const homeroomAssignment = row.teacher_class_assignments && row.teacher_class_assignments.length > 0 ? row.teacher_class_assignments[0].class_id : '';

        const nameParts = row.name ? row.name.split(' ') : [];
        const defaultFn = nameParts.length > 0 ? nameParts[0] : '';
        const defaultLn = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        setFormData({
            name: row.name || '',
            first_name: row.first_name || defaultFn,
            last_name: row.last_name || defaultLn,
            email: row.email || '',
            gender: row.gender || 'male',
            password: '',
            date_of_birth: row.date_of_birth || '',
            specialization: row.specialization || '',
            address: row.address || '',
            phone: row.phone || '',
            class_id: homeroomAssignment || '',
            photo: row.photo || '',
            position: row.position || 'គ្រូបង្រៀន',
            civil_service_framework: row.civil_service_framework || 'គ្រូឧត្តម',
            education_level: row.education_level || 'បរិញ្ញាបត្រ',
            qualification: row.qualification || 'គរុកោសល្យ+១',
            specialization_1: row.specialization_1 || row.specialization || '',
            specialization_2: row.specialization_2 || '',
            specialization_3: row.specialization_3 || '',
            teaching_level: row.teaching_level || 'អនុវិទ្យាល័យ',
            activity_status: row.activity_status || 'កំពុងបម្រើការ',
            class_charge: row.class_charge || '',
            civil_service_date: row.civil_service_date || '',
            service_duration: row.service_duration || (row.civil_service_date ? calculateServiceDuration(row.civil_service_date) : ''),
            awards: row.awards || '',
            honors: row.honors || '',
            grades_taught: row.grades_taught || '',
            technology_usage: row.technology_usage || 'ប្រើប្រាស់',
            civil_servant_id: row.civil_servant_id || '',
        });
        setActiveTab('personal');
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t("តើអ្នកពិតជាចង់លុបគណនីគ្រូបង្រៀននេះមែនទេ? ប្រតិបត្តិការនេះមិនអាចត្រឡប់វិញបានឡើយ។", "Are you sure you want to delete this teacher account? This cannot be undone."))) {
            try {
                await deleteTeacher(id);
                fetchData();
                toast.success(t("បានលុបគ្រូបង្រៀនដោយជោគជ័យ!", "Teacher deleted successfully!"));
            } catch (err) {
                console.error("Failed to delete teacher:", err);
                toast.error(t("មានបញ្ហាក្នុងការលុប៖ ", "Error deleting teacher: ") + (err.response?.data?.message || err.message));
            }
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' },
        {
            header: t('ឈ្មោះគ្រូបង្រៀន & អត្តលេខ', 'Teacher Name & ID'),
            render: (row) => {
                const img = getImageUrl(row.photo);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {img ? (
                            <img src={img} alt={row.name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #16a34a' }} />
                        ) : (
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                                {row.name?.charAt(0) || 'T'}
                            </div>
                        )}
                        <div>
                            <strong style={{ color: '#0f172a', fontSize: '0.95rem', display: 'block' }}>{row.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>{row.email}</span>
                            {row.civil_servant_id && (
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '0.1rem 0.4rem', borderRadius: '6px', display: 'inline-block', marginTop: '2px' }}>
                                    🆔 {row.civil_servant_id}
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            header: t('តួនាទី & ក្របខណ្ឌ', 'Role & Framework'),
            render: (row) => (
                <div style={{ fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: '700', color: '#166534' }}>🏷️ {row.position || 'គ្រូបង្រៀន'}</div>
                    <div style={{ color: '#475569', fontSize: '0.8rem' }}>🏛️ {row.civil_service_framework || 'គ្រូឧត្តម'}</div>
                </div>
            )
        },
        {
            header: t('ឯកទេស', 'Specialization'),
            render: (row) => {
                const spec1 = row.specialization_1 || row.specialization;
                const spec2 = row.specialization_2;
                const spec3 = row.specialization_3;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.82rem' }}>
                        {spec1 && <span style={{ fontWeight: '600', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.15rem 0.5rem', borderRadius: '8px', width: 'fit-content' }}>📘 ឯកទេស១: {spec1}</span>}
                        {spec2 && <span style={{ color: '#475569', backgroundColor: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '6px', width: 'fit-content' }}>📗 ឯកទេស២: {spec2}</span>}
                        {spec3 && <span style={{ color: '#64748b', fontSize: '0.78rem' }}>📙 ឯកទេស៣: {spec3}</span>}
                        {!spec1 && !spec2 && !spec3 && <span style={{ color: '#94a3b8' }}>-</span>}
                    </div>
                );
            }
        },
        {
            header: t('កម្រិតបង្រៀន / បន្ទុកថ្នាក់', 'Teaching Level / Class'),
            render: (row) => {
                const assignedClasses = row.teacher_class_assignments?.map(a => a.school_class?.name).filter(Boolean);
                return (
                    <div style={{ fontSize: '0.83rem' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>🏫 {row.teaching_level || 'អនុវិទ្យាល័យ'}</div>
                        {assignedClasses && assignedClasses.length > 0 ? (
                            <div style={{ color: '#15803d', fontWeight: '700', fontSize: '0.8rem' }}>👑 ថ្នាក់ {assignedClasses.join(', ')}</div>
                        ) : (
                            <div style={{ color: '#64748b', fontSize: '0.78rem' }}>📖 គ្រូមុខវិជ្ជា (គ្មានបន្ទុក)</div>
                        )}
                    </div>
                );
            }
        },
        {
            header: t('គ្រូប្រើបច្ចេកវិទ្យា', 'Tech Teacher'),
            render: (row) => {
                const usesTech = (row.technology_usage || 'ប្រើប្រាស់') === 'ប្រើប្រាស់' || (row.technology_usage || '').includes('ខ្ពស់');
                return (
                    <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        backgroundColor: usesTech ? '#dcfce7' : '#f1f5f9',
                        color: usesTech ? '#15803d' : '#64748b'
                    }}>
                        {usesTech ? '💻 ប្រើប្រាស់' : '🚫 មិនប្រើ'}
                    </span>
                );
            }
        },
        {
            header: t('សកម្មភាព', 'Actions'),
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Button
                        size="small"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); setCardTeacher(row); }}
                        title={t("បោះពុម្ពប័ណ្ណសម្គាល់ខ្លួនគ្រូបង្រៀន & QR", "Print Teacher ID Card & QR Code")}
                        style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '700' }}
                    >
                        🪪
                    </Button>
                    <Button
                        size="small"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); setViewingTeacher(row); }}
                        title={t("មើលព័ត៌មានលម្អិត", "View Details")}
                    >
                        👁️
                    </Button>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}>{t('កែប្រែ', 'Edit')}</Button>
                    <Button size="small" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>{t('លុប', 'Delete')}</Button>
                </div>
            )
        }
    ];

    const filteredTeachers = teachers.filter(tItem => {
        const matchesSearch = !search ||
            (tItem.name && tItem.name.toLowerCase().includes(search.toLowerCase())) ||
            (tItem.email && tItem.email.toLowerCase().includes(search.toLowerCase())) ||
            (tItem.civil_servant_id && tItem.civil_servant_id.toLowerCase().includes(search.toLowerCase())) ||
            (tItem.position && tItem.position.toLowerCase().includes(search.toLowerCase())) ||
            (tItem.civil_service_framework && tItem.civil_service_framework.toLowerCase().includes(search.toLowerCase())) ||
            (tItem.education_level && tItem.education_level.toLowerCase().includes(search.toLowerCase())) ||
            (tItem.qualification && tItem.qualification.toLowerCase().includes(search.toLowerCase())) ||
            (tItem.specialization_1 && tItem.specialization_1.toLowerCase().includes(search.toLowerCase())) ||
            (tItem.specialization && tItem.specialization.toLowerCase().includes(search.toLowerCase())) ||
            (tItem.address && tItem.address.toLowerCase().includes(search.toLowerCase())) ||
            (tItem.phone && tItem.phone.toLowerCase().includes(search.toLowerCase()));

        const hasHomeroom = (tItem.teacher_class_assignments && tItem.teacher_class_assignments.length > 0) || !!tItem.class_charge;

        const matchesHomeroom = !homeroomFilter ||
            (homeroomFilter === 'homeroom' ? hasHomeroom : !hasHomeroom);

        const matchesGender = !genderFilter || (tItem.gender || 'male') === genderFilter;

        const matchesTech = !techFilter || (techFilter === 'yes' ? (tItem.technology_usage || 'ប្រើប្រាស់') === 'ប្រើប្រាស់' : (tItem.technology_usage || '') === 'មិនប្រើប្រាស់');

        const matchesProvince = !provinceFilter || (tItem.province || tItem.address || '').includes(provinceFilter);

        const matchesDistrict = !districtFilter || (tItem.district || tItem.address || '').includes(districtFilter);

        return matchesSearch && matchesHomeroom && matchesGender && matchesTech && matchesProvince && matchesDistrict;
    });

    const totalCount = teachers.length;
    const homeroomCount = teachers.filter(tItem => (tItem.teacher_class_assignments && tItem.teacher_class_assignments.length > 0) || !!tItem.class_charge).length;
    const subjectCount = totalCount - homeroomCount;

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("គ្រប់គ្រងគ្រូបង្រៀន & មន្ត្រីរាជការ 💻", "Manage Teachers & Staff Profiles 💻")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("បន្ថែម និងគ្រប់គ្រងប្រវត្តិរូបគ្រូបង្រៀន ក្របខណ្ឌ តួនាទី កម្រិតបង្រៀន គុណវិវឌ្ឍ និង អត្តលេខមន្ត្រីរាជការ។", "Add and manage teacher profiles, framework, roles, qualifications, teaching levels, awards, and civil servant ID.")}
                    </p>
                </div>
                <Button onClick={() => {
                    resetForm();
                    setIsModalOpen(true);
                }}>
                    {t("+ បន្ថែមគ្រូបង្រៀន", "+ Add Teacher")}
                </Button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                    onClick={() => setHomeroomFilter('')}
                    style={{
                        padding: '0.55rem 1.1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                        border: homeroomFilter === '' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                        backgroundColor: homeroomFilter === '' ? '#f0fdf4' : '#ffffff',
                        color: homeroomFilter === '' ? '#166534' : '#475569',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s ease'
                    }}
                >
                    👥 {t("គ្រូទាំងអស់", "All Teachers")}: <span style={{ color: '#16a34a' }}>{totalCount}</span>
                </button>

                <button
                    onClick={() => setHomeroomFilter('homeroom')}
                    style={{
                        padding: '0.55rem 1.1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                        border: homeroomFilter === 'homeroom' ? '2px solid #15803d' : '1px solid #cbd5e1',
                        backgroundColor: homeroomFilter === 'homeroom' ? '#dcfce7' : '#ffffff',
                        color: homeroomFilter === 'homeroom' ? '#14532d' : '#475569',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s ease'
                    }}
                >
                    👑 {t("គ្រូបន្ទុកថ្នាក់", "Homeroom Teachers")}: <span style={{ color: '#15803d' }}>{homeroomCount}</span>
                </button>

                <button
                    onClick={() => setHomeroomFilter('subject')}
                    style={{
                        padding: '0.55rem 1.1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                        border: homeroomFilter === 'subject' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        backgroundColor: homeroomFilter === 'subject' ? '#e0f2fe' : '#ffffff',
                        color: homeroomFilter === 'subject' ? '#0369a1' : '#475569',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s ease'
                    }}
                >
                    💻 {t("គ្រូមុខវិជ្ជា", "Subject Teachers")}: <span style={{ color: '#0284c7' }}>{subjectCount}</span>
                </button>

                {/* Dropdown Filters */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <select
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value)}
                        style={{ height: '42px', padding: '0.55rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', backgroundColor: '#ffffff' }}
                    >
                        <option value="">🚻 {t("ភេទទាំងអស់", "All Genders")}</option>
                        <option value="male">👨 {t("គ្រូប្រុស", "Male")}</option>
                        <option value="female">👩 {t("គ្រូស្រី", "Female")}</option>
                    </select>

                    <select
                        value={techFilter}
                        onChange={(e) => setTechFilter(e.target.value)}
                        style={{ height: '42px', padding: '0.55rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', backgroundColor: '#ffffff' }}
                    >
                        <option value="">💻 {t("ការប្រើបច្ចេកវិទ្យាទាំងអស់", "All Tech Usage")}</option>
                        <option value="yes">💻 {t("គ្រូប្រើបច្ចេកវិទ្យា", "Uses Tech")}</option>
                        <option value="no">🚫 {t("មិនប្រើបច្ចេកវិទ្យា", "No Tech")}</option>
                    </select>

                    <select
                        value={provinceFilter}
                        onChange={(e) => setProvinceFilter(e.target.value)}
                        style={{ height: '42px', padding: '0.55rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', backgroundColor: '#ffffff' }}
                    >
                        <option value="">🏙️ {t("ខេត្តទាំងអស់", "All Provinces")}</option>
                        {Array.from(new Set(teachers.map(t => t.province || (t.address ? t.address.split(',').pop().trim() : '')).filter(Boolean))).map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>

                    <select
                        value={districtFilter}
                        onChange={(e) => setDistrictFilter(e.target.value)}
                        style={{ height: '42px', padding: '0.55rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', backgroundColor: '#ffffff' }}
                    >
                        <option value="">🏛️ {t("ស្រុកទាំងអស់", "All Districts")}</option>
                        {Array.from(new Set(teachers.map(t => t.district || '').filter(Boolean))).map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
            </div>

            <Card>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: '320px' }}>
                            <Input
                                placeholder={t("ស្វែងរកតាមឈ្មោះ, អ៊ីមែល, អត្តលេខ, ឯកទេស, តួនាទី...", "Search name, email, civil ID, major, role...")}
                                value={search}
                                onChange={handleSearch}
                                style={{ margin: 0 }}
                            />
                        </div>

                        {search && (
                            <Button size="small" variant="secondary" onClick={() => setSearch('')}>
                                {t("លុបការស្វែងរក ✖️", "Clear Search ✖️")}
                            </Button>
                        )}

                        <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.88rem', fontWeight: '600' }}>
                            {t(`បង្ហាញ ${filteredTeachers.length} នៃគ្រូបង្រៀនសរុប ${teachers.length} នាក់`, `Showing ${filteredTeachers.length} of ${teachers.length} Teachers`)}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <p>{t("កំពុងទាញយកទិន្នន័យ...", "Loading teachers...")}</p>
                ) : (
                    <Table columns={columns} data={filteredTeachers} />
                )}
            </Card>

            {/* Modal Add/Edit Teacher */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { if (!isSubmitting) { setIsModalOpen(false); resetForm(); } }}
                title={editingId ? t('កែប្រែប្រវត្តិរូបគ្រូបង្រៀន', 'Edit Teacher Profile') : t('បន្ថែមគ្រូបង្រៀនថ្មី', 'Add New Teacher')}
                maxWidth="780px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            * {t("សូមបំពេញព័ត៌មានដែលចាំបាច់ឱ្យបានគ្រប់គ្រាន់", "Please complete required fields")}
                        </span>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>{t('បោះបង់', 'Cancel')}</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? t('កំពុងរក្សាទុក...', 'Saving...') : t('រក្សាទុក', 'Save Teacher')}
                            </Button>
                        </div>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Photo Upload Header Card */}
                    <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ position: 'relative' }}>
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #16a34a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            ) : (
                                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.7rem', fontWeight: 'bold' }}>
                                    {formData.name ? formData.name.charAt(0).toUpperCase() : '👨‍🏫'}
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.3rem' }}>
                                {t("រូបថតប្រវត្តិរូបគ្រូបង្រៀន", "Teacher Profile Photo")}
                            </label>
                            <label style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem',
                                background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer',
                                fontSize: '0.85rem', fontWeight: '600', color: '#475569', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.2s ease'
                            }}>
                                📷 {t("ជ្រើសរើសរូបថត", "Choose Photo File")}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            {photoFile && (
                                <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: '#16a34a', fontWeight: '600' }}>
                                    ✓ {photoFile.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Navigation Tab Bar for Form Sections */}
                    <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => setActiveTab('personal')}
                            style={{
                                padding: '0.6rem 1rem', border: 'none', borderBottom: activeTab === 'personal' ? '3px solid #16a34a' : '3px solid transparent',
                                background: 'none', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer',
                                color: activeTab === 'personal' ? '#166534' : '#64748b'
                            }}
                        >
                            👤 {t("ព័ត៌មានផ្ទាល់ខ្លួន & គណនី", "Personal & Account")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('civil')}
                            style={{
                                padding: '0.6rem 1rem', border: 'none', borderBottom: activeTab === 'civil' ? '3px solid #0284c7' : '3px solid transparent',
                                background: 'none', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer',
                                color: activeTab === 'civil' ? '#0369a1' : '#64748b'
                            }}
                        >
                            🏛️ {t("ព័ត៌មានរាជការ & ក្របខណ្ឌ", "Civil Service & Rank")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('education')}
                            style={{
                                padding: '0.6rem 1rem', border: 'none', borderBottom: activeTab === 'education' ? '3px solid #8b5cf6' : '3px solid transparent',
                                background: 'none', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer',
                                color: activeTab === 'education' ? '#6d28d9' : '#64748b'
                            }}
                        >
                            🎓 {t("កម្រិតវប្បធម៌ & ឯកទេស", "Education & Major")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('teaching')}
                            style={{
                                padding: '0.6rem 1rem', border: 'none', borderBottom: activeTab === 'teaching' ? '3px solid #f59e0b' : '3px solid transparent',
                                background: 'none', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer',
                                color: activeTab === 'teaching' ? '#b45309' : '#64748b'
                            }}
                        >
                            📚 {t("ការបង្រៀន & បន្ទុកថ្នាក់", "Teaching & Charge")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('awards')}
                            style={{
                                padding: '0.6rem 1rem', border: 'none', borderBottom: activeTab === 'awards' ? '3px solid #ec4899' : '3px solid transparent',
                                background: 'none', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer',
                                color: activeTab === 'awards' ? '#be185d' : '#64748b'
                            }}
                        >
                            🏆 {t("ស្នាដៃ & ជ័យលាភី", "Awards & Honors")}
                        </button>
                    </div>

                    {/* TAB 1: Personal & Account Details */}
                    {activeTab === 'personal' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🔑 {t("គណនី និង ព័ត៌មានផ្ទាល់ខ្លួន", "Account Credentials & Personal Info")}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <Input
                                        label={t("ត្រកូល / នាមត្រកូល (First Name)", "First Name / Surname")}
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. សុខ (Sok)"
                                    />

                                    <Input
                                        label={t("ឈ្មោះ / នាមខ្លួន (Last Name)", "Last Name / Given Name")}
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. ដារ៉ា (Dara)"
                                    />

                                    <div style={{ gridColumn: 'span 2' }}>
                                        <Input
                                            label={t("ឈ្មោះពេញបង្ហាញ (Full Name)", "Display Full Name")}
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. សុខ ដារ៉ា"
                                        />
                                    </div>

                                    <Input
                                        label={<span>{t("អត្តលេខមន្ត្រីរាជការ", "Civil Servant ID Number")} <span style={{ color: '#ef4444' }}>* (មិនត្រូវជាន់គ្នាឡើយ)</span></span>}
                                        name="civil_servant_id"
                                        value={formData.civil_servant_id}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. 18029384"
                                    />

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            {t("ភេទ", "Gender")} <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            required
                                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a', fontWeight: '600' }}
                                        >
                                            <option value="male">👨 {t("ប្រុស", "Male")}</option>
                                            <option value="female">👩 {t("ស្រី", "Female")}</option>
                                        </select>
                                    </div>

                                    <Input
                                        label={<span>{t("អាសយដ្ឋានអ៊ីមែល", "Email Address")} <span style={{ color: '#ef4444' }}>*</span></span>}
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="teacher@school.com"
                                    />

                                    <Input
                                        label={editingId ? t("ពាក្យសម្ងាត់ (ទុកទំនេរប្រសិនបើមិនដូរ)", "Password (blank to keep current)") : <span>{t("ពាក្យសម្ងាត់", "Password")} <span style={{ color: '#ef4444' }}>*</span></span>}
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required={!editingId}
                                        minLength={6}
                                        placeholder="••••••••"
                                    />

                                    <div>
                                        <Input
                                            label={<span>{t("ថ្ងៃខែឆ្នាំកំណើត", "Date of Birth")} <span style={{ color: '#ef4444' }}>*</span></span>}
                                            name="date_of_birth"
                                            type="date"
                                            value={formData.date_of_birth}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {formData.date_of_birth && (
                                            <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '700', display: 'block', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                                                ⚡ គណនាអាយុស្វ័យប្រវត្តិតាមថ្ងៃកំណើត៖ {calculateAge(formData.date_of_birth)}
                                            </span>
                                        )}
                                    </div>

                                    <Input
                                        label={<span>{t("លេខទូរស័ព្ទ", "Phone Number")} <span style={{ color: '#ef4444' }}>*</span></span>}
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. 012 345 678"
                                    />

                                    <CambodianAddressSelector
                                        value={formData.address}
                                        onChange={(newAddr) => setFormData(prev => ({ ...prev, address: newAddr }))}
                                        onAddressChange={(data) => setFormData(prev => ({
                                            ...prev,
                                            address: data.address,
                                            province: data.province,
                                            district: data.district,
                                            commune: data.commune,
                                            village: data.village
                                        }))}
                                        required
                                        label={t("អាសយដ្ឋាន / ទីតាំងរស់នៅ", "Address / Location")}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Civil Service & Framework Details */}
                    {activeTab === 'civil' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🏛️ {t("ព័ត៌មានរាជការ & ក្របខណ្ឌមន្ត្រី", "Civil Service & Official Rank")}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            {t("តួនាទី", "Role / Position")} <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            list="positions_list"
                                            name="position"
                                            value={formData.position}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. គ្រូបង្រៀន, នាយក..."
                                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
                                        />
                                        <datalist id="positions_list">
                                            <option value="គ្រូបង្រៀន" />
                                            <option value="នាយក" />
                                            <option value="នាយករង" />
                                            <option value="ប្រធានផ្នែក" />
                                            <option value="គ្រូប្រចាំថ្នាក់" />
                                        </datalist>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            {t("ក្របខណ្ឌ", "Civil Service Framework")} <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            list="frameworks_list"
                                            name="civil_service_framework"
                                            value={formData.civil_service_framework}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. គ្រូឧត្តម, គ្រូមូលដ្ឋាន..."
                                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
                                        />
                                        <datalist id="frameworks_list">
                                            <option value="គ្រូឧត្តម" />
                                            <option value="គ្រូមូលដ្ឋាន" />
                                            <option value="គ្រូបឋម" />
                                            <option value="ក្របខណ្ឌ ក" />
                                            <option value="ក្របខណ្ឌ ខ" />
                                            <option value="ក្របខណ្ឌ គ" />
                                        </datalist>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            {t("សកម្មភាព (ស្ថានភាពបម្រើការ)", "Activity Status")} <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <select
                                            name="activity_status"
                                            value={formData.activity_status}
                                            onChange={handleInputChange}
                                            required
                                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', color: '#0f172a' }}
                                        >
                                            <option value="កំពុងបម្រើការ">✅ កំពុងបម្រើការ (Active)</option>
                                            <option value="ផ្អាកការងារ">⏸️ ផ្អាកការងារ (On Leave)</option>
                                            <option value="ផ្ទេរចេញ">🔄 ផ្ទេរចេញ (Transferred)</option>
                                            <option value="ចូលនិវត្តន៍">👴 ចូលនិវត្តន៍ (Retired)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <Input
                                            label={<span>{t("ថ្ងៃខែឆ្នាំបម្រើរាជការ", "Civil Service Start Date")} <span style={{ color: '#ef4444' }}>*</span></span>}
                                            name="civil_service_date"
                                            type="date"
                                            value={formData.civil_service_date}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {formData.civil_service_date && (
                                            <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: '600', display: 'block', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                                                📅 កាលបរិច្ឆេទជ្រើសរើស៖ {formData.civil_service_date}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <Input
                                            label={t("រយៈពេលបម្រើការ (គិតជា ឆ្នាំ/ខែ)", "Service Duration (Years/Months)")}
                                            name="service_duration"
                                            value={formData.service_duration}
                                            onChange={handleInputChange}
                                            placeholder="e.g. 5 ឆ្នាំ 6 ខែ"
                                        />
                                        {formData.civil_service_date && (
                                            <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '700', display: 'block', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
                                                ⚡ គណនាស្វ័យប្រវត្តិតាមកាលបរិច្ឆេទ៖ {calculateServiceDuration(formData.civil_service_date)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: Education Level & Specializations */}
                    {activeTab === 'education' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🎓 {t("កម្រិតវប្បធម៌ គុណវិវឌ្ឍ និង ឯកទេស", "Education, Qualifications & Majors")}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            {t("កម្រិតវប្បធម៌", "Education Level")} <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            list="edu_levels"
                                            name="education_level"
                                            value={formData.education_level}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. បរិញ្ញាបត្រ..."
                                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
                                        />
                                        <datalist id="edu_levels">
                                            <option value="បរិញ្ញាបត្រ" />
                                            <option value="បរិញ្ញាបត្រជាន់ខ្ពស់" />
                                            <option value="បណ្ឌិត" />
                                            <option value="មធ្យមសិក្សាទុតិយភូមិ" />
                                        </datalist>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            {t("គុណវិវឌ្ឍ (គរុកោសល្យ)", "Qualification / Pedagogy Degree")} <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            list="qualifications_list"
                                            name="qualification"
                                            value={formData.qualification}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. គរុកោសល្យ+១, គរុកោសល្យ+២..."
                                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
                                        />
                                        <datalist id="qualifications_list">
                                            <option value="គរុកោសល្យ+១" />
                                            <option value="គរុកោសល្យ+២" />
                                            <option value="គរុកោសល្យ+៣" />
                                            <option value="បរិញ្ញាបត្រ+១" />
                                            <option value="បរិញ្ញាបត្រជាន់ខ្ពស់គរុកោសល្យ" />
                                        </datalist>
                                    </div>

                                    <Input
                                        label={<span>{t("ឯកទេសទី ១ (អែកទេស១)", "Specialization 1")} <span style={{ color: '#ef4444' }}>*</span></span>}
                                        name="specialization_1"
                                        value={formData.specialization_1}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. គណិតវិទ្យា"
                                    />

                                    <Input
                                        label={<span>{t("ឯកទេសទី ២ (អែកទេស២)", "Specialization 2")} <span style={{ color: '#64748b', fontSize: '0.8rem' }}>(ជម្រើស / Optional)</span></span>}
                                        name="specialization_2"
                                        value={formData.specialization_2}
                                        onChange={handleInputChange}
                                        placeholder="e.g. ព័ត៌មានវិទ្យា"
                                    />

                                    <Input
                                        label={<span>{t("ឯកទេសទី ៣ (អែកទេស៣)", "Specialization 3")} <span style={{ color: '#64748b', fontSize: '0.8rem' }}>(ជម្រើស / Optional)</span></span>}
                                        name="specialization_3"
                                        value={formData.specialization_3}
                                        onChange={handleInputChange}
                                        placeholder="e.g. ភាសាអង់គ្លេស"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: Teaching & Class Assignments */}
                    {activeTab === 'teaching' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    📚 {t("ការបង្រៀន បន្ទុកថ្នាក់ និង បច្ចេកវិទ្យា", "Teaching Level, Homeroom & EdTech")}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            {t("កម្រិតបង្រៀន", "Teaching Level")} <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <select
                                            name="teaching_level"
                                            value={formData.teaching_level}
                                            onChange={handleInputChange}
                                            required
                                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
                                        >
                                            <option value="បឋមសិក្សា">🏫 បឋមសិក្សា (Primary)</option>
                                            <option value="អនុវិទ្យាល័យ">🏫 អនុវិទ្យាល័យ (Junior High)</option>
                                            <option value="វិទ្យាល័យ">🏫 វិទ្យាល័យ (High School)</option>
                                            <option value="បឋម និង អនុវិទ្យាល័យ">🏫 បឋម និង អនុវិទ្យាល័យ</option>
                                            <option value="អនុ និង វិទ្យាល័យ">🏫 អនុ និង វិទ្យាល័យ</option>
                                        </select>
                                    </div>

                                    <Input
                                        label={<span>{t("បង្រៀនកម្រិតថ្នាក់ (ឧ. ទី៧, ៨, ៩)", "Grades Taught (e.g. Grades 7, 8, 9)")} <span style={{ color: '#ef4444' }}>*</span></span>}
                                        name="grades_taught"
                                        value={formData.grades_taught}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. ថ្នាក់ទី ៧, ៨, ៩"
                                    />

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            {t("គ្រូប្រើបច្ចេកវិទ្យា (EdTech Teacher)", "Technology Using Teacher")} <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <select
                                            name="technology_usage"
                                            value={formData.technology_usage}
                                            onChange={handleInputChange}
                                            required
                                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600' }}
                                        >
                                            <option value="ប្រើប្រាស់">💻 ប្រើប្រាស់ (Uses Tech)</option>
                                            <option value="មិនប្រើប្រាស់">🚫 មិនប្រើប្រាស់ (Does Not Use Tech)</option>
                                            <option value="កម្រិតខ្ពស់ (EdTech)">🚀 កម្រិតខ្ពស់ (Advanced EdTech)</option>
                                        </select>
                                    </div>

                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            👑 {t("ជ្រើសរើសថ្នាក់បន្ទុក (Homeroom Class Assignment)", "Select Homeroom Class")} <span style={{ color: '#64748b', fontSize: '0.8rem' }}>(ជម្រើស / Optional)</span>
                                        </label>
                                        <select
                                            name="class_id"
                                            value={formData.class_id}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                                        >
                                            <option value="">-- {t("គ្មានថ្នាក់បន្ទុក (គ្រូមុខវិជ្ជា)", "No Homeroom (Subject Teacher Only)")} --</option>
                                            {classes.map(c => {
                                                const assignedTeacher = teachers.find(tItem =>
                                                    String(tItem.id) !== String(editingId) &&
                                                    tItem.teacher_class_assignments?.some(a => String(a.class_id) === String(c.id))
                                                );

                                                const isTakenByOther = !!assignedTeacher;

                                                return (
                                                    <option
                                                        key={c.id}
                                                        value={c.id}
                                                        disabled={isTakenByOther}
                                                        style={{ color: isTakenByOther ? '#94a3b8' : '#0f172a', backgroundColor: isTakenByOther ? '#f1f5f9' : '#ffffff' }}
                                                    >
                                                        👑 {c.name} ({c.grade_level}) {isTakenByOther ? `❌ (${t("មានគ្រូបន្ទុក: ", "Has Teacher: ")}${assignedTeacher.name})` : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: Awards & Honors */}
                    {activeTab === 'awards' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🏆 {t("ស្នាដៃពានរង្វាន់ និង ជ័យលាភីទទួលបាន", "Awards, Achievements & Honors")}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            🏅 {t("ស្នាដៃពានរង្វាន់ (Awards & Achievements)", "Awards & Achievements")} <span style={{ color: '#64748b', fontSize: '0.8rem' }}>(ជម្រើស / Optional)</span>
                                        </label>
                                        <textarea
                                            name="awards"
                                            rows={3}
                                            value={formData.awards}
                                            onChange={handleInputChange}
                                            placeholder="e.g. គ្រូបង្រៀនឆ្នើមប្រចាំឆ្នាំ២០២៥, ពានរង្វាន់សម្ដេចតេជោ..."
                                            style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            🎖️ {t("ជ័យលាភីទទួលបាន (Honors & Medals Received)", "Honors & Medals Received")} <span style={{ color: '#64748b', fontSize: '0.8rem' }}>(ជម្រើស / Optional)</span>
                                        </label>
                                        <textarea
                                            name="honors"
                                            rows={3}
                                            value={formData.honors}
                                            onChange={handleInputChange}
                                            placeholder="e.g. មេដាយមុនីសារភ័ណ្ឌ ថ្នាក់អស្សឫទ្ធិ, មេដាយការងារ..."
                                            style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'inherit' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </form>
            </Modal>

            {/* View Details Modal for Teachers */}
            <Modal
                isOpen={!!viewingTeacher}
                onClose={() => setViewingTeacher(null)}
                title={t("ប្រវត្តិរូបគ្រូបង្រៀនពេញលេញ 👁️", "Complete Teacher Profile 👁️")}
                maxWidth="750px"
                footer={
                    <Button variant="secondary" onClick={() => setViewingTeacher(null)}>{t('បិទ', 'Close')}</Button>
                }
            >
                {viewingTeacher && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {/* Header Avatar & Summary Banner */}
                        <div style={{ display: 'flex', gap: '1.25rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bbf7d0', alignItems: 'center' }}>
                            {getImageUrl(viewingTeacher.photo) ? (
                                <img src={getImageUrl(viewingTeacher.photo)} alt={viewingTeacher.name} style={{ width: '75px', height: '75px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #16a34a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            ) : (
                                <div style={{ width: '75px', height: '75px', borderRadius: '50%', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                                    {viewingTeacher.name?.charAt(0) || 'T'}
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>{viewingTeacher.name}</h3>
                                    {viewingTeacher.civil_servant_id && (
                                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0284c7', backgroundColor: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                            🆔 {viewingTeacher.civil_servant_id}
                                        </span>
                                    )}
                                </div>
                                <p style={{ margin: '3px 0 8px 0', color: '#64748b', fontSize: '0.9rem' }}>{viewingTeacher.email}</p>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span style={{ padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', backgroundColor: '#dcfce7', color: '#166534' }}>
                                        🏷️ {viewingTeacher.position || 'គ្រូបង្រៀន'}
                                    </span>
                                    <span style={{ padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                                        🏛️ {viewingTeacher.civil_service_framework || 'គ្រូឧត្តម'}
                                    </span>
                                    <span style={{ padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', backgroundColor: (viewingTeacher.gender || 'male') === 'male' ? '#dbeafe' : '#fce7f3', color: (viewingTeacher.gender || 'male') === 'male' ? '#1d4ed8' : '#be185d' }}>
                                        {(viewingTeacher.gender || 'male') === 'male' ? t('👨 ប្រុស', '👨 Male') : t('👩 ស្រី', '👩 Female')}
                                    </span>
                                    <span style={{ padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', backgroundColor: '#fef3c7', color: '#92400e' }}>
                                        ⚡ {viewingTeacher.activity_status || 'កំពុងបម្រើការ'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Profile Details Grid Sections */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                            {/* Personal Info Card */}
                            <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    👤 {t("ព័ត៌មានផ្ទាល់ខ្លួន", "Personal Info")}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <div><span style={{ color: '#64748b' }}>ថ្ងៃខែឆ្នាំកំណើត:</span> <strong>🎂 {calculateAge(viewingTeacher.date_of_birth)} ({viewingTeacher.date_of_birth || 'N/A'})</strong></div>
                                    <div><span style={{ color: '#64748b' }}>លេខទូរស័ព្ទ:</span> <strong>📞 {viewingTeacher.phone || 'N/A'}</strong></div>
                                    <div><span style={{ color: '#64748b' }}>អាសយដ្ឋាន:</span> <strong>📍 {viewingTeacher.address || 'N/A'}</strong></div>
                                    <div><span style={{ color: '#64748b' }}>អត្តលេខមន្ត្រីរាជការ:</span> <strong>🆔 {viewingTeacher.civil_servant_id || 'N/A'}</strong></div>
                                </div>
                            </div>

                            {/* Civil Service & Rank Card */}
                            <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🏛️ {t("ព័ត៌មានរាជការ & ក្របខណ្ឌ", "Civil Service & Rank")}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <div><span style={{ color: '#64748b' }}>តួនាទី:</span> <strong>🏷️ {viewingTeacher.position || 'គ្រូបង្រៀន'}</strong></div>
                                    <div><span style={{ color: '#64748b' }}>ក្របខណ្ឌ:</span> <strong>🏛️ {viewingTeacher.civil_service_framework || 'គ្រូឧត្តម'}</strong></div>
                                    <div><span style={{ color: '#64748b' }}>ថ្ងៃចូលបម្រើរាជការ:</span> <strong>📅 {viewingTeacher.civil_service_date || 'N/A'}</strong></div>
                                    <div><span style={{ color: '#64748b' }}>រយៈពេលបម្រើការ:</span> <strong>⏳ {viewingTeacher.service_duration || calculateServiceDuration(viewingTeacher.civil_service_date) || 'N/A'}</strong></div>
                                </div>
                            </div>

                            {/* Education & Specializations */}
                            <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🎓 {t("កម្រិតវប្បធម៌ & ឯកទេស", "Education & Majors")}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <div><span style={{ color: '#64748b' }}>កម្រិតវប្បធម៌:</span> <strong>🎓 {viewingTeacher.education_level || 'បរិញ្ញាបត្រ'}</strong></div>
                                    <div><span style={{ color: '#64748b' }}>គុណវិវឌ្ឍ:</span> <strong>📜 {viewingTeacher.qualification || 'គរុកោសល្យ+១'}</strong></div>
                                    <div><span style={{ color: '#64748b' }}>ឯកទេស១:</span> <strong style={{ color: '#0369a1' }}>📘 {viewingTeacher.specialization_1 || viewingTeacher.specialization || 'N/A'}</strong></div>
                                    <div><span style={{ color: '#64748b' }}>ឯកទេស២:</span> <strong>📗 {viewingTeacher.specialization_2 || 'N/A'}</strong></div>
                                    <div><span style={{ color: '#64748b' }}>ឯកទេស៣:</span> <strong>📙 {viewingTeacher.specialization_3 || 'N/A'}</strong></div>
                                </div>
                            </div>

                            {/* Teaching & Class Charges */}
                            <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    📚 {t("ការបង្រៀន & បន្ទុកថ្នាក់", "Teaching & Class Charge")}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <div><span style={{ color: '#64748b' }}>កម្រិតបង្រៀន:</span> <strong>🏫 {viewingTeacher.teaching_level || 'អនុវិទ្យាល័យ'}</strong></div>
                                    <div><span style={{ color: '#64748b' }}>បង្រៀនកំរិតថ្នាក់:</span> <strong>📖 {viewingTeacher.grades_taught || 'N/A'}</strong></div>
                                    <div><span style={{ color: '#64748b' }}>បន្ទុកថ្នាក់ទី:</span> <strong style={{ color: '#15803d' }}>👑 {viewingTeacher.class_charge || 'N/A'}</strong></div>
                                    <div><span style={{ color: '#64748b' }}>គ្រូប្រើបច្ចេកវិទ្យា:</span> <strong>💻 {viewingTeacher.technology_usage || 'ប្រើប្រាស់'}</strong></div>
                                </div>
                            </div>

                        </div>

                        {/* Awards & Achievements Card */}
                        {(viewingTeacher.awards || viewingTeacher.honors) && (
                            <div style={{ background: '#fff1f2', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #fecdd3' }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.88rem', color: '#be185d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🏆 {t("ស្នាដៃពានរង្វាន់ & ជ័យលាភីទទួលបាន", "Awards & Honors Received")}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                                    {viewingTeacher.awards && (
                                        <div>
                                            <span style={{ color: '#9f1239', fontWeight: '700', display: 'block', marginBottom: '2px' }}>🏅 ស្នាដៃពានរង្វាន់:</span>
                                            <p style={{ margin: 0, color: '#4c0519', whiteSpace: 'pre-line' }}>{viewingTeacher.awards}</p>
                                        </div>
                                    )}
                                    {viewingTeacher.honors && (
                                        <div>
                                            <span style={{ color: '#9f1239', fontWeight: '700', display: 'block', marginBottom: '2px' }}>🎖️ ជ័យលាភីទទួលបាន:</span>
                                            <p style={{ margin: 0, color: '#4c0519', whiteSpace: 'pre-line' }}>{viewingTeacher.honors}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Official Homeroom Assignment */}
                        <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', color: '#166534', textTransform: 'uppercase' }}>
                                👑 {t("ការចាត់តាំងគ្រូបន្ទុកថ្នាក់ផ្លូវការ", "Official Homeroom Class Assignment")}
                            </h4>
                            {viewingTeacher.teacher_class_assignments && viewingTeacher.teacher_class_assignments.length > 0 ? (
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {viewingTeacher.teacher_class_assignments.map(a => (
                                        <span key={a.id} style={{ fontWeight: '700', color: '#15803d', backgroundColor: '#ffffff', padding: '0.3rem 0.75rem', borderRadius: '12px', fontSize: '0.88rem', border: '1px solid #bbf7d0' }}>
                                            👑 {a.school_class?.name} ({a.school_class?.grade_level})
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ margin: 0, fontStyle: 'italic', color: '#64748b', fontSize: '0.88rem' }}>{t("មិនមែនជាគ្រូបន្ទុកថ្នាក់ឡើយ", "Subject teacher (No Homeroom)")}</p>
                            )}
                        </div>

                    </div>
                )}
            </Modal>

            {/* Teacher Official ID Card & QR Code Modal */}
            <TeacherIDCardModal
                isOpen={!!cardTeacher}
                onClose={() => setCardTeacher(null)}
                teacher={cardTeacher}
            />
        </div>
    );
};

export default Teachers;
