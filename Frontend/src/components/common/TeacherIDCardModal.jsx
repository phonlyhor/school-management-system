import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useLanguage } from '../../context/LanguageContext';
import { FiPrinter, FiCheckCircle } from 'react-icons/fi';
import { FaGraduationCap, FaUserTie } from 'react-icons/fa';

const getImageUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
    const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
    return `${baseUrl}/${photo.replace(/^\//, '')}`;
};

const TeacherIDCardModal = ({ isOpen, onClose, teacher }) => {
    const { t } = useLanguage();

    if (!teacher) return null;

    const teacherName = teacher.name || (teacher.first_name ? `${teacher.first_name} ${teacher.last_name || ''}` : 'Teacher');
    const civilId = teacher.civil_servant_id || teacher.code || `TCH-${teacher.id || '000'}`;
    const photoUrl = getImageUrl(teacher.photo);
    const position = teacher.position || 'គ្រូបង្រៀន (Teacher)';
    const framework = teacher.civil_service_framework || 'គ្រូបង្រៀនកម្រិតខ្ពស់';
    const major = teacher.specialization_1 || teacher.specialization || 'បង្រៀនទូទៅ';
    const phone = teacher.phone || 'N/A';

    // Verification URL generated for QR code scanning
    const origin = window.location.origin;
    const verifyUrl = `${origin}/teacher/verify/${encodeURIComponent(civilId)}`;
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(verifyUrl)}&margin=10`;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Teacher ID Card - ${teacherName}</title>
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
                        border: 1.5px solid #0284c7;
                        background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
                        display: flex;
                        flex-direction: column;
                        box-sizing: border-box;
                        position: relative;
                    }
                    .header {
                        background: linear-gradient(135deg, #0f172a 0%, #0369a1 100%);
                        color: #ffffff;
                        padding: 5px 8px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        border-bottom: 2px solid #f59e0b;
                    }
                    .school-title {
                        font-size: 8.5px;
                        font-weight: 800;
                        line-height: 1.1;
                        color: #ffffff;
                    }
                    .school-sub {
                        font-size: 5.5px;
                        color: #fbbf24;
                        font-weight: 700;
                        letter-spacing: 0.05em;
                    }
                    .body {
                        padding: 6px 8px;
                        display: flex;
                        gap: 8px;
                        align-items: center;
                        flex: 1;
                    }
                    .photo-box {
                        width: 50px;
                        height: 60px;
                        border-radius: 6px;
                        object-fit: cover;
                        border: 2px solid #0284c7;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .info {
                        flex: 1;
                    }
                    .teacher-name {
                        font-size: 10.5px;
                        font-weight: 800;
                        color: #0f172a;
                        margin: 0 0 2px 0;
                    }
                    .detail-item {
                        font-size: 7px;
                        color: #334155;
                        margin: 1.5px 0;
                        line-height: 1.2;
                    }
                    .badge-code {
                        background: #dbeafe;
                        color: #1e40af;
                        font-size: 6.5px;
                        font-weight: 800;
                        padding: 1px 5px;
                        border-radius: 4px;
                        display: inline-block;
                        margin-top: 2px;
                        border: 1px solid #bfdbfe;
                    }
                    .qr-container {
                        width: 44px;
                        height: 44px;
                        border: 1px solid #cbd5e1;
                        border-radius: 4px;
                        padding: 1px;
                        background: #ffffff;
                    }
                    .footer-strip {
                        height: 4px;
                        background: linear-gradient(90deg, #0284c7 0%, #f59e0b 50%, #16a34a 100%);
                    }
                </style>
            </head>
            <body>
                <div class="id-card">
                    <div class="header">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <img src="${origin}/school-logo.png" style="width:22px;height:22px;object-fit:contain;background:#fff;border-radius:50%;padding:1px;" />
                            <div>
                                <div class="school-title">វិទ្យាល័យ ហ៊ុន សែន ចំការលើ</div>
                                <div class="school-sub">TEACHER & OFFICIAL STAFF ID CARD</div>
                            </div>
                        </div>
                    </div>
                    <div class="body">
                        ${photoUrl ? `<img src="${photoUrl}" class="photo-box" />` : `<div class="photo-box" style="display:flex;align-items:center;justify-content:center;background:#e0f2fe;color:#0284c7;font-weight:bold;font-size:18px;">👨‍🏫</div>`}
                        <div class="info">
                            <div class="teacher-name">${teacherName}</div>
                            <div class="detail-item"><strong>អត្តលេខមន្ត្រី (ID):</strong> ${civilId}</div>
                            <div class="detail-item"><strong>តួនាទី (Role):</strong> ${position}</div>
                            <div class="detail-item"><strong>ឯកទេស (Major):</strong> ${major}</div>
                            <div class="detail-item"><strong>ទូរស័ព្ទ (Phone):</strong> ${phone}</div>
                            <div class="badge-code">OFFICIAL TEACHER</div>
                        </div>
                        <img src="${qrCodeApiUrl}" class="qr-container" title="Scan to verify teacher profile" />
                    </div>
                    <div class="footer-strip"></div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 400);
                    };
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
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <FaUserTie style={{ color: '#0284c7', fontSize: '1.2rem' }} />
                    <span>{t("ប័ណ្ណសម្គាល់ខ្លួនគ្រូបង្រៀន & QR Code", "Teacher Official ID Card & QR Code")}</span>
                </div>
            }
            maxWidth="540px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '0.5rem 0' }}>
                
                {/* Visual Preview Card (CR80 Plastic Card Simulation) */}
                <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '240px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '2px solid #0284c7',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
                        color: '#ffffff',
                        padding: '10px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        borderBottom: '3px solid #f59e0b'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: '#ffffff', padding: '2px', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
                                <img src="/school-logo.png" alt="School Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.02em', color: '#ffffff' }}>
                                    វិទ្យាល័យ ហ៊ុន សែន ចំការលើ
                                </div>
                                <div style={{ fontSize: '0.62rem', color: '#fbbf24', fontWeight: '700', letterSpacing: '0.05em', marginTop: '1px' }}>
                                    TEACHER & OFFICIAL STAFF ID CARD
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '12px 16px', display: 'flex', gap: '14px', alignItems: 'center', flex: 1 }}>
                        {photoUrl ? (
                            <img
                                src={photoUrl}
                                alt={teacherName}
                                style={{
                                    width: '75px',
                                    height: '92px',
                                    borderRadius: '10px',
                                    objectFit: 'cover',
                                    border: '2.5px solid #0284c7',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '75px',
                                height: '92px',
                                borderRadius: '10px',
                                background: '#e0f2fe',
                                border: '2.5px solid #0284c7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#0284c7',
                                fontSize: '2rem',
                                fontWeight: 'bold'
                            }}>
                                👨‍🏫
                            </div>
                        )}

                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                                {teacherName}
                            </h3>
                            <div style={{ fontSize: '0.75rem', color: '#334155', margin: '2px 0', fontWeight: '600' }}>
                                🆔 <span style={{ color: '#0284c7', fontWeight: '700' }}>{civilId}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#334155', margin: '2px 0' }}>
                                💼 <strong>{position}</strong>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', margin: '2px 0' }}>
                                📚 ឯកទេស ៖ {major}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', margin: '2px 0' }}>
                                📞 {phone}
                            </div>
                            <span style={{
                                background: '#dbeafe',
                                color: '#1e40af',
                                fontSize: '0.65rem',
                                fontWeight: '800',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                display: 'inline-block',
                                marginTop: '4px',
                                border: '1px solid #bfdbfe'
                            }}>
                                OFFICIAL TEACHER
                            </span>
                        </div>

                        {/* QR Code */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <img
                                src={qrCodeApiUrl}
                                alt="QR Code Verification"
                                style={{
                                    width: '65px',
                                    height: '65px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    padding: '2px',
                                    background: '#ffffff'
                                }}
                            />
                            <span style={{ fontSize: '0.6rem', color: '#1e293b', fontWeight: '800' }}>
                                SCAN QR
                            </span>
                        </div>
                    </div>

                    {/* Bottom Strip */}
                    <div style={{ height: '6px', background: 'linear-gradient(90deg, #0284c7 0%, #f59e0b 50%, #16a34a 100%)' }}></div>
                </div>

                {/* Verification URL Info box */}
                <div style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <FiCheckCircle style={{ color: '#16a34a', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {verifyUrl}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <Button variant="secondary" onClick={onClose}>
                        {t("បិទ", "Close")}
                    </Button>
                    <Button onClick={handlePrint} style={{ backgroundColor: '#0284c7', color: '#ffffff' }}>
                        <FiPrinter style={{ marginRight: '0.4rem' }} />
                        {t("បោះពុម្ពប័ណ្ណគ្រូ (Print Card)", "Print Teacher ID Card")}
                    </Button>
                </div>

            </div>
        </Modal>
    );
};

export default TeacherIDCardModal;
