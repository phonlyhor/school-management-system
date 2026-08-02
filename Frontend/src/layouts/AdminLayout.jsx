import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

import { 
    FiHome, FiUsers, FiUser, FiUserCheck, FiHeart,
    FiBookOpen, FiBook, FiBriefcase, FiCalendar, FiClock, FiFileText,
    FiMapPin, FiGitBranch, FiSettings, FiBell, FiEdit3, FiPaperclip
} from 'react-icons/fi';

const menuItems = [
    // Main Section
    { isHeader: true, label: 'Main / ទូទៅ' },
    { label: 'Dashboard', path: '/admin/dashboard', icon: <FiHome /> },
    { label: 'Announcements', path: '/admin/announcements', icon: <FiBell /> },

    // User Management
    { isHeader: true, label: 'Users / អ្នកប្រើប្រាស់' },
    { label: 'Users', path: '/admin/users', icon: <FiUsers /> },
    { label: 'Students', path: '/admin/students', icon: <FiUser /> },
    { label: 'Teachers', path: '/admin/teachers', icon: <FiUserCheck /> },
    { label: 'Parents', path: '/admin/parents', icon: <FiHeart /> },

    // Academic Management
    { isHeader: true, label: 'Academic / ការសិក្សា' },
    { label: 'Classes', path: '/admin/classes', icon: <FiBookOpen /> },
    { label: 'Subjects', path: '/admin/subjects', icon: <FiBook /> },
    { label: 'Teacher Assignments', path: '/admin/teacher-assignments', icon: <FiBriefcase /> },
    { label: 'Schedule', path: '/admin/schedule', icon: <FiClock /> },
    { label: 'Attendance', path: '/admin/attendance', icon: <FiCalendar /> },
    { label: 'សៀវភៅតាមដាន (Logbook)', path: '/admin/monitoring-logbook', icon: <FiFileText /> },
    { label: 'Homework', path: '/admin/homework', icon: <FiPaperclip /> },
    { label: 'Report Cards', path: '/admin/report-cards', icon: <FiFileText /> },

    // Organization & Facilities
    { isHeader: true, label: 'Organization / អង្គភាព & ទីតាំង' },
    { label: 'Buildings & Offices', path: '/admin/buildings', icon: <FiMapPin /> },
    { label: 'Org Structure', path: '/admin/org-chart', icon: <FiGitBranch /> },

    // System
    { isHeader: true, label: 'System / ប្រព័ន្ធ' },
    { label: 'Profile', path: '/admin/profile', icon: <FiUser /> },
    { label: 'Settings', path: '/admin/settings', icon: <FiSettings /> },
];

const AdminLayout = () => {
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

export default AdminLayout;
