import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '/api/' : 'http://localhost:8000/api/'),
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.data?.detail === 'Invalid token.' || error.response.data?.detail === 'Token has expired.')) {
            localStorage.removeItem('token');
            if (!window.location.hash.includes('/login') && !window.location.hash.includes('/register')) {
                // Use a soft redirect or just reload if critical
                // window.location.href = '/rakutan/#/login'; 
                // Force reload to login page
                window.location.hash = '#/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
