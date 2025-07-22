import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';

// Mock user role (replace with context later)
const mockUser = {
  name: 'John Doe',
  role: 'manager', // Change to 'director', 'mentor', 'incubator' to test
};

const sidebarLinksByRole: Record<string, { name: string; to: string }[]> = {
  director: [
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'Reports', to: '/reports' },
    { name: 'Analytics', to: '/analytics' },
  ],
  manager: [
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'Incubators', to: '/incubators' },
    { name: 'Mentors', to: '/mentors' },
    { name: 'Requests', to: '/requests' },
    { name: 'Inventory', to: '/inventory' },
  ],
  mentor: [
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'Teams', to: '/teams' },
    { name: 'Evaluations', to: '/evaluations' },
  ],
  incubator: [
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'My Project', to: '/project' },
    { name: 'Mentor', to: '/mentor' },
    { name: 'Requests', to: '/requests' },
    { name: 'Announcements', to: '/announcements' },
  ],
};

export default function Layout() {
  const navigate = useNavigate();
  const links = sidebarLinksByRole[mockUser.role] || [];

  const handleLogout = () => {
    // Clear auth (mock)
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="h-16 flex items-center justify-center border-b">
          <span className="text-xl font-bold text-blue-600">Incubation Hub</span>
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="block px-6 py-2 rounded hover:bg-blue-50 text-blue-800 font-medium"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t text-xs text-gray-400">© 2024 University</div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white shadow flex items-center px-6 justify-between">
          <div className="text-lg font-semibold">{mockUser.role.charAt(0).toUpperCase() + mockUser.role.slice(1)} Dashboard</div>
          <div className="flex items-center space-x-4">
            {/* Placeholder for notifications */}
            <button className="relative focus:outline-none">
              <span className="material-icons text-blue-700">notifications</span>
              {/* Notification badge (mock) */}
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">2</span>
            </button>
            {/* User info */}
            <span className="text-blue-800 font-semibold">{mockUser.name}</span>
            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-700">
              {mockUser.name[0]}
            </div>
            {/* Logout */}
            <button onClick={handleLogout} className="ml-2 px-3 py-1 bg-gray-200 text-blue-700 rounded hover:bg-gray-300 font-semibold">Logout</button>
          </div>
        </header>
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Toast/notification placeholder */}
          {/* <Toast message="Welcome!" /> */}
          <Outlet />
        </main>
      </div>
    </div>
  );
} 