import axios from 'axios';


const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
    headers: {
        'Accept': 'application/json',
    },
});

// Request interceptor — attach token from sessionStorage
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('sm_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor — redirect on 401 (session expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Never intercept 401s from auth endpoints — there it means
            // "wrong credentials", not "session expired". Let the component
            // handle the error via onError so the user sees a toast.
            const requestUrl: string = error.config?.url ?? '';
            const AUTH_ENDPOINTS = [
                '/auth/send-otp',
                '/auth/login-otp',
                '/auth/forgot-password',
                '/auth/reset-password',
                '/consumer/login',
            ];
            const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => requestUrl.includes(ep));
            if (isAuthEndpoint) {
                return Promise.reject(error);
            }

            // Read role BEFORE clearing storage (ordering fix)
            const role = localStorage.getItem('sm_role');
            sessionStorage.removeItem('sm_token');
            sessionStorage.removeItem('sm_user');
            localStorage.removeItem('sm_role');

            let loginPath = '/agent/login';
            if (role === 'admin' || role === 'operator') loginPath = '/admin/login';
            else if (role === 'super_agent') loginPath = '/super-agent/login';
            else if (role === 'super_admin') loginPath = '/super-admin/login';
            else if (role === 'enumerator') loginPath = '/enumerator/login';
            else if (role === 'field_technical_team') loginPath = '/technical/login';
            else if (role === 'consumer') loginPath = '/consumer/login';

            if (!window.location.pathname.includes('/login')) {
                window.location.href = loginPath;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
