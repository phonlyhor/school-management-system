import { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { getUser, setUser } from '../../utils/storage';
import api from '../../services/api';
import toast from 'react-hot-toast';

import StudentIDCardModal from './StudentIDCardModal';

const roleBadges = {
    admin: { label: '🛡️ Administrator (អ្នកគ្រប់គ្រង)', bg: '#e0e7ff', color: '#3730a3' },
    teacher: { label: '💻 Teacher (គ្រូបង្រៀន)', bg: '#dcfce7', color: '#166534' },
    student: { label: '🎓 Student (សិស្ស)', bg: '#fef9c3', color: '#854d0e' },
    parent: { label: '👨‍👩‍👧‍👦 Parent (អាណាព្យាបាល)', bg: '#ffedd5', color: '#9a3412' }
};

const getImageUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
    return `${baseUrl}/${photo.replace(/^\//, '')}`;
};

const UserProfilePage = ({ roleName = 'User' }) => {
    const currentUser = getUser() || {};
    const [name, setName] = useState(currentUser.name || '');
    const [email, setEmail] = useState(currentUser.email || '');
    const [userData, setUserData] = useState(currentUser);
    const [showIdCardModal, setShowIdCardModal] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchMeDetails = async () => {
            try {
                const res = await api.get('/me');
                if (res.data?.user) {
                    const u = res.data.user;
                    setName(u.name || currentUser.name || '');
                    setEmail(u.email || currentUser.email || '');
                    setUserData(u);
                    setUser({ ...currentUser, ...u });
                }
            } catch (err) {
                console.error("Failed to fetch /me endpoint:", err);
            }
        };
        fetchMeDetails();
    }, []);

    const currentRoleKey = (userData.role || roleName).toLowerCase();
    const isAdmin = currentRoleKey === 'admin';
    const b = roleBadges[currentRoleKey] || { label: `${roleName} Profile`, bg: '#e0e7ff', color: '#3730a3' };
    const photoUrl = getImageUrl(userData.photo);

    const handleSave = async (e) => {
        e.preventDefault();

        if (!isAdmin) {
            toast.error("Only School Administrators can modify user profiles!");
            return;
        }

        if (password && password !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        setIsSaving(true);
        try {
            const payload = { name, email };
            if (password) payload.password = password;

            const res = await api.put('/profile', payload);
            const updatedUser = res.data?.user || { ...currentUser, name, email };

            setUser({ ...currentUser, ...updatedUser });
            toast.success("Profile updated successfully! 🎉");
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error("Failed to update profile:", err);
            toast.error("Error updating profile: " + (err.response?.data?.message || err.message));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">{roleName} Profile (ប្រវត្តិរូបផ្ទាល់ខ្លួន) 👤</h1>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                        View your account credentials, photo, and system role details.
                    </p>
                </div>
            </div>

            {/* Profile Header Banner */}
            <Card style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: '#ffffff' }}>
                <div className="profile-banner-header" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {photoUrl ? (
                        <img 
                            src={photoUrl} 
                            alt={name} 
                            style={{ width: '85px', height: '85px', borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255, 255, 255, 0.4)' }}
                        />
                    ) : (
                        <div style={{ width: '85px', height: '85px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 'bold', border: '4px solid rgba(255, 255, 255, 0.4)' }}>
                            {name ? name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}
                    <div>
                        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.5rem' }}>{name || 'User Account'}</h2>
                        <p style={{ margin: '0 0 8px 0', color: '#c7d2fe', fontSize: '0.95rem' }}>{email}</p>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '700', backgroundColor: b.bg, color: b.color, display: 'inline-block' }}>
                            {b.label}
                        </span>
                    </div>
                    {currentRoleKey === 'student' && (
                        <div style={{ marginLeft: 'auto' }}>
                            <Button 
                                variant="secondary" 
                                onClick={() => setShowIdCardModal(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', backgroundColor: 'rgba(255, 255, 255, 0.18)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.35)' }}
                            >
                                🪪 {t("កាតសិស្ស & QR Code", "ID Card & QR Code")}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            <StudentIDCardModal 
                isOpen={showIdCardModal}
                onClose={() => setShowIdCardModal(false)}
                student={userData}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Account Details Card */}
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem', marginBottom: '1.25rem' }}>
                        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>
                            {isAdmin ? '✏️ Edit Account Credentials' : '👤 Account Details (ព័ត៌មានគណនី)'}
                        </h3>
                        {!isAdmin && (
                            <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>
                                🔒 Read-Only
                            </span>
                        )}
                    </div>

                    {!isAdmin ? (
                        /* READ-ONLY VIEW FOR TEACHER, STUDENT, PARENT */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Full Name (ឈ្មោះពេញ):</span>
                                <h4 style={{ margin: '0.2rem 0 0 0', color: '#0f172a', fontSize: '1.1rem' }}>{name}</h4>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Email Address (អ៊ីមែល):</span>
                                <h4 style={{ margin: '0.2rem 0 0 0', color: '#0369a1', fontSize: '1.1rem' }}>{email}</h4>
                            </div>

                            {/* Additional Student / Academic Metadata */}
                            {userData.student_code && (
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Student ID Code (អត្តលេខសិស្ស):</span>
                                    <h4 style={{ margin: '0.2rem 0 0 0', color: '#4f46e5', fontSize: '1.1rem' }}>{userData.student_code}</h4>
                                </div>
                            )}

                            {userData.class && (
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Assigned Class (ថ្នាក់រៀន):</span>
                                    <h4 style={{ margin: '0.2rem 0 0 0', color: '#16a34a', fontSize: '1.1rem' }}>
                                        {userData.class} {userData.grade_level ? `(Grade ${userData.grade_level})` : ''}
                                    </h4>
                                </div>
                            )}

                            {/* Informational Read-Only Alert Banner */}
                            <div style={{ background: '#eff6ff', padding: '1rem 1.2rem', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                                <h4 style={{ margin: '0 0 0.4rem 0', color: '#1e40af', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    ℹ️ Read-Only Account (ព័ត៌មានរក្សាទុកដោយសាលា)
                                </h4>
                                <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.88rem', lineHeight: '1.5' }}>
                                    Profile details for {roleName}s can only be modified by <strong>School Administrators</strong>. Please contact the Admin team if you need to update your email or account credentials.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* EDIT FORM FOR ADMIN ONLY */
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <Input 
                                label="Full Name (ឈ្មោះ)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <Input 
                                label="Email Address (អ៊ីមែល)"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 0.8rem 0' }}>
                                    Change Password (leave blank to keep current password):
                                </p>
                                <Input 
                                    label="New Password (ពាក្យសម្ងាត់ថ្មី)"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password..."
                                />
                                <div style={{ marginTop: '1rem' }}>
                                    <Input 
                                        label="Confirm New Password (បញ្ជាក់ពាក្យសម្ងាត់ថ្មី)"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter new password..."
                                    />
                                </div>
                            </div>
                            <Button type="submit" variant="primary" loading={isSaving} style={{ marginTop: '0.5rem' }}>
                                💾 Save Changes (រក្សាទុក)
                            </Button>
                        </form>
                    )}
                </Card>

                {/* Role & System Information Card */}
                <Card>
                    <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem', marginBottom: '1.25rem' }}>
                        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>
                            🛡️ Role & Permissions Overview
                        </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>System Access Level:</span>
                            <div style={{ marginTop: '0.4rem' }}>
                                <span style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.88rem', fontWeight: '700', backgroundColor: b.bg, color: b.color }}>
                                    {b.label}
                                </span>
                            </div>
                        </div>

                        {userData.gender && (
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Gender (ភេទ):</span>
                                <h4 style={{ margin: '0.2rem 0 0 0', color: '#0f172a', fontSize: '1rem' }}>{userData.gender}</h4>
                            </div>
                        )}

                        {userData.dob && (
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Date of Birth (ថ្ងៃខែឆ្នាំកំណើត):</span>
                                <h4 style={{ margin: '0.2rem 0 0 0', color: '#0f172a', fontSize: '1rem' }}>{userData.dob}</h4>
                            </div>
                        )}

                        {userData.phone && (
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Contact Phone (លេខទូរស័ព្ទ):</span>
                                <h4 style={{ margin: '0.2rem 0 0 0', color: '#0f172a', fontSize: '1rem' }}>{userData.phone}</h4>
                            </div>
                        )}

                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Security Status:</span>
                            <p style={{ margin: '0.3rem 0 0 0', color: '#16a34a', fontWeight: '600', fontSize: '0.92rem' }}>
                                🟢 Authenticated via Sanctum Token
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default UserProfilePage;
