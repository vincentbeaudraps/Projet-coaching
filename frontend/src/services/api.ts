import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (email: string, name: string, password: string, role: 'coach' | 'athlete') =>
    api.post('/auth/register', { email, name, password, role }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

export const athletesService = {
  getAll: () => api.get('/athletes'),
  getById: (id: string) => api.get(`/athletes/${id}`),
  add: (userId: string, age: number, level: string, goals: string) =>
    api.post('/athletes', { userId, age, level, goals }),
  update: (id: string, data: any) => api.put(`/athletes/${id}`, data),
};

export const sessionsService = {
  create: (data: any) => api.post('/sessions', data),
  getForAthlete: (athleteId: string) => api.get(`/sessions/athlete/${athleteId}`),
  getAll: () => api.get('/sessions'),
  update: (id: string, data: any) => api.put(`/sessions/${id}`, data),
  delete: (id: string) => api.delete(`/sessions/${id}`),
};

export const messagesService = {
  send: (receiverId: string, content: string) =>
    api.post('/messages', { receiverId, content }),
  getConversation: (userId: string) => api.get(`/messages/conversation/${userId}`),
  markAsRead: (userId: string) => api.put(`/messages/read/${userId}`),
};

export const performanceService = {
  record: (data: any) => api.post('/performance', data),
  getForAthlete: (athleteId: string) => api.get(`/performance/athlete/${athleteId}`),
  getAnalytics: (athleteId: string) => api.get(`/performance/analytics/${athleteId}`),
};

export default api;
