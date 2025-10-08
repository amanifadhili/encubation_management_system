/**
 * Real API service layer for connecting to backend.
 * All functions make HTTP requests to the backend API.
 */
import axios from 'axios';

// Base URL for API calls
const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Teams/Incubators API
export async function getIncubators(params?: any) {
  const response = await api.get('/teams', { params });
  return response.data.success ? response.data.data.teams : response.data;
}

export async function getIncubator(id: number) {
  const response = await api.get(`/teams/${id}`);
  return response.data;
}

export async function createIncubator(data: any) {
  const response = await api.post('/teams', data);
  return response.data;
}

export async function updateIncubator(id: number, data: any) {
  const response = await api.put(`/teams/${id}`, data);
  return response.data;
}

export async function deleteIncubator(id: number) {
  const response = await api.delete(`/teams/${id}`);
  return response.data;
}

export async function getIncubatorMembers(id: number) {
  const response = await api.get(`/teams/${id}/members`);
  return response.data;
}

export async function addIncubatorMember(id: number, data: any) {
  const response = await api.post(`/teams/${id}/members`, data);
  return response.data;
}

export async function removeIncubatorMember(id: number, memberId: number) {
  const response = await api.delete(`/teams/${id}/members/${memberId}`);
  return response.data;
}

// Projects API
export async function getProjects(params?: any) {
  const response = await api.get('/projects', { params });
  return response.data.success ? response.data.data.projects : response.data;
}

export async function getProject(id: number) {
  const response = await api.get(`/projects/${id}`);
  return response.data;
}

export async function createProject(data: any) {
  const response = await api.post('/projects', data);
  return response.data;
}

export async function updateProject(id: number, data: any) {
  const response = await api.put(`/projects/${id}`, data);
  return response.data;
}

export async function deleteProject(id: number) {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
}

export async function uploadProjectFiles(id: number, files: FormData, onUploadProgress?: (progress: number) => void) {
  const response = await api.post(`/projects/${id}/files`, files, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
  });
  return response.data;
}

export async function getProjectFiles(id: number) {
  const response = await api.get(`/projects/${id}/files`);
  return response.data;
}

export async function deleteProjectFile(id: number, fileId: number) {
  const response = await api.delete(`/projects/${id}/files/${fileId}`);
  return response.data;
}

// Mentors API
export async function getMentors(params?: any) {
  const response = await api.get('/mentors', { params });
  return response.data.success ? response.data.data.mentors : response.data;
}

export async function getMentor(id: number) {
  const response = await api.get(`/mentors/${id}`);
  return response.data;
}

export async function createMentor(data: any) {
  const response = await api.post('/mentors', data);
  return response.data;
}

export async function updateMentor(id: number, data: any) {
  const response = await api.put(`/mentors/${id}`, data);
  return response.data;
}

export async function deleteMentor(id: number) {
  const response = await api.delete(`/mentors/${id}`);
  return response.data;
}

export async function assignMentorToTeam(mentorId: number, data: any) {
  const response = await api.post(`/mentors/${mentorId}/assign`, data);
  return response.data;
}

export async function removeMentorFromTeam(mentorId: number, teamId: number) {
  const response = await api.delete(`/mentors/${mentorId}/assign/${teamId}`);
  return response.data;
}

// Inventory API
export async function getInventory(params?: any) {
  const response = await api.get('/inventory', { params });
  return response.data.success ? response.data.data.items : response.data;
}

export async function getInventoryItem(id: number) {
  const response = await api.get(`/inventory/${id}`);
  return response.data;
}

export async function createInventoryItem(data: any) {
  const response = await api.post('/inventory', data);
  return response.data;
}

export async function updateInventoryItem(id: number, data: any) {
  const response = await api.put(`/inventory/${id}`, data);
  return response.data;
}

export async function deleteInventoryItem(id: number) {
  const response = await api.delete(`/inventory/${id}`);
  return response.data;
}

export async function assignInventoryToTeam(id: number, data: any) {
  const response = await api.post(`/inventory/${id}/assign`, data);
  return response.data;
}

export async function unassignInventoryFromTeam(id: number, teamId: number) {
  const response = await api.delete(`/inventory/${id}/assign/${teamId}`);
  return response.data;
}

// Material Requests API
export async function getRequests(params?: any) {
  const response = await api.get('/requests', { params });
  return response.data.success ? response.data.data : response.data;
}

export async function getRequest(id: number) {
  const response = await api.get(`/requests/${id}`);
  return response.data;
}

export async function createRequest(data: any) {
  const response = await api.post('/requests', data);
  return response.data;
}

export async function updateRequestStatus(id: number, data: any) {
  const response = await api.put(`/requests/${id}/status`, data);
  return response.data;
}

export async function deleteRequest(id: number) {
  const response = await api.delete(`/requests/${id}`);
  return response.data;
}

// Announcements API
export async function getAnnouncements(params?: any) {
  const response = await api.get('/announcements', { params });
  return response.data.success ? response.data.data.announcements : response.data;
}

export async function getAnnouncement(id: number) {
  const response = await api.get(`/announcements/${id}`);
  return response.data;
}

export async function createAnnouncement(data: any) {
  const response = await api.post('/announcements', data);
  return response.data;
}

export async function updateAnnouncement(id: number, data: any) {
  const response = await api.put(`/announcements/${id}`, data);
  return response.data;
}

export async function deleteAnnouncement(id: number) {
  const response = await api.delete(`/announcements/${id}`);
  return response.data;
}

// Notifications API
export async function getNotifications(params?: any) {
  const response = await api.get('/notifications', { params });
  return response.data.success ? response.data.data.notifications : response.data;
}

export async function createNotification(data: any) {
  const response = await api.post('/notifications', data);
  return response.data;
}

export async function markNotificationAsRead(id: number) {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
}

export async function deleteNotification(id: number) {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
}

// Reports API
export async function getTeamsReport(params?: any) {
  const response = await api.get('/reports/teams', { params });
  return response.data.success ? response.data.data : response.data;
}

export async function getInventoryReport(params?: any) {
  const response = await api.get('/reports/inventory', { params });
  return response.data.success ? response.data.data : response.data;
}

export async function getProjectsReport(params?: any) {
  const response = await api.get('/reports/projects', { params });
  return response.data.success ? response.data.data : response.data;
}

export async function exportReport(data: any) {
  const response = await api.post('/reports/export', data);
  return response.data;
}

// Dashboard Analytics API
export async function getDashboardAnalytics() {
  const response = await api.get('/reports/dashboard/analytics');
  return response.data.success ? response.data.data : response.data;
}

// File Upload API
export async function uploadFile(file: FormData) {
  const response = await api.post('/upload', file, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// Conversations/Messages API
export async function getConversations() {
  const response = await api.get('/conversations');
  return response.data.success ? response.data.data.conversations : response.data;
}

export async function createConversation(data: any) {
  const response = await api.post('/conversations', data);
  return response.data;
}

export async function getConversationMessages(id: string) {
  const response = await api.get(`/conversations/${id}/messages`);
  return response.data.success ? response.data.data.messages : response.data;
}

export async function sendMessage(id: string, data: any) {
  const response = await api.post(`/conversations/${id}/messages`, data);
  return response.data;
}

export async function sendFileMessage(id: string, file: FormData, onUploadProgress?: (progress: number) => void) {
  const response = await api.post(`/conversations/${id}/messages/file`, file, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
  });
  return response.data;
}

// Users API
export async function getUsers(params?: any) {
  const response = await api.get('/users', { params });
  return response.data.success ? response.data.data : response.data;
}

export async function getUser(id: number) {
  const response = await api.get(`/users/${id}`);
  return response.data.success ? response.data.data : response.data;
}

// Legacy functions for backward compatibility (will be removed)
export async function getManagers() {
  // Managers are users with role 'manager' - might need separate endpoint
  return Promise.resolve([]);
}

export async function getTools() {
  return getInventory();
}

export async function getEvaluations() {
  // Evaluations might be part of reports or removed
  return Promise.resolve([]);
}
