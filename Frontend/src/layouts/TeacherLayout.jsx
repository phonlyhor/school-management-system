import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

import { FiHome, FiBookOpen, FiCalendar, FiEdit3, FiClock, FiUser, FiBell, FiPaperclip } from 'react-icons/fi';

const menuItems = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: <FiHome /> },
    { label: 'Announcements', path: '/teacher/announcements', icon: <FiBell /> },
    { label: 'My Classes', path: '/teacher/classes', icon: <FiBookOpen /> },
    { label: 'Attendance', path: '/teacher/attendance', icon: <FiCalendar /> },
    { label: 'Homework', path: '/teacher/homework', icon: <FiPaperclip /> },
    { label: 'Scores', path: '/teacher/scores', icon: <FiEdit3 /> },
    { label: 'Schedule', path: '/teacher/schedule', icon: <FiClock /> },
    { label: 'Profile', path: '/teacher/profile', icon: <FiUser /> },
];

const TeacherLayout = () => {
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

export default TeacherLayout;
