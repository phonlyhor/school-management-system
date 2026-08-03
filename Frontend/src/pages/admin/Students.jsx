import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import StudentIdCardModal from '../../components/admin/StudentIdCardModal';
import MeritCertificateModal from '../../components/common/MeritCertificateModal';
import StudyCertificateModal from '../../components/common/StudyCertificateModal';
import { useLanguage } from '../../context/LanguageContext';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../services/studentService';
import { getClasses } from '../../services/classService';
import toast from 'react-hot-toast';

const Students = () => {
    const { lang, t } = useLanguage();
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [viewingStudent, setViewingStudent] = useState(null);
    const [printingStudent, setPrintingStudent] = useState(null);
    const [meritStudent, setMeritStudent] = useState(null);
    const [studyCertStudent, setStudyCertStudent] = useState(null);

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [formTab, setFormTab] = useState('student'); // 'student' | 'family'

    // Form state combining User and Student fields
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        student_code: '',
        date_of_birth: '',
        age: '',
        gender: '',
        class_id: '',
        phone: '',
        address: '',
        father_name: '',
        father_dob: '',
        father_age: '',
        father_phone: '',
        mother_name: '',
        mother_dob: '',
        mother_age: '',
        mother_phone: '',
        place_of_birth: '',
        photo: '',
        max_leave_days: 10
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [studentRes, classRes] = await Promise.all([
                getStudents(),
                getClasses()
            ]);
            setStudents(studentRes.data.students || []);
            setClasses(classRes.data.classes || []);
        } catch (err) {
            console.error("Failed to fetch students data:", err);
            setError(t("មានបញ្ហាក្នុងការទាញយកទិន្នន័យសិស្ស", "Failed to load students. Please try again."));
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

    const calculateAgeNum = (dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return isNaN(age) || age < 0 ? '' : String(age);
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'date_of_birth') {
            const calculatedAge = calculateAgeNum(value);
            setFormData(prev => ({
                ...prev,
                date_of_birth: value,
                age: calculatedAge
            }));
        } else if (name === 'father_dob') {
            const calculatedFatherAge = calculateAgeNum(value);
            setFormData(prev => ({
                ...prev,
                father_dob: value,
                father_age: calculatedFatherAge
            }));
        } else if (name === 'mother_dob') {
            const calculatedMotherAge = calculateAgeNum(value);
            setFormData(prev => ({
                ...prev,
                mother_dob: value,
                mother_age: calculatedMotherAge
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
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
        payload.append('student_code', formData.student_code);

        if (formData.password) {
            payload.append('password', formData.password);
        }

        if (formData.date_of_birth) {
            payload.append('date_of_birth', formData.date_of_birth);
        }

        if (formData.gender) {
            payload.append('gender', formData.gender);
        }

        if (formData.class_id) {
            payload.append('class_id', formData.class_id);
        }

        if (formData.phone) {
            payload.append('phone', formData.phone);
        }

        if (formData.address) {
            payload.append('address', formData.address);
        }

        if (formData.father_name) {
            payload.append('father_name', formData.father_name);
        }

        if (formData.father_dob) {
            payload.append('father_dob', formData.father_dob);
        }

        if (formData.father_phone) {
            payload.append('father_phone', formData.father_phone);
        }

        if (formData.mother_name) {
            payload.append('mother_name', formData.mother_name);
        }

        if (formData.mother_dob) {
            payload.append('mother_dob', formData.mother_dob);
        }

        if (formData.mother_phone) {
            payload.append('mother_phone', formData.mother_phone);
        }

        if (formData.place_of_birth) {
            payload.append('place_of_birth', formData.place_of_birth);
        }

        if (formData.max_leave_days) {
            payload.append('max_leave_days', formData.max_leave_days);
        }

        if (photoFile) {
            payload.append('photo', photoFile);
        }

        try {
            if (editingId) {
                await updateStudent(editingId, payload);
                toast.success(t("បានកែប្រែប្រវត្តិរូបសិស្សដោយជោគជ័យ!", "Student updated successfully!"));
            } else {
                await createStudent(payload);
                toast.success(t("បានបន្ថែមសិស្សថ្មីដោយជោគជ័យ!", "Student added successfully!"));
            }
            setIsModalOpen(false);
            setEditingId(null);
            setPhotoFile(null);
            setPhotoPreview(null);
            fetchData();
        } catch (err) {
            console.error("Failed to save student:", err);
            toast.error(t("មានបញ្ហាក្នុងការរក្សាទុកសិស្ស៖ ", "Error saving student: ") + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (row) => {
        setEditingId(row.id);
        setPhotoFile(null);
        setPhotoPreview(getImageUrl(row.photo));

        const dob = row.date_of_birth || '';
        const calculatedAge = calculateAgeNum(dob);
        const fatherDob = row.father_dob || '';
        const motherDob = row.mother_dob || '';

        setFormData({
            name: row.user?.name || '',
            email: row.user?.email || '',
            password: '', 
            student_code: row.student_code || '',
            date_of_birth: dob,
            age: calculatedAge,
            gender: row.gender || 'Male',
            class_id: row.class_id || '',
            phone: row.phone || '',
            address: row.address || '',
            father_name: row.father_name || '',
            father_dob: fatherDob,
            father_age: calculateAgeNum(fatherDob),
            father_phone: row.father_phone || '',
            mother_name: row.mother_name || '',
            mother_dob: motherDob,
            mother_age: calculateAgeNum(motherDob),
            mother_phone: row.mother_phone || '',
            place_of_birth: row.place_of_birth || '',
            photo: row.photo || '',
            max_leave_days: row.max_leave_days || 10
        });
        setFormTab('student');
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t("តើអ្នកពិតជាចង់លុបទិន្នន័យសិស្សនេះមែនទេ? ប្រតិបត្តិការនេះមិនអាចត្រឡប់វិញបានឡើយ។", "Are you sure you want to delete this student completely (including user account)? This cannot be undone."))) {
            try {
                await deleteStudent(id);
                fetchData();
                toast.success(t("បានលុបទិន្នន័យសិស្សដោយជោគជ័យ!", "Student deleted successfully!"));
            } catch (err) {
                console.error("Failed to delete student:", err);
                toast.error(t("មានបញ្ហាក្នុងការលុបសិស្ស៖ ", "Error deleting student: ") + (err.response?.data?.message || err.message));
            }
        }
    };

    const generateStudentCode = () => {
        const nextNum = students.length + 1;
        return `STU-${String(nextNum).padStart(4, '0')}`;
    };

    const formatGrade = (gl) => {
        if (!gl) return '';
        return gl.toLowerCase().startsWith('grade') ? gl : `${t('កម្រិតថ្នាក់', 'Grade')} ${gl}`;
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
        return isNaN(age) || age < 0 ? 'N/A' : `${age} ${t('ឆ្នាំ', 'Years')}`;
    };

    // Calculate Gender Stats
    const totalStudentsCount = students.length;
    const maleStudentsCount = students.filter(s => (s.gender || '').toLowerCase() === 'male').length;
    const femaleStudentsCount = students.filter(s => (s.gender || '').toLowerCase() === 'female').length;

    const columns = [
        { header: t('អត្តលេខ', 'Code'), accessor: 'student_code' },
        { 
            header: t('ឈ្មោះសិស្ស', 'Name'), 
            render: (row) => {
                const img = getImageUrl(row.photo);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {img ? (
                            <img src={img} alt={row.user?.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
                        ) : (
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                                {row.user?.name?.charAt(0) || 'S'}
                            </div>
                        )}
                        <div>
                            <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{row.user?.name || 'Unknown'}</strong>
                            {row.class_position && row.class_position !== 'Member' && (
                                <span style={{
                                    display: 'inline-block', marginLeft: '0.4rem', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                                    backgroundColor: row.class_position === 'Class Monitor' ? '#fef3c7' : '#e0e7ff',
                                    color: row.class_position === 'Class Monitor' ? '#92400e' : '#4338ca'
                                }}>
                                    {row.class_position === 'Class Monitor' ? `👑 ${t("ប្រធានថ្នាក់", "Monitor")}` : row.class_position === 'Vice Monitor' ? `⭐ ${t("អនុប្រធាន", "Vice")}` : row.class_position}
                                </span>
                            )}
                        </div>
                    </div>
                );
            } 
        },
        { 
            header: t('ភេទ', 'Gender'), 
            render: (row) => {
                const g = (row.gender || '').toLowerCase();
                const isMale = g === 'male';
                const isFemale = g === 'female';
                return (
                    <span style={{ 
                        padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '700',
                        backgroundColor: isMale ? '#e0f2fe' : isFemale ? '#fce7f3' : '#f1f5f9',
                        color: isMale ? '#0369a1' : isFemale ? '#be185d' : '#475569'
                    }}>
                        {isMale ? t('👨 ប្រុស', '👨 Male') : isFemale ? t('👩 ស្រី', '👩 Female') : row.gender || 'N/A'}
                    </span>
                );
            } 
        },
        { 
            header: t('ថ្នាក់រៀន', 'Class / Grade'), 
            render: (row) => {
                if (!row.school_class) return <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>{t("មិនទាន់បានចាត់", "Unassigned")}</span>;
                const cls = row.school_class;
                const streamBadge = cls.stream === 'science' 
                    ? <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', fontWeight: '700', color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '0.15rem 0.45rem', borderRadius: '10px' }}>🧪 {t("វិទ្យាសាស្ត្រ", "Science")}</span>
                    : cls.stream === 'social_science'
                    ? <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', fontWeight: '700', color: '#c2410c', backgroundColor: '#ffedd5', padding: '0.15rem 0.45rem', borderRadius: '10px' }}>📜 {t("វិទ្យាសាស្ត្រសង្គម", "Social Science")}</span>
                    : null;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong>{cls.name}</strong>&nbsp;({formatGrade(cls.grade_level)})
                        {streamBadge}
                    </div>
                );
            }
        },
        { 
            header: t('សកម្មភាព', 'Actions'), 
            render: (row) => (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <Button 
                        size="small" 
                        variant="secondary" 
                        onClick={(e) => { e.stopPropagation(); setViewingStudent(row); }}
                        title={t("មើលព័ត៌មានលម្អិត", "View Details")}
                    >
                        👁️
                    </Button>
                    <Button 
                        size="small" 
                        variant="secondary" 
                        onClick={(e) => { e.stopPropagation(); setPrintingStudent(row); }}
                        title={t("បោះពុម្ពប័ណ្ណសម្គាល់ខ្លួនសិស្ស", "Print Student ID Card")}
                        style={{ backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: '700' }}
                    >
                        🖨️ ID
                    </Button>
                    <Button 
                        size="small" 
                        variant="secondary" 
                        onClick={(e) => { e.stopPropagation(); setMeritStudent(row); }}
                        title={t("បោះពុម្ពប័ណ្ណសរសើរ", "Print Merit Certificate")}
                        style={{ backgroundColor: '#fef3c7', color: '#92400e', fontWeight: '700' }}
                    >
                        🎖️
                    </Button>
                    <Button 
                        size="small" 
                        variant="secondary" 
                        onClick={(e) => { e.stopPropagation(); setStudyCertStudent(row); }}
                        title={t("បោះពុម្ពលិខិតបញ្ជាក់ការសិក្សា", "Print Study Certificate")}
                        style={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: '700' }}
                    >
                        📄
                    </Button>
                    <Button size="small" variant="secondary" onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}>{t('កែប្រែ', 'Edit')}</Button>
                    <Button size="small" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>{t('លុប', 'Delete')}</Button>
                </div>
            )
        }
    ];

    const positionRank = {
        'Class Monitor': 1,
        'Vice Monitor': 2,
        'Treasurer': 3,
        'Secretary': 4,
        'Member': 5
    };

    const filteredStudents = students
        .filter(s => {
            const matchesSearch = !search || 
                (s.user?.name && s.user.name.toLowerCase().includes(search.toLowerCase())) || 
                (s.student_code && s.student_code.toLowerCase().includes(search.toLowerCase())) ||
                (s.school_class?.name && s.school_class.name.toLowerCase().includes(search.toLowerCase()));

            const matchesClass = !selectedClassFilter || 
                (selectedClassFilter === 'unassigned' ? !s.class_id : String(s.class_id) === String(selectedClassFilter));

            const matchesGender = !genderFilter || (s.gender || '').toLowerCase() === genderFilter.toLowerCase();

            return matchesSearch && matchesClass && matchesGender;
        })
        .sort((a, b) => (positionRank[a.class_position] || 99) - (positionRank[b.class_position] || 99));

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{t("គ្រប់គ្រងសិស្សសាលា 🎓", "Manage Students 🎓")}</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        {t("ចុះឈ្មោះសិស្សថ្មី ចម្រោះតាមប្រុស/ស្រី ចាត់តាំងថ្នាក់ និង បោះពុម្ពប័ណ្ណសិស្ស។", "Enroll new students, filter by male/female, assign classes, and inspect profile details.")}
                    </p>
                </div>
                <Button onClick={() => { 
                    setEditingId(null); 
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    setFormData({ 
                        name: '', email: '', password: '', 
                        student_code: generateStudentCode(), date_of_birth: '', age: '', gender: 'Male', 
                        class_id: '', phone: '', address: '',
                        father_name: '', father_dob: '', father_age: '', father_phone: '',
                        mother_name: '', mother_dob: '', mother_age: '', mother_phone: '',
                        place_of_birth: '', photo: '', max_leave_days: 10
                    }); 
                    setFormTab('student');
                    setIsModalOpen(true); 
                }}>
                    {t("+ បន្ថែមសិស្ស", "+ Add Student")}
                </Button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* Gender Statistics & Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setGenderFilter('')}
                    style={{
                        padding: '0.55rem 1.1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                        border: genderFilter === '' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                        backgroundColor: genderFilter === '' ? '#eef2ff' : '#ffffff',
                        color: genderFilter === '' ? '#4338ca' : '#475569',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s ease'
                    }}
                >
                    👥 {t("សិស្សសរុប", "All Students")}: <span style={{ color: '#4338ca' }}>{totalStudentsCount}</span>
                </button>

                <button
                    onClick={() => setGenderFilter('Male')}
                    style={{
                        padding: '0.55rem 1.1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                        border: genderFilter === 'Male' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        backgroundColor: genderFilter === 'Male' ? '#e0f2fe' : '#ffffff',
                        color: genderFilter === 'Male' ? '#0369a1' : '#475569',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s ease'
                    }}
                >
                    👨 {t("សិស្សប្រុស", "Male Students")}: <span style={{ color: '#0284c7' }}>{maleStudentsCount}</span>
                </button>

                <button
                    onClick={() => setGenderFilter('Female')}
                    style={{
                        padding: '0.55rem 1.1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                        border: genderFilter === 'Female' ? '2px solid #db2777' : '1px solid #cbd5e1',
                        backgroundColor: genderFilter === 'Female' ? '#fce7f3' : '#ffffff',
                        color: genderFilter === 'Female' ? '#be185d' : '#475569',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s ease'
                    }}
                >
                    👩 {t("សិស្សស្រី", "Female Students")}: <span style={{ color: '#db2777' }}>{femaleStudentsCount}</span>
                </button>
            </div>

            <Card>
                <div style={{ marginBottom: '1.5rem' }}>
                    {/* Search & Multi Filter Bar */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: '250px' }}>
                            <Input 
                                placeholder={t("ស្វែងរកតាមឈ្មោះ, កូដសិស្ស...", "Search by name, code...")} 
                                value={search}
                                onChange={handleSearch}
                                style={{ margin: 0 }}
                            />
                        </div>
                        
                        {/* Select Class Dropdown Filter */}
                        <div style={{ minWidth: '200px' }}>
                            <select 
                                value={selectedClassFilter} 
                                onChange={(e) => setSelectedClassFilter(e.target.value)}
                                style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a', fontWeight: '500' }}
                            >
                                <option value="">🏫 {t("ថ្នាក់រៀនទាំងអស់", "All Classes")}</option>
                                <option value="unassigned">⚠️ {t("មិនទាន់មានថ្នាក់រៀន", "Unassigned Class")}</option>
                                {classes.map(c => {
                                    const streamLabel = c.stream === 'science' 
                                        ? '🧪 វិទ្យាសាស្ត្រ' 
                                        : c.stream === 'social_science' 
                                        ? '📜 វិទ្យាសាស្ត្រសង្គម' 
                                        : '';
                                    return (
                                        <option key={c.id} value={c.id}>
                                            👑 {c.name} ({formatGrade(c.grade_level)}) {streamLabel ? `• ${streamLabel}` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {(search || selectedClassFilter) && (
                            <Button size="small" variant="secondary" onClick={() => { setSearch(''); setSelectedClassFilter(''); }}>
                                {t("លុបការស្វែងរក ✖️", "Clear Search ✖️")}
                            </Button>
                        )}

                        <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.88rem', fontWeight: '600' }}>
                            {t(`បង្ហាញ ${filteredStudents.length} នៃសិស្សសរុប ${students.length} នាក់`, `Showing ${filteredStudents.length} of ${students.length} Students`)}
                        </div>
                    </div>
                </div>
                
                {loading ? (
                    <p>{t("កំពុងទាញយកទិន្នន័យ...", "Loading students...")}</p>
                ) : (
                    <Table columns={columns} data={filteredStudents} />
                )}
            </Card>

            {/* Modal Add/Edit Student */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => { if (!isSubmitting) { setIsModalOpen(false); setEditingId(null); } }}
                title={editingId ? t('កែប្រែប្រវត្តិរូបសិស្ស', 'Edit Student Profile') : t('បន្ថែមសិស្សថ្មី', 'Enroll New Student')}
                maxWidth="800px"
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setFormTab('student')}
                                style={{
                                    padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600',
                                    border: formTab === 'student' ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                                    backgroundColor: formTab === 'student' ? '#eef2ff' : '#ffffff',
                                    color: formTab === 'student' ? '#4338ca' : '#64748b', cursor: 'pointer'
                                }}
                            >
                                1. 🎓 {t("សិស្ស & គណនី", "Student Info")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormTab('family')}
                                style={{
                                    padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600',
                                    border: formTab === 'family' ? '1px solid #16a34a' : '1px solid #e2e8f0',
                                    backgroundColor: formTab === 'family' ? '#f0fdf4' : '#ffffff',
                                    color: formTab === 'family' ? '#15803d' : '#64748b', cursor: 'pointer'
                                }}
                            >
                                2. 👨‍👩‍👧‍👦 {t("គ្រួសារ & អាសយដ្ឋាន", "Family & Address")}
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>{t('បោះបង់', 'Cancel')}</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? t('កំពុងរក្សាទុក...', 'Saving...') : t('រក្សាទុកសិស្ស', 'Save Student')}
                            </Button>
                        </div>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Tab Navigation Header */}
                    <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => setFormTab('student')}
                            style={{
                                padding: '0.6rem 1.2rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: formTab === 'student' ? '3px solid #4f46e5' : '3px solid transparent',
                                color: formTab === 'student' ? '#4f46e5' : '#64748b',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            🎓 {t("ព័ត៌មានផ្ទាល់ខ្លួន & គណនី", "Student Details & Account")}
                        </button>

                        <button
                            type="button"
                            onClick={() => setFormTab('family')}
                            style={{
                                padding: '0.6rem 1.2rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: formTab === 'family' ? '3px solid #16a34a' : '3px solid transparent',
                                color: formTab === 'family' ? '#16a34a' : '#64748b',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            👨‍👩‍👧‍👦 {t("ព័ត៌មានគ្រួសារ & អាសយដ្ឋាន", "Family & Address")}
                        </button>
                    </div>

                    {/* TAB 1: Student Profile & Academic */}
                    {formTab === 'student' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Photo Upload Header Card */}
                            <div style={{ background: '#f8fafc', padding: '0.85rem 1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{ position: 'relative' }}>
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #6366f1', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    ) : (
                                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {formData.name ? formData.name.charAt(0).toUpperCase() : '🎓'}
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.3rem' }}>
                                        {t("រូបថតប្រវត្តិរូបសិស្ស", "Student Profile Photo")}
                                    </label>
                                    <label style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem',
                                        background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer',
                                        fontSize: '0.82rem', fontWeight: '600', color: '#475569', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
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

                            {/* Section 1: Academic & Login Account */}
                            <div style={{ background: '#ffffff', padding: '1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.9rem', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    🔑 {t("គណនីចូលប្រព័ន្ធ & អត្តលេខ", "Student Login Credentials & ID")}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                                    <Input 
                                        label={t("អត្តលេខសិស្ស", "Student Code (ID)")} 
                                        name="student_code"
                                        value={formData.student_code}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="STU-0001"
                                    />
                                    <Input 
                                        label={t("ឈ្មោះពេញសិស្ស", "Student Full Name")} 
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. Chan Dara"
                                    />
                                    <Input 
                                        label={t("អាសយដ្ឋានអ៊ីមែល", "Email Address")} 
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="student@school.com"
                                    />
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

                            {/* Section 2: Personal Info & Class Assignment */}
                            <div style={{ background: '#ffffff', padding: '1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.9rem', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    👤 {t("ព័ត៌មានផ្ទាល់ខ្លួន & ការចាត់ថ្នាក់", "Personal Details & Class Assignment")}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            {t("ភេទ", "Gender")} <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <select 
                                            name="gender" 
                                            value={formData.gender} 
                                            onChange={handleInputChange} 
                                            required
                                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                                        >
                                            <option value="Male">👨 {t("ប្រុស", "Male")}</option>
                                            <option value="Female">👩 {t("ស្រី", "Female")}</option>
                                        </select>
                                    </div>

                                    <Input 
                                        label={t("ថ្ងៃខែឆ្នាំកំណើត", "Date of Birth")} 
                                        name="date_of_birth"
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={handleInputChange}
                                    />

                                    <Input 
                                        label={t("អាយុ (គណនាស្វ័យប្រវត្តិ)", "Age (Auto Calculated)")} 
                                        name="age"
                                        value={formData.age ? `${formData.age} ${t("ឆ្នាំ", "Years")}` : ''}
                                        readOnly
                                        style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#475569', fontWeight: 'bold' }}
                                        placeholder={t("ជ្រើសរើសថ្ងៃកំណើត", "Select DoB first")}
                                    />

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            {t("ថ្នាក់រៀន", "Class Assignment")}
                                        </label>
                                        <select 
                                            name="class_id" 
                                            value={formData.class_id} 
                                            onChange={handleInputChange} 
                                            style={{ width: '100%', height: '42px', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                                        >
                                            <option value="">-- {t("ជ្រើសរើសថ្នាក់", "Select Class")} --</option>
                                            {classes.map(c => {
                                                const streamLabel = c.stream === 'science' 
                                                    ? '🧪 វិទ្យាសាស្ត្រ (Science)' 
                                                    : c.stream === 'social_science' 
                                                    ? '📜 វិទ្យាសាស្ត្រសង្គម (Social Science)' 
                                                    : '';
                                                return (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name} {c.grade_level ? `(Grade ${c.grade_level})` : ''} {streamLabel ? `• ${streamLabel}` : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Family & Address Details */}
                    {formTab === 'family' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Father Info */}
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <strong style={{ color: '#0369a1', fontSize: '0.88rem', display: 'block', marginBottom: '0.75rem' }}>👨 {t("ព័ត៌មានឪពុក", "Father's Details")}</strong>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                    <Input 
                                        label={t("ឈ្មោះឪពុក", "Father Name")} 
                                        name="father_name"
                                        value={formData.father_name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Sok Kim"
                                    />
                                    <Input 
                                        label={t("ថ្ងៃកំណើតឪពុក", "Father DoB")} 
                                        name="father_dob"
                                        type="date"
                                        value={formData.father_dob}
                                        onChange={handleInputChange}
                                    />
                                    <Input 
                                        label={t("អាយុឪពុក", "Father Age")} 
                                        name="father_age"
                                        value={formData.father_age ? `${formData.father_age} ${t("ឆ្នាំ", "Years")}` : ''}
                                        readOnly
                                        style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#475569', fontWeight: 'bold' }}
                                    />
                                    <Input 
                                        label={t("លេខទូរស័ព្ទឪពុក", "Father Phone")} 
                                        name="father_phone"
                                        value={formData.father_phone}
                                        onChange={handleInputChange}
                                        placeholder="012 345 678"
                                    />
                                </div>
                            </div>

                            {/* Mother Info */}
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <strong style={{ color: '#0369a1', fontSize: '0.88rem', display: 'block', marginBottom: '0.75rem' }}>👩 {t("ព័ត៌មានម្តាយ", "Mother's Details")}</strong>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                    <Input 
                                        label={t("ឈ្មោះម្តាយ", "Mother Name")} 
                                        name="mother_name"
                                        value={formData.mother_name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Keo Chann"
                                    />
                                    <Input 
                                        label={t("ថ្ងៃកំណើតម្តាយ", "Mother DoB")} 
                                        name="mother_dob"
                                        type="date"
                                        value={formData.mother_dob}
                                        onChange={handleInputChange}
                                    />
                                    <Input 
                                        label={t("អាយុម្តាយ", "Mother Age")} 
                                        name="mother_age"
                                        value={formData.mother_age ? `${formData.mother_age} ${t("ឆ្នាំ", "Years")}` : ''}
                                        readOnly
                                        style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#475569', fontWeight: 'bold' }}
                                    />
                                    <Input 
                                        label={t("លេខទូរស័ព្ទម្តាយ", "Mother Phone")} 
                                        name="mother_phone"
                                        value={formData.mother_phone}
                                        onChange={handleInputChange}
                                        placeholder="012 345 678"
                                    />
                                </div>
                            </div>

                            {/* Guardian Phone & Address */}
                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                                    <Input 
                                        label={t("លេខទូរស័ព្ទអាណាព្យាបាល (ទូទៅ)", "General Guardian Phone")} 
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 012 345 678"
                                    />
                                    <Input 
                                        label={t("ទីកន្លែងកំណើត", "Place of Birth")} 
                                        name="place_of_birth"
                                        value={formData.place_of_birth}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Battambang Province"
                                    />
                                </div>

                                <div style={{ marginTop: '0.85rem' }}>
                                    <Input 
                                        label={t("អាសយដ្ឋានបច្ចុប្បន្ន", "Current Address")} 
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Khan Sen Sok, Phnom Penh"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </form>
            </Modal>

            {/* View Details Modal for Student */}
            <Modal 
                isOpen={!!viewingStudent} 
                onClose={() => setViewingStudent(null)}
                title={t("ព័ត៌មានលម្អិតប្រវត្តិរូបសិស្ស 👁️", "Student Profile Details 👁️")}
                maxWidth="700px"
                footer={
                    <Button variant="secondary" onClick={() => setViewingStudent(null)}>{t('បិទ', 'Close')}</Button>
                }
            >
                {viewingStudent && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {/* Header Profile Banner */}
                        <div style={{ display: 'flex', gap: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                            {getImageUrl(viewingStudent.photo) ? (
                                <img src={getImageUrl(viewingStudent.photo)} alt={viewingStudent.user?.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #6366f1' }} />
                            ) : (
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 'bold' }}>
                                    {viewingStudent.user?.name?.charAt(0) || 'S'}
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{viewingStudent.user?.name}</h3>
                                    <span style={{ fontSize: '0.85rem', color: '#4f46e5', fontWeight: '700', backgroundColor: '#e0e7ff', padding: '0.15rem 0.5rem', borderRadius: '8px' }}>
                                        {viewingStudent.student_code}
                                    </span>
                                </div>
                                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>{viewingStudent.user?.email}</p>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div>
                                <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>{t("ភេទ", "Gender")}</p>
                                <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>
                                    {(viewingStudent.gender || '').toLowerCase() === 'female' ? t('👩 ស្រី', 'Female') : t('👨 ប្រុស', 'Male')}
                                </p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>{t("អាយុ / ថ្ងៃកំណើត", "Age / Date of Birth")}</p>
                                <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>
                                    🎂 {calculateAge(viewingStudent.date_of_birth)} ({viewingStudent.date_of_birth || 'N/A'})
                                </p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>{t("ថ្នាក់រៀន", "Class")}</p>
                                <p style={{ margin: 0, fontWeight: '600', color: '#4f46e5' }}>
                                    🏫 {viewingStudent.school_class?.name || t('មិនទាន់បានចាត់', 'Unassigned')}
                                </p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 3px 0', color: '#64748b', fontSize: '0.85rem' }}>{t("លេខទូរស័ព្ទអាណាព្យាបាល", "Guardian Phone")}</p>
                                <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>
                                    📞 {viewingStudent.phone || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Parents & Location */}
                        <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#16a34a', textTransform: 'uppercase' }}>
                                👨‍👩‍👧‍👦 {t("ព័ត៌មានគ្រួសារ & អាសយដ្ឋាន", "Family & Address")}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem' }}>
                                <div><strong>👨 {t("ឈ្មោះឪពុក:", "Father:")}</strong> {viewingStudent.father_name || 'N/A'}</div>
                                <div><strong>🎂 {t("អាយុ/ថ្ងៃកំណើតឪពុក:", "Father Age/DoB:")}</strong> {viewingStudent.father_dob ? `${calculateAge(viewingStudent.father_dob)} (${viewingStudent.father_dob})` : 'N/A'}</div>
                                <div><strong>📞 {t("លេខទូរស័ព្ទឪពុក:", "Father Phone:")}</strong> {viewingStudent.father_phone || 'N/A'}</div>
                                <div style={{ borderBottom: '1px solid #e2e8f0', gridColumn: 'span 2', margin: '4px 0' }}></div>
                                <div><strong>👩 {t("ឈ្មោះម្តាយ:", "Mother:")}</strong> {viewingStudent.mother_name || 'N/A'}</div>
                                <div><strong>🎂 {t("អាយុ/ថ្ងៃកំណើតម្តាយ:", "Mother Age/DoB:")}</strong> {viewingStudent.mother_dob ? `${calculateAge(viewingStudent.mother_dob)} (${viewingStudent.mother_dob})` : 'N/A'}</div>
                                <div><strong>📞 {t("លេខទូរស័ព្ទម្តាយ:", "Mother Phone:")}</strong> {viewingStudent.mother_phone || 'N/A'}</div>
                                <div style={{ borderBottom: '1px solid #e2e8f0', gridColumn: 'span 2', margin: '4px 0' }}></div>
                                <div style={{ gridColumn: 'span 2' }}><strong>📍 {t("ទីកន្លែងកំណើត:", "Place of Birth:")}</strong> {viewingStudent.place_of_birth || 'N/A'}</div>
                                <div style={{ gridColumn: 'span 2' }}><strong>🏠 {t("អាសយដ្ឋានបច្ចុប្បន្ន:", "Current Address:")}</strong> {viewingStudent.address || 'N/A'}</div>
                            </div>
                        </div>

                    </div>
                )}
            </Modal>

            {/* Print Student ID Card Modal */}
            {printingStudent && (
                <StudentIdCardModal
                    isOpen={!!printingStudent}
                    onClose={() => setPrintingStudent(null)}
                    student={printingStudent}
                />
            )}

            {/* Print Merit Certificate Modal */}
            {meritStudent && (
                <MeritCertificateModal
                    isOpen={!!meritStudent}
                    onClose={() => setMeritStudent(null)}
                    student={meritStudent}
                />
            )}

            {/* Print Study Enrollment Certificate Modal */}
            {studyCertStudent && (
                <StudyCertificateModal
                    isOpen={!!studyCertStudent}
                    onClose={() => setStudyCertStudent(null)}
                    student={studyCertStudent}
                />
            )}
        </div>
    );
};

export default Students;
