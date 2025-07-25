// Mock authentication service
import { incubators } from "../mock/sampleData";

export type UserRole = 'director' | 'manager' | 'mentor' | 'incubator';
export interface User {
  name: string;
  email: string;
  role: UserRole;
}

let currentUser: User | null = null;

export function login(email: string, password: string): User | null {
  // Check for team login
  const team = incubators.find(
    t => t.credentials.email === email && t.credentials.password === password
  );
  if (team) {
    return {
      role: "incubator",
      teamId: team.id,
      teamName: team.teamName,
      teamLeader: team.teamLeader,
      members: team.members,
      mentor: team.mentor,
      status: team.status
    };
  }
  // Mock users
  const users: User[] = [
    { name: 'Alice Director', email: 'director@example.com', role: 'director' },
    { name: 'Bob Manager', email: 'manager@example.com', role: 'manager' },
    { name: 'Carol Mentor', email: 'mentor@example.com', role: 'mentor' },
    { name: 'Dave Incubator', email: 'incubator@example.com', role: 'incubator' },
  ];
  const user = users.find(u => u.email === email && password === 'password123');
  currentUser = user || null;
  return currentUser;
}

export function logout() {
  currentUser = null;
}

export function getCurrentUser(): User | null {
  return currentUser;
} 