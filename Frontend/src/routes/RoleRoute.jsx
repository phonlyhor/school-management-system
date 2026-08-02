import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleRoute = ({ children, allowedRoles }) => {
    const { user, role } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Role is now explicitly managed by AuthContext and localStorage
    if (!allowedRoles.includes(role)) {
        // Redirect to their respective dashboard if they try to access unauthorized roles
        const dashboardRoutes = {
            admin: "/admin/dashboard",
            teacher: "/teacher/dashboard",
            student: "/student/dashboard",
            parent: "/parent/dashboard",
        };

        const redirectPath = dashboardRoutes[role] || "/login";
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default RoleRoute;
