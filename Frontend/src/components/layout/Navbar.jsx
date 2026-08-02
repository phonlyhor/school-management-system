import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { FiSearch, FiBell, FiUser, FiCheckCircle, FiGlobe, FiTrash2, FiEye } from 'react-icons/fi';
import { getNotifications, markAllNotificationsAsRead, deleteNotification, clearAllNotifications } from '../../services/notificationService';
import styles from './Navbar.module.css';

const Navbar = () => {
    const { user, role } = useAuth();
    const { lang, setLang, t } = useLanguage();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

    const dropdownRef = useRef(null);
    const langRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll for new notifications every 10 seconds
            const interval = setInterval(fetchNotifications, 10000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
            if (langRef.current && !langRef.current.contains(event.target)) {
                setIsLangMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await getNotifications();
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unread_count || 0);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        }
    };

    // Auto mark as read when opening notification dropdown
    const handleToggleDropdown = async () => {
        const nextState = !isOpen;
        setIsOpen(nextState);

        if (nextState && unreadCount > 0) {
            try {
                await markAllNotificationsAsRead();
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            } catch (err) {
                console.error('Failed to mark all as read:', err);
            }
        }
    };

    const handleNotificationClick = (e, notif) => {
        e.stopPropagation();
        setIsOpen(false);
        const type = notif.type || '';
        const title = notif.title || '';

        if (type === 'student_registration' || title.includes('សិស្ស')) {
            navigate('/admin/students');
        } else if (type === 'password_reset' || title.includes('ពាក្យសម្ងាត់')) {
            navigate('/admin/users');
        } else if (type === 'leave_request' || title.includes('ច្បាប់')) {
            if (role === 'admin') navigate('/admin/leave-requests');
            else if (role === 'teacher') navigate('/teacher/leave-requests');
            else navigate('/student/leave-requests');
        } else if (type === 'system' || title.includes('ដំឡើងថ្នាក់')) {
            navigate('/admin/promotion');
        } else if (type === 'homeroom_assignment' || type === 'teacher_assignment') {
            navigate('/admin/teacher-assignments');
        } else if (type === 'schedule_assignment') {
            navigate(role === 'admin' ? '/admin/schedule' : '/teacher/schedule');
        } else {
            if (role === 'admin') navigate('/admin/dashboard');
            else if (role === 'teacher') navigate('/teacher/dashboard');
            else navigate('/student/dashboard');
        }
    };

    const handleDeleteSingle = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    const handleClearAll = async (e) => {
        e.stopPropagation();
        try {
            await clearAllNotifications();
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to clear all notifications:', err);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <header className={styles.navbar}>
            {/* Left Search Bar */}
            <div className={styles.searchSection}>
                <div className={styles.searchWrapper}>
                    <FiSearch className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder={t("ស្វែងរកអ្វីមួយ...", "Search anything...")} 
                        className={styles.searchInput} 
                    />
                </div>
            </div>

            {/* Right Control Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                
                {/* Language Selector Dropdown */}
                <div style={{ position: 'relative' }} ref={langRef}>
                    <button 
                        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.45rem 0.75rem',
                            borderRadius: '20px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            color: '#334155',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <FiGlobe size={16} color="#4f46e5" />
                        <span>{lang === 'kh' ? '🇰🇭 ខ្មែរ' : '🇬🇧 English'}</span>
                    </button>

                    {isLangMenuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '42px',
                            right: '0',
                            width: '150px',
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e2e8f0',
                            zIndex: 1000,
                            padding: '0.4rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem'
                        }}>
                            <button
                                onClick={() => { setLang('kh'); setIsLangMenuOpen(false); }}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: lang === 'kh' ? '#e0e7ff' : 'transparent',
                                    color: lang === 'kh' ? '#4338ca' : '#334155',
                                    fontWeight: lang === 'kh' ? '700' : '500',
                                    fontSize: '0.88rem',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <span>🇰🇭</span> ភាសាខ្មែរ
                            </button>
                            <button
                                onClick={() => { setLang('en'); setIsLangMenuOpen(false); }}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: lang === 'en' ? '#e0e7ff' : 'transparent',
                                    color: lang === 'en' ? '#4338ca' : '#334155',
                                    fontWeight: lang === 'en' ? '700' : '500',
                                    fontSize: '0.88rem',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <span>🇬🇧</span> English (US)
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Notifications section */}
                <div className={styles.rightSection} style={{ position: 'relative' }} ref={dropdownRef}>
                    {/* Notifications Bell */}
                    <button 
                        className={styles.iconBtn} 
                        onClick={handleToggleDropdown}
                        title="Notifications"
                        style={{ position: 'relative', cursor: 'pointer', background: 'none', border: 'none' }}
                    >
                        <FiBell size={22} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                borderRadius: '50%',
                                padding: '0.15rem 0.4rem',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                border: '2px solid white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '48px',
                            right: '0',
                            width: 'calc(100vw - 32px)',
                            maxWidth: '400px',
                            maxHeight: '480px',
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            border: '1px solid #e2e8f0',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}>
                            {/* Dropdown Header */}
                            <div style={{
                                padding: '1rem 1.25rem',
                                background: '#f8fafc',
                                borderBottom: '1px solid #e2e8f0',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                                        {t('🔔 ការជូនដំណឹង (Notifications)', '🔔 Notifications')}
                                    </strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {notifications.length > 0 && (
                                        <button 
                                            onClick={handleClearAll}
                                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                            title={t('លុបការជូនដំណឹងទាំងអស់', 'Clear all notifications')}
                                        >
                                            <FiTrash2 size={13} /> {t('លុបទាំងអស់', 'Clear All')}
                                        </button>
                                    )}
                                    <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <FiCheckCircle size={14} /> {t('បានមើលរួច', 'Read')}
                                    </span>
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div style={{ overflowY: 'auto', flex: 1 }}>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
                                        🔕 {t('មិនទាន់មានការជូនដំណឹងនៅឡើយទេ', 'No notifications yet')}
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div 
                                            key={notif.id}
                                            onClick={(e) => handleNotificationClick(e, notif)}
                                            style={{
                                                padding: '0.9rem 1.25rem',
                                                borderBottom: '1px solid #f1f5f9',
                                                backgroundColor: '#ffffff',
                                                display: 'flex',
                                                gap: '0.75rem',
                                                alignItems: 'flex-start',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                        >
                                            <div style={{ fontSize: '1.3rem', marginTop: '2px' }}>
                                                {notif.type === 'leave_request' ? '📝' : notif.type === 'homeroom_assignment' ? '🏫' : notif.type === 'schedule_assignment' ? '🗓️' : notif.type === 'student_registration' ? '👨‍🎓' : notif.type === 'password_reset' ? '🔑' : '🔔'}
                                            </div>
                                            <div style={{ flex: 1, paddingRight: '2.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                    <strong style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '700' }}>
                                                        {notif.title}
                                                     </strong>
                                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                        {formatTime(notif.created_at)}
                                                    </span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: '1.4' }}>
                                                    {notif.message}
                                                </p>
                                            </div>

                                            {/* Action Icon Buttons */}
                                            <div style={{ position: 'absolute', right: '10px', top: '10px', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                                <button
                                                    onClick={(e) => handleNotificationClick(e, notif)}
                                                    style={{ border: 'none', background: 'none', color: '#4f46e5', cursor: 'pointer', padding: '3px', borderRadius: '4px' }}
                                                    title={t('👁️ មើលព័ត៌មាន (View Details)', 'View Details')}
                                                >
                                                    <FiEye size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteSingle(e, notif.id)}
                                                    style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '3px', borderRadius: '4px' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                                    onMouseLeave={(e) => e.currentTarget.style.color = '#cbd5e1'}
                                                    title={t('លុបការជូនដំណឹងនេះ', 'Delete this notification')}
                                                >
                                                    <FiTrash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Profile */}
                    <div className={styles.profileSection}>
                        <div className={styles.avatar}>
                            <FiUser size={18} />
                        </div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.name || 'User'}</span>
                            <span className={styles.userRole}>{t(role, role)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
