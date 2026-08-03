import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useLanguage } from '../../context/LanguageContext';
import { FiPrinter, FiFileText } from 'react-icons/fi';

const StudyCertificateModal = ({ isOpen, onClose, student, academicYear = '2025-2026' }) => {
    const { t } = useLanguage();

    if (!student) return null;

    const studentName = student.name || student.user?.name || 'ឈ្មោះសិស្ស';
    const gender = student.gender || 'ប្រុស';
    const studentCode = student.student_code || student.code || 'N/A';
    const className = student.class_name || student.school_class?.name || student.schoolClass?.name || 'N/A';
    const dob = student.dob || student.date_of_birth || '០១-០១-២០០៨';
    const pob = student.pob || student.place_of_birth || 'ខេត្តកំពង់ចាម';
    const fatherName = student.father_name || 'មិនទាន់បញ្ចូល';
    const motherName = student.mother_name || 'មិនទាន់បញ្ចូល';
    const schoolName = 'វិទ្យាល័យ ហ៊ុន សែន ចំការលើ';

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Study Certificate - ${studentName}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Moul&family=Kantumruy+Pro:wght@400;600;700&display=swap');
                    @page {
                        size: A4 portrait;
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
                    .page-container {
                        width: 210mm;
                        height: 297mm;
                        box-sizing: border-box;
                        padding: 25mm 20mm;
                        background: #ffffff;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    .kh-moul {
                        font-family: 'Moul', cursive, serif;
                    }
                    .header-top {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 30px;
                    }
                    .header-left {
                        font-size: 11pt;
                        font-weight: bold;
                        color: #1e293b;
                        line-height: 1.6;
                    }
                    .header-right {
                        text-align: center;
                        color: #1e3a8a;
                    }
                    .kingdom-title {
                        font-size: 12pt;
                        margin-bottom: 4px;
                    }
                    .kingdom-sub {
                        font-size: 9pt;
                        font-style: italic;
                        color: #475569;
                    }
                    .doc-title {
                        text-align: center;
                        font-size: 20pt;
                        color: #0f172a;
                        margin: 20px 0 30px 0;
                        letter-spacing: 1px;
                    }
                    .content-body {
                        font-size: 13pt;
                        line-height: 2.2;
                        color: #1e293b;
                        text-align: justify;
                    }
                    .info-row {
                        margin-bottom: 8px;
                    }
                    .footer-section {
                        display: flex;
                        justify-content: flex-end;
                        margin-top: 40px;
                        font-size: 12pt;
                    }
                    .signature-box {
                        width: 250px;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="page-container">
                    <div>
                        <div class="header-top">
                            <div class="header-left">
                                <div>ក្រសួងអប់រំ យុវជន និងកីឡា</div>
                                <div>មន្ទីរអប់រំ យុវជន និងកីឡា ខេត្តកំពង់ចាម</div>
                                <div class="kh-moul" style="color: #1e3a8a; margin-top: 4px;">${schoolName}</div>
                            </div>
                            <div class="header-right">
                                <div class="kh-moul kingdom-title">ព្រះរាជាណាចក្រកម្ពុជា</div>
                                <div class="kh-moul kingdom-title">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                                <div class="kingdom-sub">KINGDOM OF CAMBODIA • NATION RELIGION KING</div>
                            </div>
                        </div>

                        <div class="kh-moul doc-title">លិខិតបញ្ជាក់ការសិក្សា</div>

                        <div class="content-body">
                            <div style="text-indent: 40px;">
                                <strong>នាយកវិទ្យាល័យ ហ៊ុន សែន ចំការលើ</strong> សូមបញ្ជាក់ថា ៖
                            </div>

                            <div class="info-row">
                                • សិស្សឈ្មោះ ៖ <strong class="kh-moul" style="font-size: 14pt; color: #0f172a;">${studentName}</strong> 
                                &nbsp;&nbsp;&nbsp;&nbsp; ភេទ ៖ <strong>${gender}</strong> 
                                &nbsp;&nbsp;&nbsp;&nbsp; អត្តលេខ ៖ <strong>${studentCode}</strong>
                            </div>

                            <div class="info-row">
                                • ថ្ងៃ ខែ ឆ្នាំកំណើត ៖ <strong>${dob}</strong>
                            </div>

                            <div class="info-row">
                                • ទីកន្លែងកំណើត ៖ <strong>${pob}</strong>
                            </div>

                            <div class="info-row">
                                • ឈ្មោះឪពុក ៖ <strong>${fatherName}</strong> 
                                &nbsp;&nbsp;&nbsp;&nbsp; ឈ្មោះម្តាយ ៖ <strong>${motherName}</strong>
                            </div>

                            <div style="text-indent: 40px; margin-top: 15px;">
                                ពិតជាបាន និង កំពុងសិក្សានៅ <strong>${schoolName}</strong> ប្រាកដមែន ក្នុងថ្នាក់ទី <strong>${className}</strong> សម្រាប់ឆ្នាំសិក្សា <strong>${academicYear}</strong>។
                            </div>

                            <div style="text-indent: 40px; margin-top: 15px;">
                                លិខិតបញ្ជាក់នេះ ចេញជូនសិស្សសាមី ដើម្បីយកទៅ <strong>ប្រើប្រាស់តាមតម្រូវការផ្លូវការ</strong>។
                            </div>
                        </div>
                    </div>

                    <div class="footer-section">
                        <div class="signature-box">
                            <div>ថ្ងៃទី........ខែ........ឆ្នាំ២០...</div>
                            <div class="kh-moul" style="margin-top: 6px; color: #1e3a8a;">នាយកសាលា</div>
                            <div style="height: 90px;"></div>
                            <div style="font-style: italic; font-size: 10pt; color: #64748b;">(ហត្ថលេខា និង ត្រា)</div>
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
            title={t("📄 លិខិតបញ្ជាក់ការសិក្សាផ្លូវការ (Official Study Certificate)", "Official Study Certificate 📄")}
            maxWidth="700px"
        >
            <div style={{ padding: '0.5rem 0' }}>
                {/* Document Preview Box */}
                <div 
                    style={{
                        background: '#ffffff',
                        border: '2px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '1.75rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        color: '#1e293b'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                            <div>ក្រសួងអប់រំ យុវជន និងកីឡា</div>
                            <div className="kh-moul" style={{ color: '#1e3a8a', marginTop: '3px' }}>{schoolName}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h4 className="kh-moul" style={{ color: '#1e3a8a', fontSize: '0.9rem', margin: 0 }}>
                                ព្រះរាជាណាចក្រកម្ពុជា ជាតិ សាសនា ព្រះមហាក្សត្រ
                            </h4>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>
                                KINGDOM OF CAMBODIA • NATION RELIGION KING
                            </span>
                        </div>
                    </div>

                    <h2 className="kh-moul" style={{ textAlign: 'center', color: '#0f172a', fontSize: '1.4rem', margin: '1rem 0 1.5rem 0' }}>
                        លិខិតបញ្ជាក់ការសិក្សា
                    </h2>

                    <div style={{ fontSize: '0.92rem', lineHeight: '2', color: '#334155' }}>
                        <p style={{ textIndent: '20px' }}><strong>នាយកវិទ្យាល័យ ហ៊ុន សែន ចំការលើ</strong> សូមបញ្ជាក់ថា ៖</p>
                        <ul style={{ listStyle: 'none', paddingLeft: '10px' }}>
                            <li>• សិស្សឈ្មោះ ៖ <strong className="kh-moul" style={{ color: '#0f172a' }}>{studentName}</strong> | ភេទ ៖ <strong>{gender}</strong> | អត្តលេខ ៖ <strong style={{ color: '#4f46e5' }}>{studentCode}</strong></li>
                            <li>• ថ្ងៃ ខែ ឆ្នាំកំណើត ៖ <strong>{dob}</strong></li>
                            <li>• ទីកន្លែងកំណើត ៖ <strong>{pob}</strong></li>
                            <li>• ឈ្មោះឪពុក ៖ <strong>{fatherName}</strong> | ឈ្មោះម្តាយ ៖ <strong>{motherName}</strong></li>
                        </ul>
                        <p style={{ textIndent: '20px', marginTop: '0.75rem' }}>
                            ពិតជាបាន និង កំពុងសិក្សានៅ <strong>{schoolName}</strong> ប្រាកដមែន ក្នុងថ្នាក់ទី <strong>{className}</strong> សម្រាប់ឆ្នាំសិក្សា <strong>{academicYear}</strong>។
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem' }}>
                        <div>
                            <div>ថ្ងៃទី........ខែ........ឆ្នាំ២០...</div>
                            <strong className="kh-moul" style={{ color: '#1e3a8a', display: 'block', marginTop: '4px' }}>នាយកសាលា</strong>
                            <div style={{ height: '50px' }}></div>
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(ហត្ថលេខា និង ត្រា)</span>
                        </div>
                    </div>
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <Button variant="secondary" onClick={onClose}>
                        {t("បិទ (Close)", "Close")}
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handlePrint}
                        style={{ backgroundColor: '#0f172a', borderColor: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                        <FiPrinter /> {t("បោះពុម្ពលិខិតបញ្ជាក់ (Print A4)", "Print Study Certificate (A4)")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default StudyCertificateModal;
