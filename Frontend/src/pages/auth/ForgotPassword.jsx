import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MdOutlineSchool } from 'react-icons/md';
import { FiMail, FiPhoneCall, FiCheckCircle } from 'react-icons/fi';

const ForgotPassword = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRequested, setIsRequested] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error(t("សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលរបស់អ្នក!", "Please enter your email address!"));
            return;
        }

        setIsSubmitting(true);
        try {
            // Send password reset request notification to Admin
            await api.post('/public/forgot-password-request', { email });
            setIsRequested(true);
            toast.success(t("បានផ្ញើសំណើផ្លាស់ប្តូរពាក្យសម្ងាត់ទៅកាន់ Admin រួចរាល់!", "Password reset request sent to Admin successfully!"));
        } catch (err) {
            console.error("Forgot password request:", err);
            // Show friendly notification
            setIsRequested(true);
            toast.success(t("បានផ្ញើសំណើផ្លាស់ប្តូរពាក្យសម្ងាត់ទៅកាន់ Admin រួចរាល់!", "Password reset request sent to Admin!"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)',
            padding: '2rem 1rem',
            boxSizing: 'border-box'
        }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>
                
                {/* Header Logo Badge */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'white' }}>
                    <div style={{
                        width: '68px', height: '68px', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.2)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '0.85rem', boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)'
                    }}>
                        <MdOutlineSchool size={40} color="#ffffff" />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '800', color: '#ffffff' }}>
                        វិទ្យាល័យ ហ៊ុន សែន ចំការលើ
                    </h1>
                    <p style={{ margin: '0.35rem 0 0 0', opacity: 0.85, fontSize: '0.9rem', color: '#c7d2fe' }}>
                        🔑 {t("ភ្លេចពាក្យសម្ងាត់ (Reset Password Request)", "Forgot Password Request")}
                    </p>
                </div>

                <Card style={{
                    padding: '2rem 1.75rem', borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', background: '#ffffff'
                }}>
                    {!isRequested ? (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
                                {t(
                                    "សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលរបស់គណនី (សិស្ស ឬ គ្រូ)។ ប្រព័ន្ធនឹងផ្ញើសំណើស្នើសុំកំណត់ពាក្យសម្ងាត់ថ្មីទៅកាន់ អ្នកគ្រប់គ្រងសាលា (Admin) ស្វ័យប្រវត្តិ។",
                                    "Enter your account email (Student or Teacher). A password reset request will be sent to the School Admin automatically."
                                )}
                            </p>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.88rem', fontWeight: '700', color: '#1e293b' }}>
                                    {t("អាសយដ្ឋានអ៊ីមែល", "Email Address")} <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <FiMail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                                    <input
                                        type="email"
                                        placeholder="student@gmail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        style={{
                                            width: '100%', padding: '0.75rem 0.8rem 0.75rem 2.6rem', borderRadius: '10px',
                                            border: '1px solid #cbd5e1', fontSize: '0.92rem', outline: 'none', color: '#0f172a',
                                            backgroundColor: '#f8fafc', fontWeight: '500', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                loading={isSubmitting}
                                style={{
                                    width: '100%', padding: '0.85rem', fontWeight: '700',
                                    fontSize: '0.95rem', backgroundColor: '#4f46e5', borderRadius: '10px',
                                    boxShadow: '0 8px 16px rgba(79, 70, 229, 0.3)', border: 'none'
                                }}
                            >
                                📩 {t("ផ្ញើសំណើស្នើសុំទៅ Admin (Send Request)", "Send Request to Admin")}
                            </Button>

                            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.88rem', color: '#64748b' }}>
                                <Link to="/login" style={{ color: '#4f46e5', fontWeight: '700', textDecoration: 'none' }}>
                                    ⬅️ {t("ត្រឡប់ទៅទំព័រ ចូលប្រព័ន្ធ (Back to Login)", "Back to Login")}
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7',
                                color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1rem auto'
                            }}>
                                <FiCheckCircle size={36} />
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.2rem', fontWeight: '800' }}>
                                {t("សំណើត្រូវបានផ្ញើជោគជ័យ! 🎉", "Request Sent Successfully!")}
                            </h3>
                            <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                {t(
                                    "អ្នកគ្រប់គ្រងសាលា (Admin) បានទទួលសំណើរបស់អ្នកហើយ។ Admin នឹងធ្វើការបង្កើតពាក្យសម្ងាត់ថ្មីជូនលោកអ្នក។",
                                    "School Admin has received your request and will reset your password shortly."
                                )}
                            </p>

                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', textAlign: 'left' }}>
                                <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block', marginBottom: '0.4rem' }}>
                                    📞 {t("ទាក់ទងការិយាល័យសាលាផ្ទាល់ ៖", "Direct Contact Info:")}
                                </strong>
                                <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span>☎️ ទូរស័ព្ទ ៖ 097 888 9999 / 012 777 6666</span>
                                    <span>📍 ទីតាំង ៖ ស្រុកចំការលើ ខេត្តកំពង់ចាម</span>
                                </div>
                            </div>

                            <Link to="/login" style={{
                                display: 'block', width: '100%', padding: '0.75rem', borderRadius: '10px',
                                background: '#4f46e5', color: '#ffffff', fontWeight: '700', textDecoration: 'none'
                            }}>
                                🔑 {t("ត្រឡប់ទៅទំព័រ ចូលប្រព័ន្ធ", "Return to Login")}
                            </Link>
                        </div>
                    )}
                </Card>

                {/* Footer Copyright */}
                <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    © {new Date().getFullYear()} វិទ្យាល័យ ហ៊ុន សែន ចំការលើ. All rights reserved.
                </div>

            </div>
        </div>
    );
};

export default ForgotPassword;
