// Simple Clean Login page for វិទ្យាល័យ ហ៊ុន សែន ចំការលើ
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { getRole } from "../../utils/storage";
import { MdOutlineSchool } from "react-icons/md";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";

const styles = `
* {
  box-sizing: border-box;
}

.login-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
  padding: 1.5rem 1rem;
  font-family: 'Inter', sans-serif;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background-color: #ffffff;
  border-radius: 16px;
  padding: 2.25rem 1.75rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.login-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.85rem auto;
  box-shadow: 0 8px 16px rgba(79, 70, 229, 0.25);
}

.login-title {
  margin: 0 0 0.3rem 0;
  font-size: 1.4rem;
  color: #0f172a;
  font-weight: 800;
  line-height: 1.25;
}

.login-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-group {
  width: 100%;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.35rem;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 0.7rem 0.8rem 0.7rem 2.4rem;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background-color: #ffffff;
  color: #0f172a;
}

.form-input.has-toggle {
  padding-right: 2.4rem;
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-input:hover {
  border-color: #94a3b8;
}

.form-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
  align-items: center;
  padding: 0;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: #475569;
}

.submit-btn {
  margin-top: 0.4rem;
  padding: 0.85rem;
  border-radius: 8px;
  border: none;
  background-color: #4f46e5;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  background-color: #4338ca;
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.demo-section {
  margin-top: 1.75rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 1.1rem;
  text-align: center;
}

.demo-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  display: block;
  margin-bottom: 0.6rem;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.demo-btn {
  padding: 0.45rem 0.4rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-size: 0.78rem;
  cursor: pointer;
  font-weight: 600;
  color: #334155;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.1s ease;
}

.demo-btn:hover {
  background-color: #eef2ff;
  border-color: #a5b4fc;
  color: #4338ca;
}

.demo-btn:active {
  transform: translateY(1px);
}

.login-footer {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

@media (max-width: 420px) {
  .login-card {
    padding: 1.75rem 1.25rem;
    border-radius: 12px;
  }
  .login-title {
    font-size: 1.2rem;
  }
  .demo-grid {
    grid-template-columns: 1fr;
  }
}
`;

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please enter email and password!");
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await loginUser({ email, password });
            const user = response.data.user || response.data.data?.user;
            const token = response.data.token || response.data.access_token || response.data.data?.token;

            if (!user || !token) {
                toast.error("Login failed: invalid response!");
                return;
            }

            const rawRole = user?.role || user?.type || getRole() || 'admin';
            const userRole = String(rawRole).toLowerCase();

            login(user, token, userRole);
            toast.success(`Welcome to វិទ្យាល័យ ហ៊ុន សែន ចំការលើ!`);

            if (userRole === 'admin') navigate("/admin/dashboard");
            else if (userRole === 'teacher') navigate("/teacher/dashboard");
            else if (userRole === 'student') navigate("/student/dashboard");
            else if (userRole === 'parent') navigate("/parent/dashboard");
            else navigate("/student/dashboard");

        } catch (error) {
            console.error("Login Error:", error);
            toast.error("Login Failed: " + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <style>{styles}</style>
            <div className="login-card">
                {/* Header */}
                <div className="login-header">
                    <div className="login-icon">
                        <MdOutlineSchool size={36} />
                    </div>

                    <h1 className="login-title">
                        វិទ្យាល័យ ហ៊ុន សែន ចំការលើ
                    </h1>
                    <p className="login-subtitle">
                        School Management System
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form">

                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label">
                            Email Address / អ៊ីមែល *
                        </label>
                        <div className="input-wrapper">
                            <FiMail className="input-icon" size={16} />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label className="form-label">
                            Password / ពាក្យសម្ងាត់ *
                        </label>
                        <div className="input-wrapper">
                            <FiLock className="input-icon" size={16} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="form-input has-toggle"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle"
                            >
                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="submit-btn"
                    >
                        {isSubmitting ? 'Logging in...' : 'Login (ចូលប្រព័ន្ធ)'}
                    </button>
                </form>



                {/* Footer */}
                <div className="login-footer">
                    © {new Date().getFullYear()} វិទ្យាល័យ ហ៊ុន សែន ចំការលើ. All rights reserved.
                </div>
            </div>
        </div>
    );
}

export default Login;