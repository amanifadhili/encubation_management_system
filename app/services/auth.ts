// Real authentication service using backend API
import axios from 'axios';

const API_BASE_URL = 'http://encubation-backend.excellusi.com/api';

export type UserRole = 'director' | 'manager' | 'mentor' | 'incubator';
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
  teamLeader?: any;
  members?: any[];
  mentor?: string;
  status?: string;
}

let currentUser: User | null = null;

export async function login(email: string, password: string): Promise<User> {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email,
    password
  });

  if (response.data.success) {
    const { token, user } = response.data.data;

    // Store token in localStorage
    localStorage.setItem('token', token);

    // Set current user
    currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.team_id,
      // For incubator role, we might need to fetch additional team data
      // But for now, keep it simple
    };

    return currentUser;
  }

  // If response is not successful, throw error
  throw new Error(response.data.message || 'Login failed');
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
      currentUser = response.data.data.user;
      return currentUser;
    }

    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    localStorage.removeItem('token');
    return null;
  }
}

export function getStoredUser(): User | null {
  return currentUser;
}