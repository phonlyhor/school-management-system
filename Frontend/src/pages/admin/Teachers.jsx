import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../../services/teacherService';
import { getClasses } from '../../services/classService';
import toast from 'react-hot-toast';

const Teachers = () => {
    const { lang, t } = useLanguage();
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [homeroomFilter, setHomeroomFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [viewingTeacher, setViewingTeacher] = useState(null);

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    // Form state for Teacher
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        gender: 'male',
        password: '',
        date_of_birth: '',
        specialization: '',
        address: '',
        phone: '',
        class_id: '',
        photo: ''
    });
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
        return `${baseUrl}/${photo.replace(/^\//, '')}`;
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

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('email', formData.email);
        payload.append('gender', formData.gender || 'male');

        if (formData.password) {
            payload.append('password', formData.password);
        }

        if (formData.date_of_birth) {
            payload.append('date_of_birth', formData.date_of_birth);
        }

        if (formData.specialization) {
            payload.append('specialization', formData.specialization);
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

        try {
            if (editingId) {
                await updateTeacher(editingId, payload);
                toast.success(t("បានកែប្រែព័ត៌មានគ្រូបង្រៀនដោយជោគជ័យ!", "Teacher updated successfully!"));
            } else {
                await createTeacher(payload);
                toast.success(t("បានបន្ថែមគ្រូបង្រៀនថ្មីដោយជោគជ័យ!", "Teacher added successfully!"));
            }
            setIsModalOpen(false);
            setEditingId(null);
            setPhotoFile(null);
            setPhotoPreview(null);
            setFormData({ name: '', email: '', gender: 'male', password: '', date_of_birth: '', specialization: '', address: '', phone: '', class_id: '', photo: '' });
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

        setFormData({
            name: row.name || '',
            email: row.email || '',
            gender: row.gender || 'male',
            password: '', 
            date_of_birth: row.date_of_birth || '',
            specialization: row.specialization || '',
            address: row.address || '',
            phone: row.phone || '',
            class_id: homeroomAssignment || '',
            photo: row.photo || ''
        });
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
            header: t('ឈ្មោះគ្រូបង្រៀន', 'Teacher Name'), 
            render: (row) => {
                const img = getImageUrl(row.photo);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {img ? (
                            <img src={img} alt={row.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
                        ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                                {row.name?.charAt(0) || 'T'}
                            </div>
                        )}
                        <div>
                            <strong style={{ color: '#0f172a', fontSize: '0.95rem', display: 'block' }}>{row.name}</strong>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{row.email}</span>
                        </div>
                    </div>
                );
            } 
        },
        {
            header: t('ភេទ', 'Gender'),
            render: (row) => {
                const isMale = (row.gender || 'male') === 'male';
                return (
                    <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        backgroundColor: isMale ? '#dbeafe' : '#fce7f3',
                        color: isMale ? '#1d4ed8' : '#be185d'
                    }}>
                        {isMale ? t('👨 ប្រុស', '👨 Male') : t('👩 ស្រី', '👩 Female')}
                    </span>
                );
            }
        },
        {
            header: t('មុខជំនាញ', 'Specialization'),
            render: (row) => (
                <span style={{ fontWeight: '600', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                    📘 {row.specialization || 'N/A'}
                </span>
            )
        },
        {
            header: t('អាយុ / ថ្ងៃកំណើត', 'Age / DoB'),
            render: (row) => calculateAge(row.date_of_birth)
        },
        {
            header: t('ទំនាក់ទំនង / អាសយដ្ឋាន', 'Contact / Location'),
            render: (row) => (
                <div style={{ fontSize: '0.82rem' }}>
                    <div style={{ color: '#0f172a', fontWeight: '600' }}>📞 {row.phone || 'N/A'}</div>
                    <div style={{ color: '#64748b' }}>📍 {row.address || 'N/A'}</div>
                </div>
            )
        },
        { 
            header: t('គ្រូបន្ទុកថ្នាក់', 'Homeroom Assignment'), 
            render: (row) => {
                const assignedClasses = row.teacher_class_assignments?.map(a => a.school_class?.name).filter(Boolean);
                if (assignedClasses && assignedClasses.length > 0) {
                    return (
                        <span style={{ fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                            👑 {t('គ្រូបន្ទុកថ្នាក់', 'Homeroom')}: {assignedClasses.join(', ')}
                        </span>
                    );
                }
                return <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.85rem' }}>- ({t('គ្រូមុខវិជ្ជា', 'Subject Teacher')})</span>;
            }
        },
        { 
            header: t('សកម្មភាព', 'Actions'), 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
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

    const filteredTeachers = teachers.filter(t => {
        const matchesSearch = !search || 
            (t.name && t.name.toLowerCase().includes(search.toLowerCase())) || 
            (t.email && t.email.toLowerCase().includes(search.toLowerCase())) ||
            (t.specialization && t.specialization.toLowerCase().includes(search.toLowerCase())) ||
            (t.address && t.address.toLowerCase().includes(search.toLowerCase())) ||
            (t.phone && t.phone.toLowerCase().includes(search.toLowerCase()));

        const hasHomeroom = t.teacher_class_assignments && t.teacher_class_assignments.length > 0;

        const matchesHomeroom = !homeroomFilter || 
            (homeroomFilter === 'homeroom' ? hasHomeroom : !hasHomeroom);

        const matchesGender = !genderFilter || (t.gender || 'male') === genderFilter;

        return matchesSearch && matchesHomeroom && matchesGender;
    });

    const totalCount = teachers.length;
    const homeroomCount = teachers.filter(t => t.teacher_class_assignments && t.teacher_class_assignments.length > 0).length;
    const subjectCount = totalCount - homeroomCount;

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("គ្រប់គ្រងគ្រូបង្រៀន 💻", "Manage Teachers 💻")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("បន្ថែម និង គ្រប់គ្រងប្រវត្តិរូបគ្រូបង្រៀន ជ្រើសរើសភេទ បញ្ចូលរូបថត និង ចាត់តាំងគ្រូបន្ទុកថ្នាក់។", "Add and manage teacher profiles, select gender, upload photo, and assign homeroom classes.")}
                    </p>
                </div>
                <Button onClick={() => { 
                    setEditingId(null); 
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    setFormData({ name: '', email: '', gender: 'male', password: '', class_id: '', photo: '' }); 
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

                {/* Gender Filter Dropdown */}
                <div style={{ marginLeft: 'auto' }}>
                    <select
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value)}
                        style={{ height: '42px', padding: '0.55rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', backgroundColor: '#ffffff' }}
                    >
                        <option value="">🚻 {t("ភេទទាំងអស់", "All Genders")}</option>
                        <option value="male">👨 {t("គ្រូប្រុស", "Male Teachers")}</option>
                        <option value="female">👩 {t("គ្រូស្រី", "Female Teachers")}</option>
                    </select>
                </div>
            </div>

            <Card>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: '280px' }}>
                            <Input 
                                placeholder={t("ស្វែងរកតាមឈ្មោះ, អ៊ីមែល...", "Search by name, email...")} 
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
                onClose={() => { if (!isSubmitting) { setIsModalOpen(false); setEditingId(null); } }}
                title={editingId ? t('កែប្រែប្រវត្តិរូបគ្រូបង្រៀន', 'Edit Teacher Profile') : t('បន្ថែមគ្រូបង្រៀនថ្មី', 'Add New Teacher')}
                maxWidth="650px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>{t('បោះបង់', 'Cancel')}</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? t('កំពុងរក្សាទុក...', 'Saving...') : t('រក្សាទុក', 'Save Teacher')}
                        </Button>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Photo Upload Header Card */}
                    <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
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
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem' }}>
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
                                <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: '#16a34a', fontWeight: '500' }}>
                                    ✓ {photoFile.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Login Account & Credentials */}
                    <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🔑 {t("គណនីគ្រូបង្រៀន", "Teacher Credentials")}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Input 
                                label={t("ឈ្មោះពេញគ្រូបង្រៀន", "Teacher Full Name")} 
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                placeholder="e.g. Sok Dara"
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                                    label={t("អាសយដ្ឋានអ៊ីមែល", "Email Address")} 
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="teacher@school.com"
                                />
                            </div>

                            <Input 
                                label={editingId ? t("ពាក្យសម្ងាត់ (ទុកទំនេរប្រសិនបើមិនដូរ)", "Password (blank to keep current)") : t("ពាក្យសម្ងាត់", "Password")} 
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required={!editingId}
                                minLength={6}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {/* Personal & Professional Details */}
                    <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            👨‍🏫 {t("ព័ត៌មានលម្អិតគ្រូបង្រៀន", "Teacher Details")}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input 
                                label={t("មុខជំនាញ (ឧ. គណិតវិទ្យា)", "Specialization (e.g. Mathematics)")} 
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleInputChange}
                                placeholder="e.g. Mathematics / Physics"
                            />
                            <Input 
                                label={t("ថ្ងៃខែឆ្នាំកំណើត", "Date of Birth")} 
                                name="date_of_birth"
                                type="date"
                                value={formData.date_of_birth}
                                onChange={handleInputChange}
                            />
                            <Input 
                                label={t("លេខទូរស័ព្ទ", "Phone Number")} 
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="e.g. 012 345 678"
                            />
                            <Input 
                                label={t("អាសយដ្ឋាន / ទីតាំង", "Address / Location")} 
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="e.g. Phnom Penh, Cambodia"
                            />
                        </div>
                    </div>

                    {/* Homeroom Assignment */}
                    <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            👑 {t("ការចាត់តាំងគ្រូបន្ទុកថ្នាក់", "Class Homeroom Assignment")}
                        </h4>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                {t("ជ្រើសរើសថ្នាក់បន្ទុក", "Select Homeroom Class")}
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

                </form>
            </Modal>

            {/* View Details Modal for Teachers */}
            <Modal 
                isOpen={!!viewingTeacher} 
                onClose={() => setViewingTeacher(null)}
                title={t("ព័ត៌មានលម្អិតគ្រូបង្រៀន 👁️", "Teacher Details 👁️")}
                maxWidth="600px"
                footer={
                    <Button variant="secondary" onClick={() => setViewingTeacher(null)}>{t('បិទ', 'Close')}</Button>
                }
            >
                {viewingTeacher && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {/* Header Avatar & Role Badge */}
                        <div style={{ display: 'flex', gap: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                            {getImageUrl(viewingTeacher.photo) ? (
                                <img src={getImageUrl(viewingTeacher.photo)} alt={viewingTeacher.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #16a34a' }} />
                            ) : (
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 'bold' }}>
                                    {viewingTeacher.name?.charAt(0) || 'T'}
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: '#0f172a' }}>{viewingTeacher.name}</h3>
                                <p style={{ margin: '0 0 6px 0', color: '#64748b', fontSize: '0.9rem' }}>{viewingTeacher.email}</p>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span style={{ padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', backgroundColor: '#dcfce7', color: '#166534' }}>
                                        💻 {t("គ្រូបង្រៀន", "Teacher")}
                                    </span>
                                    <span style={{ padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', backgroundColor: (viewingTeacher.gender || 'male') === 'male' ? '#dbeafe' : '#fce7f3', color: (viewingTeacher.gender || 'male') === 'male' ? '#1d4ed8' : '#be185d' }}>
                                        {(viewingTeacher.gender || 'male') === 'male' ? t('👨 ប្រុស', '👨 Male') : t('👩 ស្រី', '👩 Female')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Personal Details Grid */}
                        <div style={{ background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                📋 {t("ព័ត៌មានផ្ទាល់ខ្លួន & មុខជំនាញ", "Personal & Specialization Info")}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>{t("មុខជំនាញ", "Specialization")}</p>
                                    <p style={{ margin: '0', fontWeight: '600', color: '#0369a1' }}>
                                        📘 {viewingTeacher.specialization || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>{t("អាយុ / ថ្ងៃកំណើត", "Age / Date of Birth")}</p>
                                    <p style={{ margin: '0', fontWeight: '600', color: '#0f172a' }}>
                                        🎂 {calculateAge(viewingTeacher.date_of_birth)} ({viewingTeacher.date_of_birth || 'N/A'})
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>{t("លេខទូរស័ព្ទ", "Phone Number")}</p>
                                    <p style={{ margin: '0', fontWeight: '600', color: '#0f172a' }}>
                                        📞 {viewingTeacher.phone || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>{t("អាសយដ្ឋាន / ទីតាំង", "Address / Location")}</p>
                                    <p style={{ margin: '0', fontWeight: '600', color: '#0f172a' }}>
                                        📍 {viewingTeacher.address || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Homeroom Assignment */}
                        <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#166534', textTransform: 'uppercase' }}>
                                👑 {t("ការចាត់តាំងគ្រូបន្ទុកថ្នាក់", "Homeroom Class Assignment")}
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
        </div>
    );
};

export default Teachers;
