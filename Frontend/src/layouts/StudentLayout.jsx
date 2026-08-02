import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

import { FiHome, FiCalendar, FiAward, FiClock, FiUser, FiBell, FiEdit3, FiPaperclip } from 'react-icons/fi';

const menuItems = [
    { label: 'Dashboard', path: '/student/dashboard', icon: <FiHome /> },
    { label: 'Announcements', path: '/student/announcements', icon: <FiBell /> },
    { label: 'Attendance', path: '/student/attendance', icon: <FiCalendar /> },
    { label: 'Homework', path: '/student/homework', icon: <FiPaperclip /> },
    { label: 'Report Cards', path: '/student/report-cards', icon: <FiAward /> },
    { label: 'Schedule', path: '/student/schedule', icon: <FiClock /> },
    { label: 'Profile', path: '/student/profile', icon: <FiUser /> },
];

const StudentLayout = () => {
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

export default StudentLayout;
