import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useLanguage } from '../../context/LanguageContext';
import { FiPrinter, FiAward } from 'react-icons/fi';

const MeritCertificateModal = ({ isOpen, onClose, student, academicYear = '2025-2026', semester = 'ឆ្នាំសិក្សាពេញ' }) => {
    const { t } = useLanguage();

    if (!student) return null;

    const studentName = student.name || student.user?.name || 'ឈ្មោះសិស្ស';
    const className = student.class_name || student.school_class?.name || student.schoolClass?.name || 'N/A';
    const rank = student.rank || student.class_position || '១';
    const schoolName = 'វិទ្យាល័យ ហ៊ុន សែន ចំការលើ';

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Merit Certificate - ${studentName}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Moul&family=Kantumruy+Pro:wght@400;600;700&display=swap');
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: #ffffff;
                        font-family: 'Kantumruy Pro', sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
                    .certificate-container {
                        width: 297mm;
                        height: 210mm;
                        box-sizing: border-box;
                        padding: 20mm;
                        background: #ffffff;
                        position: relative;
                    }
                    .outer-border {
                        border: 6px double #b45309;
                        padding: 12px;
                        height: 100%;
                        box-sizing: border-box;
                        border-radius: 12px;
                        background: radial-gradient(circle at center, #ffffff 0%, #fffbeb 100%);
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        text-align: center;
                        position: relative;
                    }
                    .inner-border {
                        border: 2px solid #d97706;
                        padding: 20px 40px;
                        height: 100%;
                        box-sizing: border-box;
                        border-radius: 8px;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    .kh-moul {
                        font-family: 'Moul', cursive, serif;
                    }
                    .header-kingdom {
                        font-size: 16pt;
                        color: #1e3a8a;
                        margin-bottom: 4px;
                    }
                    .header-sub {
                        font-size: 10pt;
                        color: #475569;
                        margin-bottom: 20px;
                    }
                    .cert-title {
                        font-size: 26pt;
                        color: #b45309;
                        margin: 10px 0;
                        letter-spacing: 2px;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                    }
                    .cert-subtitle {
                        font-size: 14pt;
                        color: #334155;
                        margin-bottom: 25px;
                    }
                    .student-name-box {
                        font-size: 24pt;
                        color: #0f172a;
                        font-weight: bold;
                        border-bottom: 2px dashed #b45309;
                        display: inline-block;
                        padding: 0 30px 5px 30px;
                        margin: 10px 0 20px 0;
                    }
                    .body-text {
                        font-size: 14pt;
                        line-height: 1.8;
                        color: #1e293b;
                    }
                    .highlight-rank {
                        font-size: 18pt;
                        color: #b45309;
                        font-weight: bold;
                    }
                    .footer-signatures {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 30px;
                        font-size: 12pt;
                    }
                    .signature-box {
                        width: 220px;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <div class="outer-border">
                        <div class="inner-border">
                            <div>
                                <div class="kh-moul header-kingdom">ព្រះរាជាណាចក្រកម្ពុជា ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                                <div class="header-sub">KINGDOM OF CAMBODIA • NATION RELIGION KING</div>
                                <div style="font-size: 12pt; color: #475569; font-weight: bold;">${schoolName}</div>
                            </div>

                            <div>
                                <div class="kh-moul cert-title">ប័ណ្ណសរសើរ</div>
                                <div class="cert-subtitle">CERTIFICATE OF MERIT</div>
                                <div class="body-text">ផ្តល់ជូនចំពោះសិស្សឈ្មោះ</div>
                                <div class="kh-moul student-name-box">${studentName}</div>
                                <div class="body-text">
                                    សិស្សថ្នាក់ទី ៖ <strong>${className}</strong> | ទទួលបានចំណាត់ថ្នាក់ ៖ <span class="highlight-rank">លេខ ${rank}</span>
                                    <br />
                                    ក្នុងការខិតខំប្រឹងប្រែងសិក្សារៀនសូត្រ សម្រាប់ <strong>${semester}</strong> ឆ្នាំសិក្សា <strong>${academicYear}</strong>
                                </div>
                            </div>

                            <div class="footer-signatures">
                                <div class="signature-box">
                                    <div>បានឃើញ និង ឯកភាព</div>
                                    <div class="kh-moul" style="margin-top: 5px; color: #1e3a8a;">នាយកសាលា</div>
                                    <div style="height: 60px;"></div>
                                    <div style="font-style: italic; font-size: 10pt; color: #64748b;">(ហត្ថលេខា និង ត្រា)</div>
                                </div>

                                <div class="signature-box">
                                    <div>ថ្ងៃទី........ខែ........ឆ្នាំ២០...</div>
                                    <div class="kh-moul" style="margin-top: 5px; color: #1e3a8a;">គ្រូបន្ទុកថ្នាក់</div>
                                    <div style="height: 60px;"></div>
                                    <div style="font-style: italic; font-size: 10pt; color: #64748b;">(ហត្ថលេខា)</div>
                                </div>
                            </div>
                        </div>
                    </div>
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
            title={t("🎖️ ប័ណ្ណសរសើរផ្លូវការ (Official Merit Certificate)", "Official Merit Certificate 🎖️")}
            maxWidth="750px"
        >
            <div style={{ padding: '0.5rem 0' }}>
                {/* Certificate Preview Card */}
                <div 
                    style={{
                        background: 'radial-gradient(circle at center, #ffffff 0%, #fffbeb 100%)',
                        border: '4px double #b45309',
                        borderRadius: '16px',
                        padding: '1.75rem',
                        boxShadow: '0 10px 25px -5px rgba(180, 83, 9, 0.15)',
                        textAlign: 'center',
                        color: '#1e293b'
                    }}
                >
                    <h3 className="kh-moul" style={{ color: '#1e3a8a', fontSize: '1rem', margin: '0 0 0.25rem 0' }}>
                        ព្រះរាជាណាចក្រកម្ពុជា ជាតិ សាសនា ព្រះមហាក្សត្រ
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', display: 'block', marginBottom: '1rem' }}>
                        KINGDOM OF CAMBODIA • NATION RELIGION KING
                    </span>

                    <h1 className="kh-moul" style={{ color: '#b45309', fontSize: '1.8rem', margin: '0.75rem 0 0.25rem 0' }}>
                        ប័ណ្ណសរសើរ
                    </h1>
                    <span style={{ fontSize: '0.85rem', color: '#78350f', fontWeight: '700', letterSpacing: '1px', display: 'block', marginBottom: '1.25rem' }}>
                        CERTIFICATE OF MERIT
                    </span>

                    <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>ផ្តល់ជូនចំពោះសិស្សឈ្មោះ</p>
                    <h2 className="kh-moul" style={{ color: '#0f172a', fontSize: '1.5rem', margin: '0.25rem 0 1rem 0', borderBottom: '2px dashed #b45309', display: 'inline-block', paddingBottom: '0.25rem' }}>
                        {studentName}
                    </h2>

                    <p style={{ fontSize: '1rem', lineHeight: '1.8', color: '#334155' }}>
                        សិស្សថ្នាក់ទី ៖ <strong>{className}</strong> | ទទួលបានចំណាត់ថ្នាក់ ៖ <strong style={{ color: '#b45309', fontSize: '1.15rem' }}>លេខ {rank}</strong>
                        <br />
                        ក្នុងការខិតខំប្រឹងប្រែងសិក្សារៀនសូត្រ សម្រាប់ <strong>{semester}</strong> ឆ្នាំសិក្សា <strong>{academicYear}</strong>
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', fontSize: '0.85rem' }}>
                        <div>
                            <strong>បានឃើញ និង ឯកភាព</strong>
                            <p style={{ color: '#1e3a8a', fontWeight: '700', margin: '0.2rem 0 2.5rem 0' }}>នាយកសាលា</p>
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(ហត្ថលេខា និង ត្រា)</span>
                        </div>
                        <div>
                            <strong>ថ្ងៃទី........ខែ........ឆ្នាំ២០...</strong>
                            <p style={{ color: '#1e3a8a', fontWeight: '700', margin: '0.2rem 0 2.5rem 0' }}>គ្រូបន្ទុកថ្នាក់</p>
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(ហត្ថលេខា)</span>
                        </div>
                    </div>
                </div>

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <Button variant="secondary" onClick={onClose}>
                        {t("បិទ (Close)", "Close")}
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handlePrint}
                        style={{ backgroundColor: '#b45309', borderColor: '#b45309', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                        <FiPrinter /> {t("បោះពុម្ពប័ណ្ណសរសើរ (Print A4)", "Print Merit Certificate (A4 Landscape)")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default MeritCertificateModal;
