import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useLanguage } from '../../context/LanguageContext';
import { MdOutlineSchool } from 'react-icons/md';
import { FiPrinter, FiCheckCircle } from 'react-icons/fi';

const getImageUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
    return `${baseUrl}/${photo.replace(/^\//, '')}`;
};

const StudentIDCardModal = ({ isOpen, onClose, student }) => {
    const { t } = useLanguage();

    if (!student) return null;

    const studentCode = student.student_code || student.code || 'STU-0000';
    const photoUrl = getImageUrl(student.photo);

    // Verification URL generated for QR code scanning
    const origin = window.location.origin;
    const verifyUrl = `${origin}/student/verify/${encodeURIComponent(studentCode)}`;
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(verifyUrl)}&margin=10`;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Student ID Card - ${student.name || 'Student'}</title>
                <style>
                    @page {
                        size: 85.6mm 54mm;
                        margin: 0;
                    }
                    body {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        margin: 0;
                        padding: 0;
                        background: #ffffff;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
                    .id-card {
                        width: 85.6mm;
                        height: 54mm;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        border: 1px solid #cbd5e1;
                        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                        display: flex;
                        flex-direction: column;
                        box-sizing: border-box;
                        position: relative;
                    }
                    .header {
                        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                        color: #ffffff;
                        padding: 6px 10px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .school-title {
                        font-size: 9px;
                        font-weight: 800;
                        line-height: 1.1;
                    }
                    .school-sub {
                        font-size: 6px;
                        color: #c7d2fe;
                        font-weight: 700;
                    }
                    .body {
                        padding: 8px 10px;
                        display: flex;
                        gap: 10px;
                        align-items: center;
                        flex: 1;
                    }
                    .photo-box {
                        width: 52px;
                        height: 62px;
                        border-radius: 6px;
                        object-fit: cover;
                        border: 2px solid #4f46e5;
                    }
                    .info {
                        flex: 1;
                    }
                    .student-name {
                        font-size: 11px;
                        font-weight: 800;
                        color: #0f172a;
                        margin: 0 0 2px 0;
                    }
                    .detail-item {
                        font-size: 7.5px;
                        color: #475569;
                        margin: 1.5px 0;
                    }
                    .badge-code {
                        background: #e0e7ff;
                        color: #3730a3;
                        font-size: 7px;
                        font-weight: 800;
                        padding: 1px 5px;
                        border-radius: 4px;
                        display: inline-block;
                        margin-top: 3px;
                    }
                    .qr-container {
                        width: 46px;
                        height: 46px;
                    }
                    .footer-strip {
                        height: 5px;
                        background: linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%);
                    }
                </style>
            </head>
            <body>
                <div class="id-card">
                    <div class="header">
                        <div>🏫</div>
                        <div>
                            <div class="school-title">វិទ្យាល័យ ហ៊ុន សែន ចំការលើ</div>
                            <div class="school-sub">HUN SEN CHAMKAR LOE HIGH SCHOOL</div>
                        </div>
                    </div>
                    <div class="body">
                        ${photoUrl ? `<img src="${photoUrl}" class="photo-box" />` : `<div class="photo-box" style="display:flex;align-items:center;justify-content:center;background:#e0e7ff;color:#4f46e5;font-weight:bold;font-size:18px;">👤</div>`}
                        <div class="info">
                            <div class="student-name">${student.name || 'Student Name'}</div>
                            <div class="detail-item"><strong>អត្តលេខ (ID):</strong> ${studentCode}</div>
                            <div class="detail-item"><strong>ថ្នាក់ (Class):</strong> ${student.class_name || student.class || 'N/A'}</div>
                            <div class="detail-item"><strong>កម្រិត (Grade):</strong> ${student.grade_level || 'N/A'}</div>
                            <div class="badge-code">STUDENT ID CARD</div>
                        </div>
                        <img src="${qrCodeApiUrl}" class="qr-container" />
                    </div>
                    <div class="footer-strip"></div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t("🪪 កាតសម្គាល់ខ្លួនសិស្ស & QR Code (Digital Student ID)", "Student ID Card & QR Code 🪪")}
            maxWidth="520px"
        >
            <div style={{ padding: '0.5rem 0' }}>
                {/* Visual Digital ID Card Card Component */}
                <div 
                    style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                        border: '2px solid #cbd5e1',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        position: 'relative'
                    }}
                >
                    {/* Header Strip */}
                    <div 
                        style={{
                            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                            color: '#ffffff',
                            padding: '0.85rem 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <div style={{ background: '#6366f1', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                            <MdOutlineSchool size={26} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', letterSpacing: '0.02em' }}>
                                វិទ្យាល័យ ហ៊ុន សែន ចំការលើ
                            </h3>
                            <span style={{ fontSize: '0.72rem', color: '#c7d2fe', fontWeight: '700', letterSpacing: '0.04em' }}>
                                HUN SEN CHAMKAR LOE HIGH SCHOOL
                            </span>
                        </div>
                    </div>

                    {/* Card Content Body */}
                    <div style={{ padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Student Photo */}
                        {photoUrl ? (
                            <img 
                                src={photoUrl} 
                                alt={student.name}
                                style={{
                                    width: '90px',
                                    height: '110px',
                                    borderRadius: '10px',
                                    objectFit: 'cover',
                                    border: '3px solid #4f46e5',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}
                            />
                        ) : (
                            <div 
                                style={{
                                    width: '90px',
                                    height: '110px',
                                    borderRadius: '10px',
                                    background: '#e0e7ff',
                                    color: '#4f46e5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.5rem',
                                    fontWeight: 'bold',
                                    border: '3px solid #4f46e5'
                                }}
                            >
                                {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                        )}

                        {/* Student Main Details */}
                        <div style={{ flex: '1', minWidth: '160px' }}>
                            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: '800' }}>
                                {student.name || 'Student Name'}
                            </h2>
                            
                            <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <div>
                                    <strong style={{ color: '#1e293b' }}>{t("អត្តលេខ:", "ID Code:")}</strong>{' '}
                                    <span style={{ color: '#4f46e5', fontWeight: '700' }}>{studentCode}</span>
                                </div>
                                <div>
                                    <strong style={{ color: '#1e293b' }}>{t("ថ្នាក់រៀន:", "Class:")}</strong>{' '}
                                    {student.class_name || student.class || 'N/A'} ({student.grade_level ? `Grade ${student.grade_level}` : 'N/A'})
                                </div>
                                {student.gender && (
                                    <div>
                                        <strong style={{ color: '#1e293b' }}>{t("ភេទ:", "Gender:")}</strong> {student.gender}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '0.6rem' }}>
                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <FiCheckCircle /> VERIFIED STUDENT
                                </span>
                            </div>
                        </div>

                        {/* Generated QR Code */}
                        <div style={{ textAlign: 'center', background: '#ffffff', padding: '0.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <img 
                                src={qrCodeApiUrl} 
                                alt="Student Verification QR Code" 
                                style={{ width: '90px', height: '90px', display: 'block' }}
                            />
                            <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '600', display: 'block', marginTop: '0.25rem' }}>
                                Scan to Verify 📱
                            </span>
                        </div>
                    </div>

                    {/* Card Bottom Color Accent Strip */}
                    <div style={{ height: '6px', background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)' }}></div>
                </div>

                {/* Print & Verification Notice */}
                <div style={{ marginTop: '1.25rem', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#1e40af' }}>
                    💡 <strong>{t("របៀបប្រើប្រាស់ QR Code:", "How to use QR Code:")}</strong> {t("លោកគ្រូ/អ្នកគ្រូ ឬ អាណាព្យាបាល អាចយកកាមេរ៉ាទូរស័ព្ទមក Scan QR Code នេះ ដើម្បីផ្ទៀងផ្ទាត់ និង មើលព័ត៌មានលម្អិតផ្លូវការរបស់សិស្ស។", "Teachers, parents, or staff can scan this QR code with any phone camera to verify official student records.")}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <Button variant="secondary" onClick={onClose}>
                        {t("បិទ (Close)", "Close")}
                    </Button>
                    <Button variant="primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FiPrinter /> {t("បោះពុម្ពកាតសិស្ស (Print ID Card)", "Print ID Card")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default StudentIDCardModal;
