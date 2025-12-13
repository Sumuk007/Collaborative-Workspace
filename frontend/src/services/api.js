import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    // FastAPI OAuth2 expects form data
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await axios.post(`${API_BASE_URL}/auth/login`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/password-reset-request', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/password-reset', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

// Documents API endpoints
export const documentsAPI = {
  getAll: async (skip = 0, limit = 10, search = '') => {
    const params = { skip, limit };
    if (search) params.search = search;
    const response = await api.get('/documents/', { params });
    return response.data;
  },

  getById: async (documentId) => {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  },

  create: async (documentData) => {
    const response = await api.post('/documents/', documentData);
    return response.data;
  },

  update: async (documentId, documentData) => {
    const response = await api.put(`/documents/${documentId}`, documentData);
    return response.data;
  },

  delete: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  },

  getCollaborators: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/collaborators`);
    return response.data;
  },

  addCollaborator: async (documentId, collaboratorData) => {
    const response = await api.post(`/documents/${documentId}/collaborators`, collaboratorData);
    return response.data;
  },

  updateCollaboratorRole: async (documentId, userId, role) => {
    const response = await api.put(`/documents/${documentId}/collaborators/${userId}`, { role });
    return response.data;
  },

  removeCollaborator: async (documentId, userId) => {
    const response = await api.delete(`/documents/${documentId}/collaborators/${userId}`);
    return response.data;
  },

  createShareLink: async (documentId, shareLinkData) => {
    const response = await api.post(`/documents/${documentId}/share`, shareLinkData);
    return response.data;
  },

  acceptShareLink: async (token) => {
    const response = await api.post(`/documents/share/${token}/accept`);
    return response.data;
  },
};

export default api;
