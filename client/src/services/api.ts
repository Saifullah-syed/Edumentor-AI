import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edumentor_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on 401 if not logging in
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('edumentor_token');
        localStorage.removeItem('edumentor_user');
        window.dispatchEvent(new Event('edumentor_auth_logout'));
      }
    }
    return Promise.reject(error);
  }
);

// 1. Auth Service
export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// 2. Student & Profile Service
export const studentApi = {
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data: any) => api.put('/student/profile', data),
  getDashboard: () => api.get('/student/dashboard'),
  // Courses
  getCourses: () => api.get('/student/courses'),
  addCourse: (data: any) => api.post('/student/courses', data),
  updateCourse: (id: number, data: any) => api.put(`/student/courses/${id}`, data),
  deleteCourse: (id: number) => api.delete(`/student/courses/${id}`),
  // Skills
  getSkills: () => api.get('/student/skills'),
  addSkill: (data: any) => api.post('/student/skills', data),
  updateSkill: (id: number, data: any) => api.put(`/student/skills/${id}`, data),
  deleteSkill: (id: number) => api.delete(`/student/skills/${id}`),
  // Meta options
  getCareers: () => api.get('/student/meta/careers'),
  getAvailableCourses: () => api.get('/student/meta/courses'),
  getAvailableSkills: () => api.get('/student/meta/skills'),
};

// 3. AI Advisor Service
export const advisorApi = {
  getConversation: () => api.get('/advisor/conversation'),
  sendMessage: (message: string) => api.post('/advisor/message', { message }),
  clearConversation: () => api.delete('/advisor/conversation'),
};

// 4. Career Roadmap Service
export const roadmapApi = {
  getRoadmap: (careerId?: number) => api.get('/roadmap', { params: { career_id: careerId } }),
  generateRoadmap: (careerId: number) => api.post('/roadmap/generate', { career_id: careerId }),
  toggleMilestone: (itemId: number, completed: boolean) =>
    api.patch(`/roadmap/milestones/${itemId}/toggle`, { completed }),
};

// 5. Skill Gap Analysis Service
export const skillGapApi = {
  getAnalysis: (careerId?: number) => api.get('/skillgap', { params: { career_id: careerId } }),
};

// 6. Learning Plan Service
export const learningPlanApi = {
  getPlan: () => api.get('/learningplan'),
  generatePlan: (data: { target_career?: string; timeframe_weeks?: number; hours_per_week?: number }) =>
    api.post('/learningplan/generate', data),
  togglePlanItem: (itemId: number, completed: boolean) =>
    api.patch(`/learningplan/items/${itemId}/toggle`, { completed }),
};

// 7. Resume Analyzer Service
export const resumeApi = {
  uploadResume: (formData: FormData) =>
    api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getHistory: () => api.get('/resume/history'),
  getDetail: (id: number) => api.get(`/resume/${id}`),
};

// 8. Admin Service
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getStudents: (params?: { search?: string; program?: string }) => api.get('/admin/students', { params }),
  getStudentDetail: (id: number) => api.get(`/admin/students/${id}`),
  // Courses CRUD
  createCourse: (data: any) => api.post('/admin/courses', data),
  updateCourse: (id: number, data: any) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id: number) => api.delete(`/admin/courses/${id}`),
  // Careers CRUD
  getCareers: () => api.get('/admin/careers'),
  createCareer: (data: any) => api.post('/admin/careers', data),
  updateCareer: (id: number, data: any) => api.put(`/admin/careers/${id}`, data),
  deleteCareer: (id: number) => api.delete(`/admin/careers/${id}`),
  addCareerSkill: (careerId: number, data: any) => api.post(`/admin/careers/${careerId}/skills`, data),
  updateCareerSkill: (careerId: number, skillId: number, data: any) =>
    api.put(`/admin/careers/${careerId}/skills/${skillId}`, data),
  removeCareerSkill: (careerId: number, skillId: number) =>
    api.delete(`/admin/careers/${careerId}/skills/${skillId}`),
};

// 9. Faculty & Human Support Service
export const supportApi = {
  submitRequest: (data: {
    email: string;
    subject?: string;
    inquiry?: string;
    category?: string;
    name?: string;
    topic?: string;
    message?: string;
  }) => api.post('/support/request', data),
};

export default api;
