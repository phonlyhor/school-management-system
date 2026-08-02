import Modal from '../common/Modal';
import Button from '../common/Button';

const StudentIdCardModal = ({ isOpen, onClose, student }) => {
    if (!student) return null;

    const getImageUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000';
        return `${baseUrl}/${photo.replace(/^\//, '')}`;
    };

    const handlePrint = () => {
        const printContent = document.getElementById('printable-student-id-card');
        const win = window.open('', '', 'width=800,height=600');
        win.document.write(`
            <html>
                <head>
                    <title>Student ID Card - ${student.user?.name}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f1f5f9; }
                        .card-box { width: 340px; height: 530px; background: linear-gradient(180deg, #1e1b4b 0%, #312e81 100%); color: white; border-radius: 16px; padding: 20px; box-sizing: border-box; text-align: center; position: relative; border: 3px solid #818cf8; }
                        .header-title { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #fbbf24; margin-bottom: 2px; }
                        .sub-title { font-size: 11px; opacity: 0.85; margin-bottom: 15px; }
                        .avatar-img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 4px solid #ffffff; margin: 0 auto 12px auto; }
                        .student-name { font-size: 18px; font-weight: bold; margin: 0 0 4px 0; color: #ffffff; }
                        .code-badge { background: #fbbf24; color: #1e1b4b; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 800; display: inline-block; margin-bottom: 15px; }
                        .info-grid { text-align: left; background: rgba(255,255,255,0.1); padding: 12px; border-radius: 10px; font-size: 12px; line-height: 1.6; }
                        .qr-box { margin-top: 15px; width: 60px; height: 60px; background: white; margin: 15px auto 0 auto; padding: 4px; border-radius: 8px; }
                    </style>
                </head>
                <body>
                    ${printContent.outerHTML}
                    <script>
                        window.onload = function() { window.print(); window.close(); };
                    </script>
                </body>
            </html>
        `);
        win.document.close();
    };

    const img = getImageUrl(student.photo || student.user?.photo);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Official Student ID Card (កាតសម្គាល់ខ្លួនសិស្ស) 🖨️"
            maxWidth="450px"
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    <Button onClick={handlePrint}>🖨️ Print Student ID Card</Button>
                </div>
            }
        >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
                <div 
                    id="printable-student-id-card"
                    style={{
                        width: '340px',
                        height: '520px',
                        background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
                        color: '#ffffff',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                        border: '3px solid #818cf8',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between'
                    }}
                >
                    {/* Header */}
                    <div>
                        <div style={{ fontSize: '1.5rem', marginBottom: '2px' }}>🏫</div>
                        <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24' }}>
                            សាលារៀនរដ្ឋ (PUBLIC STATE SCHOOL)
                        </h4>
                        <p style={{ margin: '2px 0 1rem 0', fontSize: '0.75rem', opacity: 0.85 }}>
                            STUDENT IDENTITY CARD / កាតសិស្ស
                        </p>
                    </div>

                    {/* Avatar */}
                    <div>
                        {img ? (
                            <img src={img} alt={student.user?.name} style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #ffffff', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', margin: '0 auto' }} />
                        ) : (
                            <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', margin: '0 auto', border: '4px solid #ffffff' }}>
                                {student.user?.name?.charAt(0) || 'S'}
                            </div>
                        )}

                        <h3 style={{ margin: '0.75rem 0 0.2rem 0', fontSize: '1.2rem', color: '#ffffff' }}>{student.user?.name}</h3>
                        <span style={{ background: '#fbbf24', color: '#1e1b4b', padding: '0.2rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '800', display: 'inline-block' }}>
                            {student.student_code}
                        </span>
                    </div>

                    {/* Details Box */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '0.85rem 1rem', borderRadius: '12px', textAlign: 'left', fontSize: '0.82rem', lineHeight: '1.6', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ opacity: 0.8 }}>Class / ថ្នាក់:</span>
                            <strong>{student.school_class?.name || 'Unassigned'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ opacity: 0.8 }}>Gender / ភេទ:</span>
                            <strong>{student.gender || 'N/A'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ opacity: 0.8 }}>DOB / ថ្ងៃកំណើត:</span>
                            <strong>{student.date_of_birth || 'N/A'}</strong>
                        </div>
                    </div>

                    {/* QR Code Verification Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                        <div style={{ textAlign: 'left', fontSize: '0.7rem', opacity: 0.75 }}>
                            Official Student Verification Card<br/>Valid Academic Year 2026-2027
                        </div>
                        <div style={{ background: 'white', padding: '3px', borderRadius: '6px', width: '42px', height: '42px' }}>
                            <svg viewBox="0 0 100 100" width="100%" height="100%">
                                <path d="M 0 0 h 40 v 40 h -40 z M 60 0 h 40 v 40 h -40 z M 0 60 h 40 v 40 h -40 z M 10 10 h 20 v 20 h -20 z M 70 10 h 20 v 20 h -20 z M 10 70 h 20 v 20 h -20 z M 60 60 h 20 v 20 h -20 z M 80 80 h 20 v 20 h -20 z" fill="#1e1b4b" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default StudentIdCardModal;
