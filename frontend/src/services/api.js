// frontend/src/services/api.js
import axios from "axios";

let baseURL;

// Detect environment and set baseURL accordingly
const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.endsWith(".local");

if (isLocal) {
    const host = import.meta.env.VITE_API_HOST || "192.168.1.187";
    const port = import.meta.env.VITE_API_PORT || "8000";
    baseURL = `https://${host}${port === "443" ? "" : `:${port}`}`;
} else {
    // Production — hardcoded to avoid relying on VITE at runtime
    baseURL = "https://api.invoice.zuperhandy.com";
}

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    // Don't attach Authorization for public endpoints
    const isPublic = config.url?.includes("/public/invoice/");
    if (!isPublic && token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
