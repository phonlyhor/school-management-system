import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

import { FiHome, FiUsers, FiCalendar, FiAward, FiUser, FiBell, FiEdit3 } from 'react-icons/fi';

const menuItems = [
    { label: 'Dashboard', path: '/parent/dashboard', icon: <FiHome /> },
    { label: 'Announcements', path: '/parent/announcements', icon: <FiBell /> },
    { label: 'Children', path: '/parent/children', icon: <FiUsers /> },
    { label: 'Schedule', path: '/parent/schedule', icon: <FiCalendar /> },
    { label: 'Attendance', path: '/parent/attendance', icon: <FiCalendar /> },
    { label: 'Report Cards', path: '/parent/report-cards', icon: <FiAward /> },
    { label: 'Profile', path: '/parent/profile', icon: <FiUser /> },
];

const ParentLayout = () => {
    return (
        <div className="app-container">
            <Sidebar menuItems={menuItems} />
            <div className="main-content">
                <Navbar />
                <main className="page-content">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default ParentLayout;
