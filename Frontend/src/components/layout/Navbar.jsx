import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { FiSearch, FiBell, FiUser, FiCheckCircle, FiGlobe } from 'react-icons/fi';
import { getNotifications, markAllNotificationsAsRead } from '../../services/notificationService';
import styles from './Navbar.module.css';

const Navbar = () => {
    const { user, role } = useAuth();
    const { lang, setLang, t } = useLanguage();

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

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const diff = (new Date() - new Date(dateStr)) / 1000;
        if (diff < 60) return t('អម្បាញ់មិញ', 'Just now');
        if (diff < 3600) return `${Math.floor(diff / 60)}${t('នាទីមុន', 'm ago')}`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}${t('ម៉ោងមុន', 'h ago')}`;
        return `${Math.floor(diff / 86400)}${t('ថ្ងៃមុន', 'd ago')}`;
    };

    return (
        <header className={styles.navbar}>
            <div className={styles.leftSection}>
                {/* Search Bar */}
                <div className={styles.searchContainer}>
                    <FiSearch className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder={t("ស្វែងរក...", "Search anything...")} 
                        className={styles.searchInput}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                {/* Language Switcher Dropdown (🇰🇭 Khmer / 🇬🇧 English) */}
                <div style={{ position: 'relative' }} ref={langRef}>
                    <button
                        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                        style={{
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            borderRadius: '20px',
                            padding: '0.4rem 0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontWeight: '700',
                            color: '#0f172a',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <FiGlobe size={16} style={{ color: '#2563eb' }} />
                        <span>{lang === 'kh' ? '🇰🇭 ភាសាខ្មែរ' : '🇬🇧 English'}</span>
                    </button>

                    {isLangMenuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '44px',
                            right: '0',
                            width: '160px',
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e2e8f0',
                            zIndex: 1000,
                            overflow: 'hidden',
                            padding: '0.35rem 0'
                        }}>
                            <button
                                onClick={() => { setLang('kh'); setIsLangMenuOpen(false); }}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 1rem',
                                    border: 'none',
                                    backgroundColor: lang === 'kh' ? '#eff6ff' : 'transparent',
                                    color: lang === 'kh' ? '#2563eb' : '#334155',
                                    fontWeight: lang === 'kh' ? '700' : '500',
                                    fontSize: '0.88rem',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <span>🇰🇭</span> ភាសាខ្មែរ (Khmer)
                            </button>

                            <button
                                onClick={() => { setLang('en'); setIsLangMenuOpen(false); }}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 1rem',
                                    border: 'none',
                                    backgroundColor: lang === 'en' ? '#eff6ff' : 'transparent',
                                    color: lang === 'en' ? '#2563eb' : '#334155',
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

                    {/* Notifications Dropdown (Read-Only Info View) */}
                    {isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '48px',
                            right: '0',
                            width: 'calc(100vw - 32px)',
                            maxWidth: '380px',
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
                                <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <FiCheckCircle size={14} /> {t('បានមើលរួច', 'Read')}
                                </span>
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
                                            style={{
                                                padding: '0.9rem 1.25rem',
                                                borderBottom: '1px solid #f1f5f9',
                                                backgroundColor: '#ffffff',
                                                display: 'flex',
                                                gap: '0.75rem',
                                                alignItems: 'flex-start'
                                            }}
                                        >
                                            <div style={{ fontSize: '1.3rem', marginTop: '2px' }}>
                                                {notif.type === 'leave_request' ? '📝' : notif.type === 'homeroom_assignment' ? '🏫' : notif.type === 'schedule_assignment' ? '🗓️' : notif.type === 'teacher_assignment' ? '📚' : '🔔'}
                                            </div>
                                            <div style={{ flex: 1 }}>
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
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Profile */}
                    <div className={styles.profileSection}>
                        <div className={styles.avatar}>
                            <FiUser size={20} />
                        </div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.name || 'User'}</span>
                            <span className={styles.userRole}>{role || 'Guest'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
