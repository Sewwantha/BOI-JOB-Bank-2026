import axios from 'axios';

// In dev, the Vite server and the API run on separate ports; use the host the page was loaded from
// so the app works from other devices on the network. In production (IIS), the API serves the
// frontend itself, so a relative path is enough.
const API_BASE_URL = import.meta.env.DEV
  ? `http://${window.location.hostname}:5241/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject the JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const auth = localStorage.getItem('jobbank_auth');
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        if (parsed && parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch (err) {
        console.error('Error parsing auth data from localstorage:', err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// A 401 on a signed-in request means the session is no longer valid
// (for example, an admin deactivated the account): sign out and go to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = (error.config?.url ?? '').startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthCall && localStorage.getItem('jobbank_auth')) {
      localStorage.removeItem('jobbank_auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
