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
  register: (email: string, name: string, password: string, invitationCode?: string) =>
    api.post('/auth/register', { email, name, password, invitationCode }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  validate: (code: string) => api.post('/invitations/validate', { code }),
};

export const invitationsService = {
  generate: () => api.post('/invitations/generate'),
  getMyCodes: () => api.get('/invitations/my-codes'),
  validate: (code: string) => api.post('/invitations/validate', { code }),
  delete: (code: string) => api.delete(`/invitations/${code}`),
};

export const athletesService = {
  getAll: () => api.get('/athletes'),
  getMe: () => api.get('/athletes/me'), // New route for athlete to get their own profile
  getById: (id: string) => api.get(`/athletes/${id}`),
  add: (userId: string, age: number, level: string, goals: string) =>
    api.post('/athletes', { userId, age, level, goals }),
  update: (id: string, data: any) => api.put(`/athletes/${id}`, data),
  delete: (id: string) => api.delete(`/athletes/${id}`),
  createAthleteAccount: (data: { email: string; name: string; age?: number; level?: string; goals?: string }) =>
    api.post('/athletes/create-account', data),
};

export const sessionsService = {
  create: (data: any) => api.post('/sessions', data),
  getForAthlete: (athleteId: string) => api.get(`/sessions/athlete/${athleteId}`),
  getAll: () => api.get('/sessions'),
  update: (id: string, data: any) => api.put(`/sessions/${id}`, data),
  delete: (id: string) => api.delete(`/sessions/${id}`),
  exportToWatch: (sessionId: string, format: 'tcx' | 'json' | 'txt' | 'md') => {
    return api.get(`/sessions/${sessionId}/export/${format}`, {
      responseType: format === 'json' ? 'json' : 'blob',
    });
  },
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

export const activitiesService = {
  getForAthlete: (athleteId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/activities/athlete/${athleteId}?${params.toString()}`);
  },
  getAllForCoach: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/activities/coach/all?${params.toString()}`);
  },
  create: (data: any) => api.post('/activities', data),
  uploadGPX: (file: File, athleteId: string) => {
    const formData = new FormData();
    formData.append('gpxFile', file);
    formData.append('athleteId', athleteId);
    return api.post('/activities/upload-gpx', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id: string, data: any) => api.put(`/activities/${id}`, data),
  delete: (id: string) => api.delete(`/activities/${id}`),
};

export const platformsService = {
  getConnected: () => api.get('/platforms/connected'),
  getAuthUrl: (platform: string) => 
    api.get(`/platforms/oauth/${platform}/authorize`).then(res => res.data),
  handleCallback: (platform: string, code: string, state: string) => 
    api.post(`/platforms/oauth/${platform}/callback`, { code, state }),
  disconnect: (platform: string) => 
    api.delete(`/platforms/disconnect/${platform}`),
  sync: (platform: string) => 
    api.post(`/platforms/sync/${platform}`),
  getSyncHistory: () => 
    api.get('/platforms/sync-history'),
};

export default api;
