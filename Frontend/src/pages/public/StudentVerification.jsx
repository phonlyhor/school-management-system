import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import { MdOutlineSchool } from 'react-icons/md';
import { FiCheckCircle, FiAlertCircle, FiPhone, FiMail, FiMapPin, FiUser, FiCalendar } from 'react-icons/fi';

const getImageUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
    return `${baseUrl}/${photo.replace(/^\//, '')}`;
};

const StudentVerification = () => {
    const { code } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVerificationData = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/student/verify/${code}`);
                setData(res.data);
            } catch (err) {
                console.error("Verification failed:", err);
                setError(err.response?.data?.message || "មិនអាចផ្ទៀងផ្ទាត់ទិន្នន័យសិស្សបានឡើយ (Failed to verify student record)");
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
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1s infinite linear' }}>⏳</div>
                    <h3>កំពុងផ្ទៀងផ្ទាត់ព័ត៌មានសិស្ស... (Verifying Student Record...)</h3>
                </div>
            </div>
        );
    }

    if (error || !data || !data.student) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1.5rem' }}>
                <Card style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
                    <div style={{ color: '#dc2626', marginBottom: '1rem' }}>
                        <FiAlertCircle size={60} />
                    </div>
                    <h2 style={{ color: '#0f172a', margin: '0 0 0.5rem 0' }}>ទិន្នន័យមិនត្រឹមត្រូវ (Invalid Record)</h2>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                        {error || "រកមិនឃើញទិន្នន័យសិស្សដែលមានអត្តលេខនេះនៅក្នុងប្រព័ន្ធឡើយ។"}
                    </p>
                    <Link to="/login" style={{ textDecoration: 'none', color: '#4f46e5', fontWeight: '700', fontSize: '0.95rem' }}>
                        ⬅️ ត្រឡប់ទៅកាន់ទំព័រដើម (Back to Home)
                    </Link>
                </Card>
            </div>
        );
    }

    const student = data.student;
    const school = data.school;
    const photoUrl = getImageUrl(student.photo);

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ maxWidth: '540px', width: '100%' }}>
                
                {/* Official Verification Header Badge */}
                <div style={{ background: '#16a34a', color: '#ffffff', padding: '0.75rem 1rem', borderRadius: '12px 12px 0 0', textAlign: 'center', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    <FiCheckCircle size={20} />
                    OFFICIAL VERIFIED STUDENT RECORD • វិទ្យាល័យ ហ៊ុន សែន ចំការលើ
                </div>

                {/* Main Student Profile Card */}
                <div style={{ background: '#ffffff', borderRadius: '0 0 16px 16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                    
                    {/* Header Strip */}
                    <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', padding: '1.5rem', color: '#ffffff', textAlign: 'center' }}>
                        <div style={{ background: '#6366f1', width: '48px', height: '48px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                            <MdOutlineSchool size={30} />
                        </div>
                        <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: '800' }}>{school.name_kh}</h2>
                        <span style={{ fontSize: '0.78rem', color: '#c7d2fe', fontWeight: '700', letterSpacing: '0.04em' }}>
                            {school.name_en}
                        </span>
                    </div>

                    {/* Student Photo & Primary Metadata */}
                    <div style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                        {photoUrl ? (
                            <img 
                                src={photoUrl} 
                                alt={student.name} 
                                style={{ width: '110px', height: '130px', borderRadius: '12px', objectFit: 'cover', border: '4px solid #4f46e5', boxShadow: '0 6px 12px rgba(0,0,0,0.15)', marginTop: '-40px' }}
                            />
                        ) : (
                            <div style={{ width: '110px', height: '130px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold', border: '4px solid #4f46e5', boxShadow: '0 6px 12px rgba(0,0,0,0.15)', marginTop: '-40px' }}>
                                {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                        )}

                        <h1 style={{ margin: '0.75rem 0 0.25rem 0', color: '#0f172a', fontSize: '1.4rem', fontWeight: '800' }}>
                            {student.name}
                        </h1>

                        <div style={{ display: 'inline-block', background: '#e0e7ff', color: '#3730a3', padding: '0.25rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '800', marginTop: '0.25rem' }}>
                            អត្តលេខសិស្ស៖ {student.student_code}
                        </div>
                    </div>

                    {/* Grid Metadata Details */}
                    <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc' }}>
                        <div style={{ background: '#ffffff', padding: '0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', display: 'block' }}>ថ្នាក់រៀន (Class)</span>
                            <strong style={{ fontSize: '1.05rem', color: '#16a34a', marginTop: '0.2rem', display: 'block' }}>
                                {student.class?.name || 'N/A'} (Grade {student.class?.grade_level || 'N/A'})
                            </strong>
                        </div>

                        <div style={{ background: '#ffffff', padding: '0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', display: 'block' }}>អត្រាវត្តមាន (Attendance)</span>
                            <strong style={{ fontSize: '1.05rem', color: '#4f46e5', marginTop: '0.2rem', display: 'block' }}>
                                {student.attendance_rate}
                            </strong>
                        </div>

                        <div style={{ background: '#ffffff', padding: '0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', display: 'block' }}>ភេទ (Gender)</span>
                            <strong style={{ fontSize: '0.95rem', color: '#0f172a', marginTop: '0.2rem', display: 'block' }}>
                                {student.gender}
                            </strong>
                        </div>

                        <div style={{ background: '#ffffff', padding: '0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', display: 'block' }}>ថ្ងៃខែឆ្នាំកំណើត (DOB)</span>
                            <strong style={{ fontSize: '0.95rem', color: '#0f172a', marginTop: '0.2rem', display: 'block' }}>
                                {student.dob} ({student.age} ឆ្នាំ)
                            </strong>
                        </div>
                    </div>

                    {/* Homeroom & Parent Section */}
                    <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ marginBottom: '0.8rem', fontSize: '0.88rem', color: '#334155' }}>
                            👨‍🏫 <strong>គ្រូបន្ទុកថ្នាក់ (Homeroom Teacher)៖</strong> {student.class?.homeroom_teacher || 'N/A'}
                        </div>
                        {student.parent && (
                            <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                                👨‍👩‍👧 <strong>អាណាព្យាបាល៖</strong> {student.parent.name} ({student.parent.phone})
                            </div>
                        )}
                    </div>

                    {/* Verification Footer Stamp */}
                    <div style={{ background: '#f1f5f9', padding: '1rem', textAlign: 'center', borderTop: '1px solid #cbd5e1', fontSize: '0.78rem', color: '#64748b' }}>
                        🔒 ព័ត៌មាននេះត្រូវ បានផ្ទៀងផ្ទាត់ដោយប្រព័ន្ធគ្រប់គ្រងសាលារៀនវិទ្យាល័យ ហ៊ុន សែន ចំការលើ (Digital System Verification).
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StudentVerification;
