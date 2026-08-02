import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { logoutUser } from '../../services/authService';
import { getNotifications } from '../../services/notificationService';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import { MdOutlineSchool } from 'react-icons/md';
import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';

const menuTranslations = {
    'Main / ទូទៅ': { kh: 'ទូទៅ', en: 'Main' },
    'Dashboard': { kh: 'ផ្ទាំងបញ្ជា', en: 'Dashboard' },
    'Announcements': { kh: 'ការប្រកាសដំណឹង', en: 'Announcements' },
    'Users / អ្នកប្រើប្រាស់': { kh: 'គ្រប់គ្រងអ្នកប្រើប្រាស់', en: 'User Management' },
    'Users': { kh: 'គណនីទាំងអស់', en: 'Users' },
    'Students': { kh: 'សិស្សសាលា', en: 'Students' },
    'Teachers': { kh: 'គ្រូបង្រៀន', en: 'Teachers' },
    'Parents': { kh: 'មាតាបិតាសិស្ស', en: 'Parents' },
    'Academic / ការសិក្សា': { kh: 'កិច្ចការសិក្សា', en: 'Academic Management' },
    'Classes': { kh: 'ថ្នាក់រៀន', en: 'Classes' },
    'Subjects': { kh: 'មុខវិជ្ជា', en: 'Subjects' },
    'Teacher Assignments': { kh: 'ការចាត់តាំងគ្រូ', en: 'Teacher Assignments' },
    'Schedule': { kh: 'កាលវិភាគសិក្សា', en: 'Schedule' },
    'Attendance': { kh: 'វត្តមានសិស្ស', en: 'Attendance' },
    'Leave Requests': { kh: 'ច្បាប់សម្រាក', en: 'Leave Requests' },
    'Homework': { kh: 'កិច្ចការផ្ទះ', en: 'Homework' },
    'Report Cards': { kh: 'សៀវភៅតាមដាន', en: 'Report Cards' },
    'Organization / អង្គភាព & ទីតាំង': { kh: 'អង្គភាព & ទីតាំង', en: 'Organization' },
    'Buildings & Offices': { kh: 'អគារ & បន្ទប់', en: 'Buildings & Offices' },
    'Org Structure': { kh: 'រចនាសម្ព័ន្ធសាលា', en: 'Org Structure' },
    'System / ប្រព័ន្ធ': { kh: 'ប្រព័ន្ធ', en: 'System' },
    'Profile': { kh: 'ព័ត៌មានផ្ទាល់ខ្លួន', en: 'Profile' },
    'Settings': { kh: 'ការកំណត់', en: 'Settings' },
    'My Classes': { kh: 'ថ្នាក់បង្រៀនរបស់ខ្ញុំ', en: 'My Classes' },
    'Student Scores': { kh: 'ពិន្ទុសិស្ស', en: 'Student Scores' },
    'Children': { kh: 'កូនៗរបស់ខ្ញុំ', en: 'My Children' },
};

const Sidebar = ({ menuItems = [] }) => {
    const { user, role, logout } = useAuth();
    const { lang, t } = useLanguage();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadLeaveCount, setUnreadLeaveCount] = useState(0);

    useEffect(() => {
        if (user && (role === 'admin' || role === 'teacher')) {
            fetchUnreadLeaveCount();
            const interval = setInterval(fetchUnreadLeaveCount, 10000);
            return () => clearInterval(interval);
        }
    }, [user, role]);

    const fetchUnreadLeaveCount = async () => {
        try {
            const res = await getNotifications();
            const notifs = res.data.notifications || [];
            const leaveNotifs = notifs.filter(n => n.type === 'leave_request' && !n.is_read);
            setUnreadLeaveCount(leaveNotifs.length);
        } catch (err) {
            console.error('Failed to fetch sidebar leave notification count:', err);
        }
    };

    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch (error) {
            console.error("Logout error", error);
        } finally {
            logout();
            navigate('/login');
        }
    };

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setMobileOpen(!mobileOpen);
        } else {
            setCollapsed(!collapsed);
        }
    };

    const getDisplayLabel = (label) => {
        if (!label) return '';
        const match = menuTranslations[label];
        if (match) {
            return lang === 'kh' ? match.kh : match.en;
        }
        return label;
    };

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)}></div>
            )}
            
            <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
                <div className={styles.logoSection}>
                    <div className={styles.logoIcon}>
                        <MdOutlineSchool size={28} />
                    </div>
                    {!collapsed && (
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                            <h2 className={styles.schoolName} style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1e1b4b', margin: 0 }}>
                                វិទ្យាល័យ ហ៊ុន សែន ចំការលើ
                            </h2>
                            <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: '700', letterSpacing: '0.04em' }}>
                                HS CHAMKAR LOE
                            </span>
                        </div>
                    )}
                    
                    <button className={styles.mobileToggleBtn} onClick={toggleSidebar}>
                        <FiMenu size={20} />
                    </button>
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item, index) => {
                        const displayLabel = getDisplayLabel(item.label);

                        if (item.isHeader) {
                            return collapsed ? (
                                <div key={index} className={styles.navDivider} title={displayLabel} />
                            ) : (
                                <div key={index} className={styles.navHeader}>
                                    {displayLabel}
                                </div>
                            );
                        }

                        const isLeaveRequestItem = item.path && item.path.includes('leave-requests');

                        return (
                            <NavLink
                                key={index}
                                to={item.path}
                                end={item.end || false}
                                className={({ isActive }) => 
                                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                                }
                                title={collapsed ? displayLabel : ""}
                                onClick={() => {
                                    if (window.innerWidth <= 768) setMobileOpen(false);
                                }}
                            >
                                <span className={styles.navIcon} style={{ position: 'relative' }}>
                                    {item.icon || <div className={styles.defaultIcon} />}
                                    {collapsed && isLeaveRequestItem && unreadLeaveCount > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            right: '-4px',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '8px',
                                            height: '8px',
                                        }} />
                                    )}
                                </span>
                                {!collapsed && <span className={styles.navLabel}>{displayLabel}</span>}

                                {!collapsed && isLeaveRequestItem && unreadLeaveCount > 0 && (
                                    <span style={{
                                        marginLeft: 'auto',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        borderRadius: '12px',
                                        padding: '0.12rem 0.55rem',
                                        fontSize: '0.72rem',
                                        fontWeight: '700',
                                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                                    }}>
                                        {unreadLeaveCount > 9 ? '9+' : unreadLeaveCount}
                                    </span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className={styles.bottomSection}>
                    {!collapsed && (
                        <div className={styles.userInfo}>
                            <p className={styles.userName}>{user?.name || 'User'}</p>
                            <span className={styles.userRoleBadge}>{role || 'Guest'}</span>
                        </div>
                    )}
                    <button onClick={handleLogout} className={styles.logoutBtn} title={t('ចាកចេញ', 'Logout')}>
                        <FiLogOut size={20} />
                        {!collapsed && <span>{t('ចាកចេញ', 'Logout')}</span>}
                    </button>
                </div>
            </aside>
            
            {/* Mobile Hamburger Button */}
            <button className={styles.hamburgerBtn} onClick={() => setMobileOpen(true)}>
                <FiMenu size={24} />
            </button>
        </>
    );
};

export default Sidebar;
