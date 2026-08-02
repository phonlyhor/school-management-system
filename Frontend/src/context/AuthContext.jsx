// React Context for managing global authentication state
import { createContext, useContext, useState, useEffect } from "react";
import { getUser, getToken, getRole, setUser as setStorageUser, setToken as setStorageToken, setRole as setStorageRole, clearAuth } from "../utils/storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getUser());
    const [token, setToken] = useState(getToken());
    const [role, setRole] = useState(getRole());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulating an initialization process, if needed.
        // E.g., validating the token with the backend on boot.
        setLoading(false);
    }, []);

    const login = (userData, authToken, userRole) => {
        setUser(userData);
        setToken(authToken);
        setRole(userRole);

        setStorageUser(userData);
        setStorageToken(authToken);
        setStorageRole(userRole);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setRole(null);

        clearAuth();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                role,
                loading,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};