import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

// Layouts
import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import TeacherLayout from "../layouts/TeacherLayout";
import StudentLayout from "../layouts/StudentLayout";
import ParentLayout from "../layouts/ParentLayout";

// Auth
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";

// Common Public School Feature Pages
import LeaveRequests from "../pages/common/LeaveRequests";
import Announcements from "../pages/common/Announcements";
import HomeworkPage from "../pages/common/HomeworkPage";

// Admin
import AdminDashboard from "../pages/admin/Dashboard";
import AdminUsers from "../pages/admin/Users";
import AdminStudents from "../pages/admin/Students";
import AdminTeachers from "../pages/admin/Teachers";
import AdminParents from "../pages/admin/Parents";
import AdminClasses from "../pages/admin/Classes";
import StudentRegistrationManager from "../pages/admin/StudentRegistrationManager";
import AdminBuildings from "../pages/admin/Buildings";
import AdminOrgChart from "../pages/admin/OrgChart";
import AdminSubjects from "../pages/admin/Subjects";
import AdminTeacherAssignments from "../pages/admin/TeacherAssignments";
import AdminAttendance from "../pages/admin/Attendance";
import AdminMonitoringLogbook from "../pages/admin/MonitoringLogbook";
import AdminSchedule from "../pages/admin/Schedule";
import AdminReportCard from "../pages/admin/ReportCard";
import StudentPromotion from "../pages/admin/StudentPromotion";
import AdminSettings from "../pages/admin/Settings";
import AdminProfile from "../pages/admin/Profile";

// Teacher
import TeacherDashboard from "../pages/teacher/Dashboard";
import TeacherMyClasses from "../pages/teacher/MyClasses";
import TeacherAttendance from "../pages/teacher/Attendance";
import TeacherScores from "../pages/teacher/Scores";
import TeacherSchedule from "../pages/teacher/Schedule";
import HomeroomSchedule from "../pages/teacher/HomeroomSchedule";
import HomeroomScores from "../pages/teacher/HomeroomScores";
import HomeroomRoster from "../pages/teacher/HomeroomRoster";
import TeacherProfile from "../pages/teacher/Profile";

// Student
import StudentDashboard from "../pages/student/Dashboard";
import StudentAttendance from "../pages/student/Attendance";
import StudentReportCard from "../pages/student/ReportCard";
import StudentSchedule from "../pages/student/Schedule";
import StudentProfile from "../pages/student/Profile";

// Parent
import ParentDashboard from "../pages/parent/Dashboard";
import ParentChildren from "../pages/parent/Children";
import ParentAttendance from "../pages/parent/Attendance";
import ParentReportCard from "../pages/parent/ReportCard";
import ParentSchedule from "../pages/parent/Schedule";
import ParentProfile from "../pages/parent/Profile";

// Public Verification & Registration
import StudentVerification from "../pages/public/StudentVerification";
import StudentRegister from "../pages/public/StudentRegister";

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<StudentRegister />} />
            <Route path="/register/student" element={<StudentRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/student/verify/:code" element={<StudentVerification />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
                <ProtectedRoute>
                    <RoleRoute allowedRoles={["admin"]}>
                        <AdminLayout />
                    </RoleRoute>
                </ProtectedRoute>
            }>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="teachers" element={<AdminTeachers />} />
                <Route path="parents" element={<AdminParents />} />
                <Route path="classes" element={<AdminClasses />} />
                <Route path="student-registration" element={<StudentRegistrationManager />} />
                <Route path="buildings" element={<AdminBuildings />} />
                <Route path="org-chart" element={<AdminOrgChart />} />
                <Route path="subjects" element={<AdminSubjects />} />
                <Route path="teacher-assignments" element={<AdminTeacherAssignments />} />
                <Route path="attendance" element={<AdminAttendance />} />
                <Route path="monitoring-logbook" element={<AdminMonitoringLogbook />} />
                <Route path="schedule" element={<AdminSchedule />} />
                <Route path="report-cards" element={<AdminReportCard />} />
                <Route path="promotion" element={<StudentPromotion />} />
                <Route path="leave-requests" element={<LeaveRequests />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="homework" element={<HomeworkPage />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            {/* Teacher Routes */}
            <Route path="/teacher" element={
                <ProtectedRoute>
                    <RoleRoute allowedRoles={["teacher"]}>
                        <TeacherLayout />
                    </RoleRoute>
                </ProtectedRoute>
            }>
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="classes" element={<TeacherMyClasses />} />
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="scores" element={<TeacherScores />} />
                <Route path="schedule" element={<TeacherSchedule />} />
                <Route path="homeroom-schedule" element={<HomeroomSchedule />} />
                <Route path="homeroom-scores" element={<HomeroomScores />} />
                <Route path="homeroom-roster" element={<HomeroomRoster />} />
                <Route path="leave-requests" element={<LeaveRequests />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="homework" element={<HomeworkPage />} />
                <Route path="profile" element={<TeacherProfile />} />
                <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
            </Route>

            {/* Student Routes */}
            <Route path="/student" element={
                <ProtectedRoute>
                    <RoleRoute allowedRoles={["student"]}>
                        <StudentLayout />
                    </RoleRoute>
                </ProtectedRoute>
            }>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="attendance" element={<StudentAttendance />} />
                <Route path="report-cards" element={<StudentReportCard />} />
                <Route path="schedule" element={<StudentSchedule />} />
                <Route path="leave-requests" element={<LeaveRequests />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="homework" element={<HomeworkPage />} />
                <Route path="profile" element={<StudentProfile />} />
                <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
            </Route>

            {/* Parent Routes */}
            <Route path="/parent" element={
                <ProtectedRoute>
                    <RoleRoute allowedRoles={["parent"]}>
                        <ParentLayout />
                    </RoleRoute>
                </ProtectedRoute>
            }>
                <Route path="dashboard" element={<ParentDashboard />} />
                <Route path="children" element={<ParentChildren />} />
                <Route path="attendance" element={<ParentAttendance />} />
                <Route path="report-cards" element={<ParentReportCard />} />
                <Route path="schedule" element={<ParentSchedule />} />
                <Route path="leave-requests" element={<LeaveRequests />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="profile" element={<ParentProfile />} />
                <Route path="*" element={<Navigate to="/parent/dashboard" replace />} />
            </Route>

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Catch All */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;
