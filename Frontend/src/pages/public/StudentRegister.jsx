import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MdOutlineSchool } from 'react-icons/md';

const calculateAgeNum = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return isNaN(age) || age < 0 ? '' : age;
};

const StudentRegister = () => {
    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [classes, setClasses] = useState([]);
    const [formTab, setFormTab] = useState('student'); // 'student' or 'family'
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        gender: 'Male',
        date_of_birth: '',
        class_id: '',
        phone: '',
        place_of_birth: '',
        address: '',
        father_name: '',
        father_phone: '',
        mother_name: '',
        mother_phone: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await api.get('/public/classes');
                setClasses(res.data.classes || res.data || []);
            } catch (err) {
                console.error("Failed to load classes for registration:", err);
            }
        };
        fetchClasses();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const isValidEmail = (email) => {
        if (!email) return false;
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email.trim());
    };

    const isValidCambodianPhone = (phone) => {
        if (!phone) return true;
        const regex = /^(0|\+855)[1-9][0-9]{7,8}$/;
        return regex.test(phone.trim());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Email validation check
        if (!isValidEmail(formData.email)) {
            toast.error(t("អាសយដ្ឋានអ៊ីមែលមិនត្រឹមត្រូវទេ! (ឧទាហរណ៍ ៖ student@gmail.com)", "Invalid email address format!"));
            return;
        }

        // Phone validation checks
        if (formData.phone && !isValidCambodianPhone(formData.phone)) {
            toast.error(t("លេខទូរស័ព្ទសិស្សមិនត្រឹមត្រូវទេ! (ឧ. 012345678 ឬ 0971234567)", "Invalid student phone format!"));
            return;
        }
        if (formData.father_phone && !isValidCambodianPhone(formData.father_phone)) {
            toast.error(t("លេខទូរស័ព្ទឪពុកមិនត្រឹមត្រូវទេ! (ឧ. 012345678)", "Invalid father phone format!"));
            return;
        }
        if (formData.mother_phone && !isValidCambodianPhone(formData.mother_phone)) {
            toast.error(t("លេខទូរស័ព្ទម្តាយមិនត្រឹមត្រូវទេ! (ឧ. 012345678)", "Invalid mother phone format!"));
            return;
        }

        setIsSubmitting(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });
            if (photoFile) {
                data.append('photo', photoFile);
            }

            const res = await api.post('/register/student', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success(t("ចុះឈ្មោះសិស្សថ្មីបានជោគជ័យ! 🎉", "Student registered successfully! 🎉"));

            // Auto Login the newly registered student
            if (res.data.access_token && res.data.user) {
                login(res.data.user, res.data.access_token, 'student');
                navigate('/student/dashboard');
            } else {
                navigate('/login');
            }
        } catch (err) {
            console.error("Registration error:", err);
            toast.error(err.response?.data?.message || t("មានបញ្ហាក្នុងការចុះឈ្មោះ", "Error during registration"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculatedAge = calculateAgeNum(formData.date_of_birth);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
            padding: '1.5rem 1rem'
        }}>
            <div style={{ width: '100%', maxWidth: '640px' }}>
                
                {/* Header Logo */}
                <div style={{ textAlign: 'center', marginBottom: '1.25rem', color: 'white' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '0.5rem', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
                    }}>
                        <MdOutlineSchool size={36} color="#ffffff" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', letterSpacing: '0.02em' }}>
                        វិទ្យាល័យ ហ៊ុន សែន ចំការលើ
                    </h2>
                    <p style={{ margin: '0.2rem 0 0 0', opacity: 0.85, fontSize: '0.88rem' }}>
                        {t("📝 ចុះឈ្មោះសិស្សថ្មី (Student Registration)", "Student Self Registration Panel")}
                    </p>
                </div>

                <Card style={{ padding: '1.5rem', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                    
                    {/* Important Reminder Note Box */}
                    <div style={{
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '12px',
                        padding: '0.85rem 1rem',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        boxShadow: '0 2px 4px rgba(245, 158, 11, 0.08)'
                    }}>
                        <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>📌</span>
                        <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: '1.45', fontWeight: '500' }}>
                            <strong style={{ color: '#b45309', fontWeight: '700' }}>
                                {t("ចំណាំសំខាន់ ៖", "Important Note:")}
                            </strong>{' '}
                            {t(
                                "សូមចងចាំអាសយដ្ឋានអ៊ីមែល (Email) និង ពាក្យសម្ងាត់ (Password) របស់ខ្លួនឯងឲ្យបានច្បាស់លាស់ ដើម្បីប្រើប្រាស់សម្រាប់ចូលប្រព័ន្ធ (Login) នៅពេលក្រោយ!",
                                "Please make sure to remember your Email address and Password clearly to use for logging into the system later!"
                            )}
                        </div>
                    </div>

                    {/* Navigation Form Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                        <button
                            type="button"
                            onClick={() => setFormTab('student')}
                            style={{
                                flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer',
                                backgroundColor: formTab === 'student' ? '#4f46e5' : '#f1f5f9',
                                color: formTab === 'student' ? '#ffffff' : '#475569',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            👤 1. {t("ព័ត៌មានសិស្ស", "Student Info")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormTab('family')}
                            style={{
                                flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer',
                                backgroundColor: formTab === 'family' ? '#4f46e5' : '#f1f5f9',
                                color: formTab === 'family' ? '#ffffff' : '#475569',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            👨‍👩‍👧 2. {t("ព័ត៌មានឪពុកម្តាយ", "Parents Info")}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        
                        {/* TAB 1: Student Personal Details */}
                        {formTab === 'student' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                
                                {/* Student Photo Avatar Upload */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label htmlFor="student-photo-upload" style={{ cursor: 'pointer', textAlign: 'center' }}>
                                        <div style={{
                                            width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden',
                                            border: '3px solid #4f46e5', backgroundColor: '#e0e7ff', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.4rem auto',
                                            boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)', position: 'relative'
                                        }}>
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Student Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ textAlign: 'center', color: '#4338ca' }}>
                                                    <span style={{ fontSize: '1.75rem', display: 'block' }}>📷</span>
                                                </div>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4f46e5', background: '#e0e7ff', padding: '0.25rem 0.65rem', borderRadius: '12px' }}>
                                            {photoPreview ? t("🔄 ផ្លាស់ប្តូររូបថត", "Change Photo") : t("📷 បញ្ចូលរូបថតសិស្ស (4x6)", "Upload Photo (4x6)")}
                                        </span>
                                    </label>
                                    <input 
                                        id="student-photo-upload"
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handlePhotoChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                <Input 
                                    label={t("ឈ្មោះពេញសិស្ស", "Student Full Name")}
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. គង់ សុភ័ក្រ"
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                                    <Input 
                                        label={t("អាសយដ្ឋានអ៊ីមែល", "Email Address")}
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="student@gmail.com"
                                    />
                                    <Input 
                                        label={t("ពាក្យសម្ងាត់", "Password")}
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            {t("ភេទ", "Gender")}
                                        </label>
                                        <select 
                                            name="gender" 
                                            value={formData.gender} 
                                            onChange={handleChange}
                                            style={{ width: '100%', height: '42px', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                                        >
                                            <option value="Male">👨 {t("ប្រុស", "Male")}</option>
                                            <option value="Female">👩 {t("ស្រី", "Female")}</option>
                                        </select>
                                    </div>
                                    
                                    {/* Class Selection */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
                                            {t("ថ្នាក់រៀន", "Class Assignment")}
                                        </label>
                                        <select 
                                            name="class_id" 
                                            value={formData.class_id} 
                                            onChange={handleChange}
                                            style={{ width: '100%', height: '42px', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', color: '#0f172a' }}
                                        >
                                            <option value="">-- {t("ជ្រើសរើសថ្នាក់រៀន", "Select Class")} --</option>
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
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                                    <Input 
                                        label={t("ថ្ងៃខែឆ្នាំកំណើត", "Date of Birth")}
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                    />
                                    
                                    {/* Auto-Calculated Age */}
                                    <Input 
                                        label={t("អាយុ (គណនាស្វ័យប្រវត្តិ)", "Age (Auto Calculated)")}
                                        value={calculatedAge ? `${calculatedAge} ${t("ឆ្នាំ", "Years")}` : ''}
                                        readOnly
                                        style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#4338ca', fontWeight: 'bold' }}
                                        placeholder={t("ជ្រើសរើសថ្ងៃកំណើត", "Select DoB first")}
                                    />

                                    <Input 
                                        label={t("លេខទូរស័ព្ទសិស្ស", "Phone Number")}
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="097XXXXXXX"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                                    <Input 
                                        label={t("ទីកន្លែងកំណើត", "Place of Birth")}
                                        name="place_of_birth"
                                        value={formData.place_of_birth}
                                        onChange={handleChange}
                                        placeholder="ស្រុកចំការលើ ខេត្តកំពង់ចាម"
                                    />
                                    <Input 
                                        label={t("អាសយដ្ឋានបច្ចុប្បន្ន", "Current Address")}
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="ភូមិ... ឃុំ... ស្រុក..."
                                    />
                                </div>

                                <Button 
                                    type="button" 
                                    variant="secondary"
                                    onClick={() => setFormTab('family')}
                                    style={{ marginTop: '0.5rem', width: '100%', padding: '0.65rem', fontWeight: '700' }}
                                >
                                    ➡️ {t("បន្តទៅបំពេញព័ត៌មានឪពុកម្តាយ", "Next to Parents Details")}
                                </Button>
                            </div>
                        )}

                        {/* TAB 2: Parents Details */}
                        {formTab === 'family' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                
                                {/* Father Info */}
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                    <strong style={{ color: '#0369a1', fontSize: '0.88rem', display: 'block', marginBottom: '0.75rem' }}>
                                        👨 {t("ព័ត៌មានឪពុក (Father's Details)", "Father Details")}
                                    </strong>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                        <Input 
                                            label={t("ឈ្មោះពេញឪពុក", "Father Name")}
                                            name="father_name"
                                            value={formData.father_name}
                                            onChange={handleChange}
                                            placeholder="ឧ. សុខ ប៊ុនធឿន"
                                        />
                                        <Input 
                                            label={t("លេខទូរស័ព្ទឪពុក", "Father Phone")}
                                            name="father_phone"
                                            value={formData.father_phone}
                                            onChange={handleChange}
                                            placeholder="012XXXXXX"
                                        />
                                    </div>
                                </div>

                                {/* Mother Info */}
                                <div style={{ background: '#fdf2f8', padding: '1rem', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
                                    <strong style={{ color: '#be185d', fontSize: '0.88rem', display: 'block', marginBottom: '0.75rem' }}>
                                        👩 {t("ព័ត៌មានម្តាយ (Mother's Details)", "Mother Details")}
                                    </strong>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                        <Input 
                                            label={t("ឈ្មោះពេញម្តាយ", "Mother Name")}
                                            name="mother_name"
                                            value={formData.mother_name}
                                            onChange={handleChange}
                                            placeholder="ឧ. មាស សុផល"
                                        />
                                        <Input 
                                            label={t("លេខទូរស័ព្ទម្តាយ", "Mother Phone")}
                                            name="mother_phone"
                                            value={formData.mother_phone}
                                            onChange={handleChange}
                                            placeholder="011XXXXXX"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <Button 
                                        type="button" 
                                        variant="secondary"
                                        onClick={() => setFormTab('student')}
                                        style={{ flex: 1, padding: '0.75rem', fontWeight: '700' }}
                                    >
                                        ⬅️ {t("ត្រឡប់ក្រោយ", "Back")}
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        variant="primary" 
                                        loading={isSubmitting}
                                        style={{ flex: 2, padding: '0.75rem', fontWeight: '700', backgroundColor: '#4f46e5' }}
                                    >
                                        🚀 {t("ចុះឈ្មោះឥឡូវនេះ (Register Now)", "Register Account")}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.88rem', color: '#64748b' }}>
                            {t("មានគណនីរួចហើយ?", "Already have an account?")}{' '}
                            <Link to="/login" style={{ color: '#4f46e5', fontWeight: '700', textDecoration: 'none' }}>
                                {t("ចូលប្រព័ន្ធ (Login)", "Login Here")}
                            </Link>
                        </div>
                    </form>
                </Card>

            </div>
        </div>
    );
};

export default StudentRegister;
