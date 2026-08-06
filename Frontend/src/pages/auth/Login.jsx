import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { getRole } from "../../utils/storage";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { MdOutlineSchool } from "react-icons/md";
import { FiMail, FiLock, FiEye, FiEyeOff, FiUserCheck } from "react-icons/fi";
import toast from "react-hot-toast";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { t } = useLanguage();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e, customEmail = null, customPass = null) => {
        if (e) e.preventDefault();
        const loginEmail = customEmail || email;
        const loginPass = customPass || password;

        if (!loginEmail || !loginPass) {
            toast.error(t("សូមបញ្ចូលអ៊ីមែល និង ពាក្យសម្ងាត់!", "Please enter email and password!"));
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await loginUser({ email: loginEmail, password: loginPass });
            const user = response.data.user || response.data.data?.user;
            const token = response.data.token || response.data.access_token || response.data.data?.token;

            if (!user || !token) {
                toast.error(t("ការចូលប្រព័ន្ធបរាជ័យ!", "Login failed: invalid response!"));
                return;
            }

            const rawRole = user?.role || user?.type || getRole() || 'admin';
            const userRole = String(rawRole).toLowerCase();

            login(user, token, userRole);
            toast.success(t("សូមស្វាគមន៍មកកាន់ វិទ្យាល័យ ហ៊ុន សែន ចំការលើ! 🎉", "Welcome to Hun Sen Chamkar Loe High School! 🎉"));

            if (userRole === 'admin') navigate("/admin/dashboard");
            else if (userRole === 'teacher') navigate("/teacher/dashboard");
            else if (userRole === 'student') navigate("/student/dashboard");
            else if (userRole === 'parent') navigate("/parent/dashboard");
            else navigate("/student/dashboard");

        } catch (error) {
            console.error("Login Error:", error);
            toast.error(t("ការចូលប្រព័ន្ធបរាជ័យ ៖ ", "Login Failed: ") + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickLogin = (quickEmail, quickPass) => {
        setEmail(quickEmail);
        setPassword(quickPass);
        handleSubmit(null, quickEmail, quickPass);
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 100%)',
            padding: '1.5rem 1rem',
            boxSizing: 'border-box'
        }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>
                
                {/* School Header Badge */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'white' }}>
                    <div style={{
                        width: '78px', height: '78px', borderRadius: '50%', background: '#ffffff',
                        padding: '4px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '0.85rem', boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)'
                    }}>
                        <img src="/school-logo.png" alt="School Logo" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: '800', letterSpacing: '0.02em', color: '#ffffff' }}>
                        វិទ្យាល័យ ហ៊ុន សែន ចំការលើ
                    </h1>
                    <p style={{ margin: '0.35rem 0 0 0', opacity: 0.85, fontSize: '0.9rem', color: '#c7d2fe', fontWeight: '500' }}>
                        {t("🔑 ប្រព័ន្ធគ្រប់គ្រងសាលារៀន (School Management)", "School Management System")}
                    </p>
                </div>

                {/* Login Form Card */}
                <Card style={{
                    padding: '2rem 1.75rem',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                    background: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.8)'
                }}>
                    {/* Important Reminder Note Box */}
                    <div style={{
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '12px',
                        padding: '0.8rem 1rem',
                        marginBottom: '1.2rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.7rem',
                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.06)'
                    }}>
                        <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>📌</span>
                        <div style={{ fontSize: '0.84rem', color: '#1e40af', lineHeight: '1.45', fontWeight: '500' }}>
                            <strong style={{ color: '#1d4ed8', fontWeight: '700' }}>
                                {t("ចំណាំ ៖", "Note:")}
                            </strong>{' '}
                            {t(
                                "សូមប្រើប្រាស់អាសយដ្ឋានអ៊ីមែល (Email) និង ពាក្យសម្ងាត់ (Password) របស់ខ្លួនឯងដែលបានចុះឈ្មោះដើម្បីចូលប្រព័ន្ធ!",
                                "Please use your registered Email address and Password to log into the system!"
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        
                        {/* Email Input */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.88rem', fontWeight: '700', color: '#1e293b' }}>
                                {t("អាសយដ្ឋានអ៊ីមែល", "Email Address")} <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <FiMail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                                <input
                                    type="email"
                                    placeholder="e.g. admin@school.com"
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

                        {/* Password Input */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                <label style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                                    {t("ពាក្យសម្ងាត់", "Password")} <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: '600', textDecoration: 'none' }}>
                                    🔑 {t("ភ្លេចពាក្យសម្ងាត់?", "Forgot Password?")}
                                </Link>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{
                                        width: '100%', padding: '0.75rem 2.6rem 0.75rem 2.6rem', borderRadius: '10px',
                                        border: '1px solid #cbd5e1', fontSize: '0.92rem', outline: 'none', color: '#0f172a',
                                        backgroundColor: '#f8fafc', fontWeight: '500', boxSizing: 'border-box'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                        border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 0
                                    }}
                                >
                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                            loading={isSubmitting}
                            style={{
                                width: '100%', marginTop: '0.2rem', padding: '0.85rem', fontWeight: '700',
                                fontSize: '0.98rem', backgroundColor: isSubmitting ? '#6366f1' : '#4f46e5', borderRadius: '10px',
                                boxShadow: '0 8px 16px rgba(79, 70, 229, 0.3)', border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                opacity: isSubmitting ? 0.85 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isSubmitting ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
                                    <span style={{
                                        width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.35)',
                                        borderTopColor: '#ffffff', borderRadius: '50%', display: 'inline-block',
                                        animation: 'spin 0.75s linear infinite'
                                    }} />
                                    <span>{t("កំពុងចូលប្រើប្រាស់...", "Logging in...")}</span>
                                </span>
                            ) : (
                                <span>🚀 {t("ចូលប្រព័ន្ធ (Login)", "Login")}</span>
                            )}
                        </Button>

                        {/* Register Link */}
                        <div style={{ textAlign: 'center', marginTop: '0.6rem', fontSize: '0.88rem', color: '#64748b' }}>
                            {t("មិនទាន់មានគណនី?", "Don't have an account?")}{' '}
                            <Link to="/register/student" style={{ color: '#4f46e5', fontWeight: '700', textDecoration: 'none' }}>
                                📝 {t("ចុះឈ្មោះសិស្សថ្មី", "Register Student")}
                            </Link>
                        </div>
                    </form>
                </Card>

                {/* Footer Copyright */}
                <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    © {new Date().getFullYear()} វិទ្យាល័យ ហ៊ុន សែន ចំការលើ. All rights reserved.
                </div>

            </div>
        </div>
    );
}

export default Login;