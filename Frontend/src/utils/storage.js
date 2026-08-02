// Centralized Storage Management (Using sessionStorage to prevent cross-tab conflicts)

export const setToken = (token) => {
    sessionStorage.setItem("token", token);
};

export const getToken = () => {
    return sessionStorage.getItem("token");
};

export const setUser = (user) => {
    sessionStorage.setItem("user", JSON.stringify(user));
};

export const getUser = () => {
    try {
        const stored = sessionStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        console.error("Error parsing user from sessionStorage:", e);
        return null;
    }
};

export const setRole = (role) => {
    sessionStorage.setItem("role", role);
};

export const getRole = () => {
    return sessionStorage.getItem("role");
};

export const clearAuth = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("role");
};
