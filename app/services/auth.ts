// Real authentication service using backend API
import axios from 'axios';

// API Base URL - from .env file only
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Debug: Log the API base URL being used
console.log('🔧 Auth API Configuration:', {
  'VITE_API_BASE_URL from env': import.meta.env.VITE_API_BASE_URL,
  'Final API_BASE_URL': API_BASE_URL
});

// Validate that API_BASE_URL is set
if (!API_BASE_URL) {
  console.error('❌ VITE_API_BASE_URL is not set in .env file!');
  console.error('💡 Please create a .env file with: VITE_API_BASE_URL=http://encubation-backend.excellusi.com/api');
  throw new Error('VITE_API_BASE_URL is required in .env file');
}

export type UserRole = 'director' | 'manager' | 'mentor' | 'incubator';
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password_status?: 'needs_change' | 'ok';
  teamId?: string;
  teamLeader?: any;
  teamName?: string;
  members?: any[];
  mentor?: string;
  status?: string;
}

let currentUser: User | null = null;

const mapApiUser = (apiUser: any): User => ({
  id: apiUser.id,
  name: apiUser.name,
  email: apiUser.email,
  role: apiUser.role,
  password_status: apiUser.password_status,
  // Normalize possible API shapes for team info
  teamId: apiUser.teamId || apiUser.team_id || apiUser.team?.id,
  teamLeader: apiUser.teamLeader,
  teamName: apiUser.teamName || apiUser.team_name,
  members: apiUser.members,
  mentor: apiUser.mentor,
  status: apiUser.status,
});

export async function login(email: string, password: string): Promise<User> {
  const loginUrl = `${API_BASE_URL}/auth/login`;
  console.log('🔐 Attempting login:', {
    url: loginUrl,
    email: email,
    apiBaseUrl: API_BASE_URL
  });

  try {
    const response = await axios.post(loginUrl, {
      email,
      password
    });

    if (response.data.success) {
      const { token, user } = response.data.data;

      // Store token in localStorage
      localStorage.setItem('token', token);

      // Set current user
      currentUser = mapApiUser(user);

      return currentUser;
    }

    // If response is not successful, throw error
    throw new Error(response.data.message || 'Login failed');
  } catch (error: any) {
    console.error('❌ Login error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      request: error.request ? 'Request made but no response' : 'No request made',
      url: loginUrl
    });
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    // Call logout endpoint to invalidate token on server
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local data
    localStorage.removeItem('token');
    currentUser = null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const apiUser = response.data.data.user;
      currentUser = mapApiUser(apiUser);
      return currentUser;
    }

    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    localStorage.removeItem('token');
    return null;
  }
}

export async function changePassword(payload: { currentPassword?: string; newPassword: string }): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const requestBody: { current_password?: string; new_password: string } = {
    new_password: payload.newPassword
  };

  // Only include current_password if provided (for regular password changes)
  if (payload.currentPassword) {
    requestBody.current_password = payload.currentPassword;
  }

  await axios.post(`${API_BASE_URL}/auth/change-password`, requestBody, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (currentUser) {
    currentUser = { ...currentUser, password_status: 'ok' };
  }
}

export function getStoredUser(): User | null {
  return currentUser;
}
