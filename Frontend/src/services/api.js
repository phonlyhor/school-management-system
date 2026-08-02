// Core API configuration and interceptors (e.g., Axios setup)
import axios from "axios";
import { getToken, clearAuth } from "../utils/storage";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            clearAuth();
            const path = window.location.pathname;
            const isPublicPage = path === '/login' || path === '/register' || path.startsWith('/register') || path.startsWith('/student/verify') || path === '/forgot-password';
            if (!isPublicPage) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;