import axios, { AxiosInstance } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const TOKEN_KEY = "zestpos_token";

export const publicApi: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const authApi: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export function getStoredToken(): string | null {
    try {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
        return null;
    }
}

export function setStoredToken(token: string | null) {
    try {
        if (typeof window === "undefined") return;
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
            authApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
            localStorage.removeItem(TOKEN_KEY);
            delete authApi.defaults.headers.common["Authorization"];
        }
    } catch (e) {
    }
}

const initialToken = getStoredToken();
if (initialToken) {
    authApi.defaults.headers.common["Authorization"] = `Bearer ${initialToken}`;
}

authApi.interceptors.request.use(
    (config) => {
        const token = getStoredToken();
        if (token) {
            config.headers = config.headers || {};
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default { publicApi, authApi, getStoredToken, setStoredToken };
