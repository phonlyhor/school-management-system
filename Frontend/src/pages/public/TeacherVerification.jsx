import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import { FiCheckCircle, FiAlertCircle, FiPhone, FiMail, FiUser, FiBriefcase, FiAward, FiBookOpen } from 'react-icons/fi';

const getImageUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
    return `${baseUrl}/${photo.replace(/^\//, '')}`;
};

const TeacherVerification = () => {
    const { code } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVerificationData = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/teacher/verify/${code}`);
                setData(res.data);
            } catch (err) {
                console.error("Teacher verification failed:", err);
                setError(err.response?.data?.message || "មិនអាចផ្ទៀងផ្ទាត់ទិន្នន័យគ្រូបង្រៀនបានឡើយ (Failed to verify teacher record)");
            } finally {
                setLoading(false);
            }
        };

        if (code) {
            fetchVerificationData();
        }
    }, [code]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1.5rem' }}>
                <div style={{ textAlign: 'center', color: '#0284c7' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1s infinite linear' }}>⏳</div>
                    <h3>កំពុងផ្ទៀងផ្ទាត់ព័ត៌មានគ្រូបង្រៀន... (Verifying Teacher Record...)</h3>
                </div>
            </div>
        );
    }

    if (error || !data || !data.teacher) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1.5rem' }}>
                <Card style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
                    <div style={{ color: '#dc2626', marginBottom: '1rem' }}>
                        <FiAlertCircle size={60} />
                    </div>
                    <h2 style={{ color: '#0f172a', margin: '0 0 0.5rem 0' }}>ទិន្នន័យមិនត្រឹមត្រូវ (Invalid Record)</h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                        {error || "រកមិនឃើញទិន្នន័យគ្រូបង្រៀនដែលមានអត្តលេខនេះនៅក្នុងប្រព័ន្ធឡើយ។"}
                    </p>
                    <Link to="/login" style={{ textDecoration: 'none', color: '#0284c7', fontWeight: '700', fontSize: '0.95rem' }}>
                        ⬅️ ត្រឡប់ទៅកាន់ទំព័រដើម (Back to Home)
                    </Link>
                </Card>
            </div>
        );
    }

    const teacher = data.teacher;
    const photoUrl = getImageUrl(teacher.photo);

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)', padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ maxWidth: '540px', width: '100%' }}>
                
                {/* Official Verification Header Badge */}
                <div style={{ background: '#16a34a', color: '#ffffff', padding: '0.75rem 1rem', borderRadius: '12px 12px 0 0', textAlign: 'center', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    <FiCheckCircle size={20} />
                    <span>VERIFIED OFFICIAL TEACHER PROFILE</span>
                </div>

                <Card style={{ borderRadius: '0 0 16px 16px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
                    
                    {/* School Identity Header */}
                    <div style={{ textAlign: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                        <img src="/school-logo.png" alt="School Logo" style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '0.5rem' }} />
                        <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>
                            វិទ្យាល័យ ហ៊ុន សែន ចំការលើ
                        </h2>
                        <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            HUN SEN CHAMKAR LOE HIGH SCHOOL
                        </span>
                        <div style={{ marginTop: '0.4rem', display: 'inline-block', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                            ប័ណ្ណសម្គាល់ខ្លួនគ្រូបង្រៀន & បុគ្គលិកផ្លូវការ
                        </div>
                    </div>

                    {/* Teacher Photo & Profile Banner */}
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                        {photoUrl ? (
                            <img src={photoUrl} alt={teacher.name} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '3px solid #0284c7', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
                        ) : (
                            <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold' }}>
                                👨‍🏫
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: '800' }}>
                                {teacher.name}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                                <span style={{ backgroundColor: '#0284c7', color: 'white', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700' }}>
                                    ID: {teacher.civil_servant_id}
                                </span>
                                <span style={{ backgroundColor: '#f59e0b', color: 'white', padding: '0.15rem 0.55rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700' }}>
                                    {teacher.position}
                                </span>
                            </div>
                            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '500' }}>
                                🎖️ {teacher.civil_service_framework}
                            </span>
                        </div>
                    </div>

                    {/* Detailed Info Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                        
                        <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                                <FiBriefcase size={14} style={{ color: '#0284c7' }} />
                                <span>ឯកទេសបង្រៀន (Major)</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>
                                {teacher.specialization_1} {teacher.specialization_2 && teacher.specialization_2 !== 'N/A' ? ` / ${teacher.specialization_2}` : ''}
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                                <FiAward size={14} style={{ color: '#16a34a' }} />
                                <span>កម្រិតវប្បធម៌ (Degree)</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>
                                {teacher.degree_level}
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                                <FiPhone size={14} style={{ color: '#6366f1' }} />
                                <span>លេខទូរស័ព្ទ (Phone)</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>
                                {teacher.phone}
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                                <FiMail size={14} style={{ color: '#d97706' }} />
                                <span>អ៊ីមែល (Email)</span>
                            </div>
                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', wordBreak: 'break-all' }}>
                                {teacher.email}
                            </div>
                        </div>
                    </div>

                    {/* Assigned Classes */}
                    {teacher.assigned_classes && teacher.assigned_classes.length > 0 && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#166534', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <FiBookOpen size={16} />
                                <span>ថ្នាក់រៀនដែលកំពុងទទួលបន្ទុកបង្រៀន (Assigned Classes):</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {teacher.assigned_classes.map((cls, idx) => (
                                    <span key={idx} style={{ backgroundColor: '#16a34a', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '700' }}>
                                        🏫 {cls}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Verified Official Footer Stamp */}
                    <div style={{ textAlign: 'center', background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px border-dashed #cbd5e1' }}>
                        <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '700' }}>
                            ✅ ប្រព័ន្ធបញ្ជាក់ការផ្ទៀងផ្ទាត់ផ្លូវការ ដោយ វិទ្យាល័យ ហ៊ុន សែន ចំការលើ
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                            System Verification ID: {teacher.civil_servant_id} • Status: Active Teacher
                        </div>
                    </div>

                    {/* Home Navigation Button */}
                    <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', color: '#0284c7', fontWeight: '700', fontSize: '0.9rem' }}>
                            ⬅️ ចូលប្រព័ន្ធគ្រប់គ្រងសាលារៀន (Login to Portal)
                        </Link>
                    </div>

                </Card>
            </div>
        </div>
    );
};

export default TeacherVerification;
