import axios from 'axios';

// In dev, VITE_API_URL is empty → baseURL "/api" → Vite proxies to localhost:5000.
// In prod (Vercel), set VITE_API_URL to the Render backend origin, e.g.
//   VITE_API_URL=https://edii-lms-api.onrender.com
const API_ORIGIN = import.meta.env.VITE_API_URL || '';
export const API_BASE = `${API_ORIGIN}/api`;

const api = axios.create({ baseURL: API_BASE });

// Attach access token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try one refresh, then retry the original request.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const refreshToken = localStorage.getItem('refreshToken');
    if (
      error.response?.status === 401 &&
      refreshToken &&
      !original._retry &&
      !original.url.includes('/auth/')
    ) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        const { data } = await refreshing;
        refreshing = null;
        localStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Build a video stream URL that carries the token as a query param,
// since <video src> cannot send an Authorization header.
export function streamUrl(lessonId) {
  const token = localStorage.getItem('accessToken');
  return `${API_BASE}/stream/${lessonId}?token=${token}`;
}

export default api;
