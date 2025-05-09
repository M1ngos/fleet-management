import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
};

export const attendanceService = {
  clockIn: (location) => api.post('/attendance/clock-in', location),
  clockOut: (location) => api.post('/attendance/clock-out', location),
  startBreak: () => api.post('/attendance/break/start'),
  endBreak: () => api.post('/attendance/break/end'),
  getHistory: (startDate, endDate) => 
    api.get('/attendance/history', { params: { startDate, endDate } }),
  getAdminRecords: (startDate, endDate, driverId) =>
    api.get('/attendance/admin/records', { params: { startDate, endDate, driverId } }),
  getOvertimeReport: (startDate, endDate) =>
    api.get('/attendance/admin/overtime', { params: { startDate, endDate } }),
  getActiveDrivers: () => api.get('/attendance/admin/active-drivers'),
  deleteToday: () => api.delete('/attendance/today'),
};

export const driverService = {
  getAll: () => api.get('/drivers'),
  getById: (id) => api.get(`/drivers/${id}`),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
};

export default api; 