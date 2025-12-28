/**
 * Real API service layer for connecting to backend.
 * All functions make HTTP requests to the backend API.
 */
import axios, { AxiosError } from 'axios';
import { ErrorHandler } from '../utils/errorHandler';

// Base URL for API calls - from .env file only
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


// Validate that API_BASE_URL is set
if (!API_BASE_URL) {
  console.error('❌ VITE_API_BASE_URL is not set in .env file!');
  console.error('💡 Please create a .env file with: VITE_API_BASE_URL=http://encubation-backend.excellusi.com/api');
  throw new Error('VITE_API_BASE_URL is required in .env file');
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track retry attempts to prevent infinite loops
const retryMap = new Map<string, number>();

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * Handle DELETE operations that return 204 No Content
 * @param endpoint - API endpoint
 * @returns Success indicator with status
 */
async function handleDelete(endpoint: string): Promise<{ success: boolean; status: number }> {
  const response = await api.delete(endpoint);
  // 204 has no body, 200 might have body (legacy support)
  return { 
    success: response.status === 204 || response.status === 200,
    status: response.status
  };
}

// Response interceptor with advanced error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const fullUrl = error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : 'unknown';
    console.error('❌ API Error:', {
      method: error.config?.method?.toUpperCase(),
      url: fullUrl,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      code: error.code,
      responseData: error.response?.data
    });
    const errorDetails = ErrorHandler.parse(error);
    
    // Handle 401 - Unauthorized (Session expired)
    // Only redirect to login if it's a genuine authentication failure
    // Not for permission errors or other 401 responses
    if (errorDetails.status === 401 && (
      errorDetails.message?.includes('Invalid or expired token') ||
      errorDetails.message?.includes('Access token is required') ||
      errorDetails.message?.includes('User not found')
    )) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Generate retry key for tracking attempts
    const retryKey = `${error.config?.method}-${error.config?.url}`;
    const retryCount = retryMap.get(retryKey) || 0;
    
    // Handle 429 - Rate Limiting with automatic retry (max 3 attempts)
    if (errorDetails.status === 429 && retryCount < 3) {
      retryMap.set(retryKey, retryCount + 1);
      await new Promise(resolve => 
        setTimeout(resolve, errorDetails.retryAfter || 1000)
      );
      retryMap.delete(retryKey);
      return api.request(error.config!);
    }
    
    // Handle 503 - Service Unavailable with automatic retry (max 2 attempts)
    if (errorDetails.status === 503 && retryCount < 2) {
      retryMap.set(retryKey, retryCount + 1);
      await new Promise(resolve => setTimeout(resolve, 5000));
      retryMap.delete(retryKey);
      return api.request(error.config!);
    }
    
    // Clear retry count on success or non-retryable error
    retryMap.delete(retryKey);
    
    // Attach parsed error details for use in components
    (error as any).errorDetails = errorDetails;
    
    return Promise.reject(error);
  }
);

// Teams/Incubators API
export async function getIncubators(params?: any) {
  const response = await api.get('/teams', { params });
  return response.data.success ? response.data.data.teams : response.data;
}

export async function getIncubator(id: number | string) {
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
  // Soft delete: deactivates the team
  return handleDelete(`/teams/${id}`);
}

export async function restoreTeam(id: string | number) {
  const response = await api.patch(`/teams/${id}/restore`);
  return response.data;
}

export async function getInactiveTeams(params?: any) {
  const response = await api.get('/teams/inactive', { params });
  return response.data.success ? response.data.data.teams : response.data;
}

export async function getIncubatorMembers(id: number | string) {
  const response = await api.get(`/teams/${id}/members`);
  return response.data;
}

export async function addIncubatorMember(id: number | string, data: any) {
  const response = await api.post(`/teams/${id}/members`, data);
  return response.data;
}

export async function removeIncubatorMember(id: number | string, memberId: number | string) {
  return handleDelete(`/teams/${id}/members/${memberId}`);
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
  return handleDelete(`/projects/${id}`);
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
  return handleDelete(`/projects/${id}/files/${fileId}`);
}

// Mentors API
export async function getMentors(params?: any) {
  const response = await api.get('/mentors', { params });
  return response.data.success ? response.data.data.mentors : response.data;
}

export async function getMentor(id: string) {
  const response = await api.get(`/mentors/${id}`);
  return response.data;
}

export async function createMentor(data: any) {
  const response = await api.post('/mentors', data);
  return response.data;
}

export async function updateMentor(id: string, data: any) {
  const response = await api.put(`/mentors/${id}`, data);
  return response.data;
}

export async function deleteMentor(id: string) {
  // Soft delete: deactivates the mentor's user account
  return handleDelete(`/mentors/${id}`);
}

export async function restoreMentor(id: string) {
  const response = await api.patch(`/mentors/${id}/restore`);
  return response.data;
}

export async function getInactiveMentors(params?: any) {
  const response = await api.get('/mentors/inactive', { params });
  return response.data.success ? response.data.data.mentors : response.data;
}

export async function assignMentorToTeam(mentorId: string, data: any) {
  const response = await api.post(`/mentors/${mentorId}/assign`, data);
  return response.data;
}

export async function removeMentorFromTeam(mentorId: string, teamId: string) {
  return handleDelete(`/mentors/${mentorId}/assign/${teamId}`);
}

/**
 * Get inventory items with enhanced filtering, pagination, and search
 * Supports filtering by: category, item_type, location_id, status, supplier_id
 * Supports search across: name, description, SKU, barcode, serial_number
 * Supports pagination with page and limit parameters
 */
export async function getInventory(params?: {
  category?: string;
  item_type?: string;
  location_id?: string;
  status?: string;
  supplier_id?: string;
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: any; // Allow other params for backward compatibility
}) {
  const response = await api.get('/inventory', { params });
  return response.data.success ? response.data.data.items || response.data.data : response.data;
}

/**
 * Get single inventory item by ID with all relations
 * Includes: location, supplier, assignments, maintenance_logs, consumption_logs, reservations
 */
export async function getInventoryItem(id: string | number, params?: {
  include?: string[]; // Optional: specify relations to include (defaults to all)
}) {
  const response = await api.get(`/inventory/${id}`, { 
    params: params?.include ? { include: params.include.join(',') } : {} 
  });
  return response.data.success ? response.data.data : response.data;
}

/**
 * Create new inventory item with all new fields
 * Supports: category, item_type, location, supplier, barcode, SKU, serial_number,
 * warranty info, maintenance intervals, consumable fields, etc.
 */
export async function createInventoryItem(data: {
  name: string;
  description?: string;
  category?: string;
  item_type?: string;
  sku?: string;
  barcode?: string;
  serial_number?: string;
  total_quantity?: number;
  min_stock_level?: number;
  reorder_quantity?: number;
  condition?: string;
  status?: string;
  location_id?: string;
  supplier_id?: string;
  warranty_start?: string;
  warranty_end?: string;
  warranty_provider?: string;
  maintenance_interval?: number;
  purchase_date?: string;
  expiration_date?: string;
  batch_number?: string;
  is_frequently_distributed?: boolean;
  distribution_unit?: string;
  typical_consumption_rate?: number;
  tags?: string[];
  custom_fields?: any;
  notes?: string;
  [key: string]: any; // Allow other fields for backward compatibility
}) {
  const response = await api.post('/inventory', data);
  return response.data;
}

/**
 * Update inventory item with all new fields
 * Supports updating all fields including: category, item_type, location, supplier,
 * barcode, quantities, status, warranty, maintenance, etc.
 */
export async function updateInventoryItem(id: string | number, data: {
  name?: string;
  description?: string;
  category?: string;
  item_type?: string;
  sku?: string;
  barcode?: string;
  serial_number?: string;
  total_quantity?: number;
  available_quantity?: number;
  min_stock_level?: number;
  reorder_quantity?: number;
  condition?: string;
  status?: string;
  location_id?: string;
  supplier_id?: string;
  warranty_start?: string;
  warranty_end?: string;
  warranty_provider?: string;
  maintenance_interval?: number;
  last_maintenance?: string;
  next_maintenance?: string;
  purchase_date?: string;
  expiration_date?: string;
  batch_number?: string;
  is_frequently_distributed?: boolean;
  distribution_unit?: string;
  typical_consumption_rate?: number;
  tags?: string[];
  custom_fields?: any;
  notes?: string;
  [key: string]: any; // Allow other fields for backward compatibility
}) {
  const response = await api.put(`/inventory/${id}`, data);
  return response.data;
}

/**
 * Delete inventory item with validation
 * Backend validates that item can be safely deleted (no active assignments, etc.)
 */
export async function deleteInventoryItem(id: string | number) {
  return handleDelete(`/inventory/${id}`);
}

export async function assignInventoryToTeam(itemId: string | number, data: {
  team_id: string;
  quantity: number;
  expected_return?: string;
  notes?: string;
  [key: string]: any; // Allow other fields for backward compatibility
}) {
  const response = await api.post(`/inventory/${itemId}/assign`, data);
  return response.data;
}

export async function unassignInventoryFromTeam(itemId: string | number, teamId: string | number) {
  return handleDelete(`/inventory/${itemId}/assign/${teamId}`);
}

// Material Requests API (Enhanced with new features)
export async function getRequests(params?: {
  status?: string;
  priority?: string;
  team_id?: string;
  requested_by?: string;
  delivery_status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any; // Allow other params for backward compatibility
}) {
  const response = await api.get('/requests', { params });
  return response.data.success ? response.data.data.requests || response.data.data : response.data;
}

export async function getRequest(id: string | number) {
  const response = await api.get(`/requests/${id}`);
  return response.data.success ? response.data.data : response.data;
}

export async function createRequest(data: {
  title: string;
  description?: string;
  team_id?: string;
  project_id?: string;
  priority?: string;
  urgency_reason?: string;
  required_by?: string;
  is_consumable_request?: boolean;
  requires_quick_approval?: boolean;
  delivery_address?: string;
  delivery_notes?: string;
  expected_delivery?: string;
  notes?: string;
  approval_chain?: string[];
  items: Array<{
    inventory_item_id?: string;
    item_name?: string;
    quantity: number;
    unit?: string;
    is_consumable?: boolean;
    notes?: string;
  }>;
  [key: string]: any; // Allow other fields for backward compatibility
}) {
  const response = await api.post('/requests', data);
  return response.data;
}

export async function updateRequestStatus(id: string | number, data: {
  status: string;
  notes?: string;
  [key: string]: any; // Allow other fields for backward compatibility
}) {
  const response = await api.put(`/requests/${id}/status`, data);
  return response.data;
}

export async function deleteRequest(id: string | number) {
  return handleDelete(`/requests/${id}`);
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
  return handleDelete(`/announcements/${id}`);
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

export async function updateNotification(id: number, data: any) {
  const response = await api.put(`/notifications/${id}`, data);
  return response.data;
}

export async function markNotificationAsRead(id: number) {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
}

export async function deleteNotification(id: number) {
  return handleDelete(`/notifications/${id}`);
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

export async function getGeneralReport(params?: any) {
  const response = await api.get('/reports/general', { params });
  return response.data;
}

export async function getCompanyReport(teamId: string) {
  const response = await api.get(`/reports/company/${teamId}`);
  return response.data;
}

export async function getAdvancedReports(params?: any) {
  const response = await api.get('/reports/advanced', { params });
  return response.data.success ? response.data.data : response.data;
}

export async function getTimeSeriesAnalytics(params?: any) {
  const response = await api.get('/reports/time-series', { params });
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

// System Metrics API
export async function getSystemMetrics() {
  const response = await api.get('/reports/system-metrics');
  return response.data.success ? response.data.data : response.data;
}

// Cross-entity Analytics API
export async function getCrossEntityAnalytics() {
  const response = await api.get('/reports/cross-entity');
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

export async function getConversation(id: string) {
  const response = await api.get(`/conversations/${id}`);
  return response.data.success ? response.data.data.conversation : response.data;
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
  // Handle different response formats
  const data = response.data;
  
  // If response is directly an array
  if (Array.isArray(data)) {
    return data;
  }
  
  // If response has success and data structure
  if (data.success && data.data) {
    // Could be array or object with users property
    return Array.isArray(data.data) ? data.data : (data.data.users || data.data);
  }
  
  // If response has data property
  if (data.data) {
    return Array.isArray(data.data) ? data.data : (data.data.users || data.data);
  }
  
  // If response has users property
  if (Array.isArray(data.users)) {
    return data.users;
  }
  
  // Fallback: return data as-is
  return data;
}

export async function getUser(id: string) {
  const response = await api.get(`/users/${id}`);
  return response.data.success ? response.data.data : response.data;
}

export async function createUser(data: any) {
  const response = await api.post('/users', data);
  return response.data;
}

export async function updateUser(id: string, data: any) {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
}

export async function deleteUser(id: string) {
  // Soft delete (deactivate) user – backend marks user as inactive
  return handleDelete(`/users/${id}`);
}

export async function getInactiveUsers() {
  const response = await api.get('/users/inactive');
  return response.data;
}

export async function restoreUser(id: string) {
  const response = await api.patch(`/users/${id}/restore`);
  return response.data;
}

// Profile API
export async function getProfile() {
  const response = await api.get('/users/profile');
  return response.data;
}

export async function updateProfile(data: any) {
  const response = await api.put('/users/profile', data);
  return response.data;
}

// Extended Profile API - New phased profile system
export async function getExtendedProfile() {
  const response = await api.get('/users/profile/extended');
  return response.data;
}

export async function getProfileCompletion() {
  const response = await api.get('/users/profile/completion');
  return response.data;
}

export async function getProfilePhase(phaseNumber: number) {
  const response = await api.get(`/users/profile/phase/${phaseNumber}`);
  return response.data;
}

// Phase-specific update functions
export async function updateProfilePhase1(data: {
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone: string;
  profile_photo_url?: string;
}) {
  const response = await api.put('/users/profile/phase1', data);
  return response.data;
}

export async function updateProfilePhase2(data: {
  enrollment_status: string;
  major_program: string;
  program_of_study: string;
  graduation_year: number;
}) {
  const response = await api.put('/users/profile/phase2', data);
  return response.data;
}

export async function updateProfilePhase3(data: {
  current_role: string;
  skills: string[];
  support_interests: string[];
}) {
  const response = await api.put('/users/profile/phase3', data);
  return response.data;
}

export async function updateProfilePhase5(data: {
  additional_notes?: string;
}) {
  const response = await api.put('/users/profile/phase5', data);
  return response.data;
}

export async function uploadProfilePhoto(profile_photo_url: string) {
  const response = await api.put('/users/profile/photo', { profile_photo_url });
  return response.data;
}

// Email Preferences API
export async function getEmailPreferences() {
  const response = await api.get('/email-preferences');
  return response.data.success ? response.data.data.preferences : response.data;
}

export async function updateEmailPreferences(data: any) {
  const response = await api.put('/email-preferences', data);
  return response.data.success ? response.data.data.preferences : response.data;
}

export async function getEmailStatistics(startDate?: string, endDate?: string) {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get('/email/statistics', { params });
  return response.data;
}

export async function verifyEmailConnection() {
  const response = await api.get('/email/verify');
  return response.data;
}

export async function clearEmailCache() {
  const response = await api.post('/email/clear-cache');
  return response.data;
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

// CSV export for general report
export async function exportGeneralReportCsv(params?: any) {
  return api.get("/reports/general", {
    params: { ...params, export: "csv" },
    responseType: "blob",
  });
}

// ============================================================================
// PHASE 1: Enhanced Inventory & Material Request System API Functions
// ============================================================================

// ----------------------------------------------------------------------------
// 1.1 Enhanced Inventory API Functions
// ----------------------------------------------------------------------------

// Enhanced inventory helper functions (aliases for clarity)
/**
 * Get single inventory item by ID with all relations (alias for getInventoryItem)
 */
export const getInventoryItemById = getInventoryItem;

/**
 * Get inventory items by category
 */
export async function getInventoryByCategory(category: string, params?: any) {
  const response = await api.get('/inventory', { params: { category, ...params } });
  return response.data.success ? response.data.data.items || response.data.data : response.data;
}

/**
 * Get inventory items by location
 */
export async function getInventoryByLocation(locationId: string, params?: any) {
  const response = await api.get('/inventory', { params: { location_id: locationId, ...params } });
  return response.data.success ? response.data.data.items || response.data.data : response.data;
}

/**
 * Get inventory items by status
 */
export async function getInventoryByStatus(status: string, params?: any) {
  const response = await api.get('/inventory', { params: { status, ...params } });
  return response.data.success ? response.data.data.items || response.data.data : response.data;
}

/**
 * Search inventory items (across name, description, SKU, barcode, serial number)
 */
export async function searchInventory(query: string, params?: any) {
  const response = await api.get('/inventory', { params: { search: query, ...params } });
  return response.data.success ? response.data.data.items || response.data.data : response.data;
}

/**
 * Get inventory item assignments
 */
export async function getInventoryItemAssignments(id: string | number) {
  const response = await api.get(`/inventory/${id}/assignments`);
  return response.data.success ? response.data.data : response.data;
}

// ----------------------------------------------------------------------------
// 1.2 Location API Functions
// ----------------------------------------------------------------------------

/**
 * Get all storage locations
 */
export async function getAllLocations(params?: any) {
  const response = await api.get('/locations', { params });
  return response.data.success ? response.data.data.locations || response.data.data : response.data;
}

/**
 * Get location hierarchy (tree structure)
 */
export async function getLocationHierarchy() {
  const response = await api.get('/locations/hierarchy');
  return response.data.success ? response.data.data : response.data;
}

/**
 * Get location by ID with hierarchy information
 */
export async function getLocationById(id: string | number) {
  const response = await api.get(`/locations/${id}`);
  return response.data.success ? response.data.data : response.data;
}

/**
 * Create new storage location
 */
export async function createLocation(data: {
  name: string;
  building?: string;
  floor?: string;
  room?: string;
  shelf?: string;
  bin?: string;
  parent_location_id?: string;
}) {
  const response = await api.post('/locations', data);
  return response.data;
}

/**
 * Update storage location
 */
export async function updateLocation(id: string | number, data: Partial<{
  name: string;
  building: string;
  floor: string;
  room: string;
  shelf: string;
  bin: string;
  parent_location_id: string;
}>) {
  const response = await api.put(`/locations/${id}`, data);
  return response.data;
}

/**
 * Delete storage location (with validation)
 */
export async function deleteLocation(id: string | number) {
  return handleDelete(`/locations/${id}`);
}

// ----------------------------------------------------------------------------
// 1.3 Supplier API Functions
// ----------------------------------------------------------------------------

/**
 * Get all suppliers
 */
export async function getAllSuppliers(params?: any) {
  const response = await api.get('/suppliers', { params });
  return response.data.success ? response.data.data.suppliers || response.data.data : response.data;
}

/**
 * Get supplier by ID
 */
export async function getSupplierById(id: string | number) {
  const response = await api.get(`/suppliers/${id}`);
  return response.data.success ? response.data.data : response.data;
}

/**
 * Create new supplier
 */
export async function createSupplier(data: {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  rating?: number;
  notes?: string;
}) {
  const response = await api.post('/suppliers', data);
  return response.data;
}

/**
 * Update supplier
 */
export async function updateSupplier(id: string | number, data: Partial<{
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
  notes: string;
}>) {
  const response = await api.put(`/suppliers/${id}`, data);
  return response.data;
}

/**
 * Delete supplier (with validation)
 */
export async function deleteSupplier(id: string | number) {
  return handleDelete(`/suppliers/${id}`);
}

// ----------------------------------------------------------------------------
// 1.4 Reservation API Functions
// ----------------------------------------------------------------------------

/**
 * Get all reservations with filters
 */
export async function getAllReservations(params?: {
  item_id?: string;
  team_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get('/reservations', { params });
  return response.data.success ? response.data.data.reservations || response.data.data : response.data;
}

/**
 * Get reservation by ID
 */
export async function getReservationById(id: string | number) {
  const response = await api.get(`/reservations/${id}`);
  return response.data.success ? response.data.data : response.data;
}

/**
 * Create new reservation
 */
export async function createReservation(data: {
  item_id: string;
  team_id: string;
  quantity: number;
  reserved_until: string;
  notes?: string;
}) {
  const response = await api.post('/reservations', data);
  return response.data;
}

/**
 * Update reservation
 */
export async function updateReservation(id: string | number, data: Partial<{
  item_id: string;
  team_id: string;
  quantity: number;
  reserved_until: string;
  status: string;
  notes: string;
}>) {
  const response = await api.put(`/reservations/${id}`, data);
  return response.data;
}

/**
 * Cancel reservation
 */
export async function cancelReservation(id: string | number, reason?: string) {
  const response = await api.patch(`/reservations/${id}/cancel`, { reason });
  return response.data;
}

/**
 * Confirm reservation (convert to assignment)
 */
export async function confirmReservation(id: string | number) {
  const response = await api.patch(`/reservations/${id}/confirm`);
  return response.data;
}

/**
 * Delete reservation
 */
export async function deleteReservation(id: string | number) {
  return handleDelete(`/reservations/${id}`);
}

// ----------------------------------------------------------------------------
// 1.5 Maintenance API Functions
// ----------------------------------------------------------------------------

/**
 * Get all maintenance logs
 */
export async function getAllMaintenanceLogs(params?: {
  item_id?: string;
  maintenance_type?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get('/maintenance', { params });
  return response.data.success ? response.data.data.logs || response.data.data : response.data;
}

/**
 * Get upcoming maintenance (items needing maintenance soon)
 */
export async function getUpcomingMaintenance(params?: {
  days_ahead?: number;
  page?: number;
  limit?: number;
}) {
  const response = await api.get('/maintenance/upcoming', { params });
  return response.data.success ? response.data.data : response.data;
}

/**
 * Get items due for maintenance
 */
export async function getItemsDueForMaintenance(params?: {
  overdue_only?: boolean;
  days_ahead?: number;
}) {
  const response = await api.get('/maintenance/due', { params });
  return response.data.success ? response.data.data : response.data;
}

/**
 * Get maintenance log by ID
 */
export async function getMaintenanceLogById(id: string | number) {
  const response = await api.get(`/maintenance/${id}`);
  return response.data.success ? response.data.data : response.data;
}

/**
 * Create maintenance log
 */
export async function createMaintenanceLog(data: {
  item_id: string;
  maintenance_type: string;
  performed_by?: string;
  performed_at: string;
  notes?: string;
  next_maintenance?: string;
}) {
  const response = await api.post('/maintenance', data);
  return response.data;
}

/**
 * Update maintenance log
 */
export async function updateMaintenanceLog(id: string | number, data: Partial<{
  item_id: string;
  maintenance_type: string;
  performed_by: string;
  performed_at: string;
  notes: string;
  next_maintenance: string;
}>) {
  const response = await api.put(`/maintenance/${id}`, data);
  return response.data;
}

/**
 * Delete maintenance log
 */
export async function deleteMaintenanceLog(id: string | number) {
  return handleDelete(`/maintenance/${id}`);
}

/**
 * Auto-schedule next maintenance for items with maintenance intervals
 */
export async function autoScheduleMaintenance(data?: {
  item_ids?: string[];
  force_update?: boolean;
}) {
  const response = await api.post('/maintenance/auto-schedule', data || {});
  return response.data;
}

// ----------------------------------------------------------------------------
// 1.6 Barcode/QR Code API Functions
// ----------------------------------------------------------------------------

/**
 * Generate barcode for an item
 */
export async function generateBarcode(itemId: string | number) {
  const response = await api.post(`/barcode/item/${itemId}/generate`);
  return response.data;
}

/**
 * Scan barcode/QR code to lookup item
 */
export async function scanBarcode(barcode: string) {
  const response = await api.post('/barcode/scan', { barcode });
  return response.data;
}

/**
 * Get QR code data for an item
 */
export async function getQRCodeData(itemId: string | number) {
  const response = await api.get(`/barcode/item/${itemId}/qr`);
  return response.data;
}

/**
 * Bulk generate barcodes for items without barcodes
 */
export async function bulkGenerateBarcodes(data?: {
  item_ids?: string[];
  generate_for_all?: boolean;
}) {
  const response = await api.post('/barcode/bulk-generate', data || {});
  return response.data;
}

// ----------------------------------------------------------------------------
// 1.7 Consumption API Functions
// ----------------------------------------------------------------------------

/**
 * Get all consumption logs with filters
 */
export async function getAllConsumptionLogs(params?: {
  item_id?: string;
  team_id?: string;
  distributed_by?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get('/consumption', { params });
  return response.data.success ? response.data.data.logs || response.data.data : response.data;
}

/**
 * Get consumption log by ID
 */
export async function getConsumptionLogById(id: string | number) {
  const response = await api.get(`/consumption/${id}`);
  return response.data.success ? response.data.data : response.data;
}

/**
 * Create consumption log (log consumption/distribution)
 */
export async function createConsumptionLog(data: {
  item_id: string;
  quantity: number;
  consumption_type: string;
  consumption_date: string;
  distributed_to?: string;
  team_id?: string;
  distributed_by?: string;
  event_type?: string;
  notes?: string;
}) {
  const response = await api.post('/consumption', data);
  return response.data;
}

/**
 * Update consumption log
 */
export async function updateConsumptionLog(id: string | number, data: Partial<{
  item_id: string;
  quantity: number;
  consumption_type: string;
  consumption_date: string;
  distributed_to: string;
  team_id: string;
  distributed_by: string;
  event_type: string;
  notes: string;
}>) {
  const response = await api.put(`/consumption/${id}`, data);
  return response.data;
}

/**
 * Delete consumption log
 */
export async function deleteConsumptionLog(id: string | number) {
  return handleDelete(`/consumption/${id}`);
}

/**
 * Get consumption statistics for an item
 */
export async function getItemConsumptionStats(itemId: string | number, params?: {
  start_date?: string;
  end_date?: string;
  period?: string;
}) {
  const response = await api.get(`/consumption/stats/${itemId}`, { params });
  return response.data.success ? response.data.data : response.data;
}

// ----------------------------------------------------------------------------
// 1.8 Assignment API Functions (Enhanced)
// ----------------------------------------------------------------------------

/**
 * Get item assignments for a specific item
 */
export async function getItemAssignments(itemId: string | number) {
  const response = await api.get(`/inventory/${itemId}/assignments`);
  return response.data.success ? response.data.data.assignments || response.data.data : response.data;
}

/**
 * Get team assignments for a specific team (if endpoint exists)
 */
export async function getTeamAssignments(teamId: string | number, params?: any) {
  // This endpoint may need to be added to backend or use existing inventory endpoint with team filter
  const response = await api.get('/inventory', { params: { assigned_to_team: teamId, ...params } });
  return response.data.success ? response.data.data.items || response.data.data : response.data;
}

// ----------------------------------------------------------------------------
// 1.9 Enhanced Material Request API Functions
// ----------------------------------------------------------------------------

// Enhanced request helper functions (aliases for clarity)
/**
 * Get request by ID with all relations (alias for getRequest)
 */
export const getRequestById = getRequest;

/**
 * Get all requests with enhanced filters (alias for getRequests)
 */
export const getAllRequests = getRequests;

/**
 * Get requests for a specific team
 */
export async function getTeamRequests(teamId: string | number, params?: any) {
  const response = await api.get(`/requests/team/${teamId}`, { params });
  return response.data.success ? response.data.data.requests || response.data.data : response.data;
}

/**
 * Update request
 */
export async function updateRequest(id: string | number, data: Partial<{
  title: string;
  description: string;
  priority: string;
  urgency_reason: string;
  required_by: string;
  delivery_address: string;
  delivery_notes: string;
  expected_delivery: string;
  notes: string;
  items: any[];
}>) {
  // Note: Backend may need an update endpoint or use status update
  const response = await api.put(`/requests/${id}`, data);
  return response.data;
}

/**
 * Submit draft request (change status to submitted/pending_review)
 */
export async function submitRequest(id: string | number, data?: {
  notes?: string;
}) {
  const response = await api.post(`/requests/${id}/submit`, data || {});
  return response.data;
}

/**
 * Cancel request
 */
export async function cancelRequest(id: string | number, data: {
  reason?: string;
  notes?: string;
}) {
  const response = await api.post(`/requests/${id}/cancel`, data);
  return response.data;
}

/**
 * Approve request at a specific approval level
 */
export async function approveRequest(id: string | number, data: {
  approval_level?: number;
  comments?: string;
  is_internal?: boolean;
}) {
  const response = await api.post(`/requests/${id}/approve`, data);
  return response.data;
}

/**
 * Decline request at a specific approval level
 */
export async function declineRequest(id: string | number, data: {
  approval_level?: number;
  comments?: string;
  reason?: string;
  is_internal?: boolean;
}) {
  const response = await api.post(`/requests/${id}/decline`, data);
  return response.data;
}

/**
 * Delegate approval to another user
 */
export async function delegateApproval(id: string | number, data: {
  approval_level?: number;
  delegate_to: string;
  comments?: string;
  is_internal?: boolean;
}) {
  const response = await api.post(`/requests/${id}/delegate`, data);
  return response.data;
}

/**
 * Update delivery status and confirm delivery
 */
export async function updateDeliveryStatus(id: string | number, data: {
  delivery_status: string;
  delivery_notes?: string;
  expected_delivery?: string;
}) {
  const response = await api.put(`/requests/${id}/delivery`, data);
  return response.data;
}

/**
 * Get request comments
 */
export async function getRequestComments(id: string | number) {
  const response = await api.get(`/requests/${id}/comments`);
  return response.data.success ? response.data.data.comments || response.data.data : response.data;
}

/**
 * Add comment to request
 */
export async function addRequestComment(id: string | number, data: {
  comment: string;
  is_internal?: boolean;
}) {
  const response = await api.post(`/requests/${id}/comments`, data);
  return response.data;
}

/**
 * Update request comment
 */
export async function updateRequestComment(id: string | number, commentId: string | number, data: {
  comment: string;
}) {
  const response = await api.put(`/requests/${id}/comments/${commentId}`, data);
  return response.data;
}

/**
 * Delete request comment
 */
export async function deleteRequestComment(id: string | number, commentId: string | number) {
  return handleDelete(`/requests/${id}/comments/${commentId}`);
}

/**
 * Get request history/audit trail (via request detail endpoint includes history)
 */
export async function getRequestHistory(id: string | number) {
  // History is typically included in getRequestById, but if separate endpoint exists:
  const response = await api.get(`/requests/${id}`);
  return response.data.success ? response.data.data.history || [] : [];
}

// ----------------------------------------------------------------------------
// 1.10 Request Template API Functions
// ----------------------------------------------------------------------------

/**
 * Get all request templates
 */
export async function getAllRequestTemplates(params?: {
  category?: string;
  is_public?: boolean;
  created_by?: string;
}) {
  const response = await api.get('/request-templates', { params });
  return response.data.success ? response.data.data.templates || response.data.data : response.data;
}

/**
 * Get request template by ID
 */
export async function getRequestTemplateById(id: string | number) {
  const response = await api.get(`/request-templates/${id}`);
  return response.data.success ? response.data.data : response.data;
}

/**
 * Create request template
 */
export async function createRequestTemplate(data: {
  name: string;
  description?: string;
  category?: string;
  is_public?: boolean;
  items: Array<{
    inventory_item_id?: string;
    item_name: string;
    quantity: number;
    unit?: string;
    is_consumable?: boolean;
  }>;
}) {
  const response = await api.post('/request-templates', data);
  return response.data;
}

/**
 * Update request template
 */
export async function updateRequestTemplate(id: string | number, data: Partial<{
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  items: any[];
}>) {
  const response = await api.put(`/request-templates/${id}`, data);
  return response.data;
}

/**
 * Delete request template
 */
export async function deleteRequestTemplate(id: string | number) {
  return handleDelete(`/request-templates/${id}`);
}

/**
 * Create request from template
 */
export async function createRequestFromTemplate(templateId: string | number, data?: {
  team_id?: string;
  project_id?: string;
  priority?: string;
  required_by?: string;
  delivery_address?: string;
  delivery_notes?: string;
  notes?: string;
  override_items?: any[];
}) {
  const response = await api.post(`/request-templates/${templateId}/create-request`, data || {});
  return response.data;
}

// ----------------------------------------------------------------------------
// 1.11 Enhanced Reporting & Analytics API Functions
// ----------------------------------------------------------------------------

/**
 * Get usage analytics: Most used items, utilization rates
 */
export async function getUsageAnalytics(params?: {
  period?: string;
  start_date?: string;
  end_date?: string;
  category?: string;
}) {
  const response = await api.get('/reports/usage-analytics', { params });
  return response.data.success ? response.data.data : response.data;
}

/**
 * Get assignment trends: Assignment patterns over time
 */
export async function getAssignmentTrends(params?: {
  period?: string;
  start_date?: string;
  end_date?: string;
  item_id?: string;
  team_id?: string;
}) {
  const response = await api.get('/reports/assignment-trends', { params });
  return response.data.success ? response.data.data : response.data;
}

/**
 * Get low stock alerts
 */
export async function getLowStockAlerts(params?: {
  category?: string;
  supplier_id?: string;
  include_out_of_stock?: boolean;
}) {
  const response = await api.get('/reports/low-stock-alerts', { params });
  return response.data.success ? response.data.data : response.data;
}

/**
 * Get utilization reports: Item usage efficiency
 */
export async function getUtilizationReports(params?: {
  category?: string;
  utilization_rate_min?: number;
  utilization_rate_max?: number;
  period?: string;
}) {
  const response = await api.get('/reports/utilization', { params });
  return response.data.success ? response.data.data : response.data;
}

/**
 * Get consumption reports: Track refreshments and consumables usage
 */
export async function getConsumptionReports(params?: {
  item_id?: string;
  team_id?: string;
  start_date?: string;
  end_date?: string;
  period?: string;
  event_type?: string;
}) {
  const response = await api.get('/reports/consumption', { params });
  return response.data.success ? response.data.data : response.data;
}

/**
 * Get distribution reports: Who received what and when
 */
export async function getDistributionReports(params?: {
  item_id?: string;
  team_id?: string;
  distributed_by?: string;
  start_date?: string;
  end_date?: string;
  event_type?: string;
}) {
  const response = await api.get('/reports/distribution', { params });
  return response.data.success ? response.data.data : response.data;
}

/**
 * Get replenishment forecasting: Predict when to reorder based on consumption patterns
 */
export async function getReplenishmentForecasting(params?: {
  item_id?: string;
  category?: string;
  lookback_days?: number;
  forecast_days?: number;
}) {
  const response = await api.get('/reports/replenishment-forecasting', { params });
  return response.data.success ? response.data.data : response.data;
}

/**
 * Get usage pattern analysis: Time-series consumption patterns
 */
export async function getUsagePatternAnalysis(params?: {
  item_id?: string;
  team_id?: string;
  period?: string;
  start_date?: string;
  end_date?: string;
  aggregation?: string;
}) {
  const response = await api.get('/reports/usage-patterns', { params });
  return response.data.success ? response.data.data : response.data;
}

/**
 * Auto-create replenishment requests for low stock items
 */
export async function autoCreateReplenishmentRequests(data?: {
  dry_run?: boolean;
  team_id?: string;
  category?: string;
  min_stock_threshold?: number;
}) {
  const response = await api.post('/reports/auto-replenishment', data || {});
  return response.data;
}

/**
 * Get request analytics: Request patterns, approval times, status breakdown
 */
export async function getRequestAnalytics(params?: {
  period?: string;
  start_date?: string;
  end_date?: string;
  team_id?: string;
  priority?: string;
  status?: string;
}) {
  const response = await api.get('/reports/request-analytics', { params });
  return response.data.success ? response.data.data : response.data;
}

/**
 * Get comprehensive usage analytics combining inventory, requests, and consumption
 */
export async function getComprehensiveUsageAnalytics(params?: {
  period?: string;
  start_date?: string;
  end_date?: string;
  category?: string;
  team_id?: string;
}) {
  const response = await api.get('/reports/comprehensive-usage', { params });
  return response.data.success ? response.data.data : response.data;
}

// ----------------------------------------------------------------------------
// Note: Legacy functions (getInventory, getInventoryItem, etc.) are maintained
// above for backward compatibility. New enhanced functions (getInventoryItems,
// getInventoryItemById, etc.) provide additional features and better typing.
// ----------------------------------------------------------------------------
