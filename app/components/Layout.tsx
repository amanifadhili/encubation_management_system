import React, { useState, createContext, useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';

const sidebarLinksByRole: Record<string, { name: string; to: string }[]> = {
  director: [
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'Reports', to: '/reports' },
    { name: 'Analytics', to: '/analytics' },
    { name: 'Audit Trail', to: '/audit' },
    { name: 'Evaluations', to: '/evaluations' },
    { name: 'Mentors', to: '/mentors' },
    { name: 'Incubators', to: '/incubators' },
    { name: 'Inventory', to: '/inventory' },
    { name: 'Announcements', to: '/announcements' },
    { name: 'Notifications', to: '/notifications' },
    { name: 'Messaging', to: '/messaging' },
  ],
  manager: [
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'Incubators', to: '/incubators' },
    { name: 'Mentors', to: '/mentors' },
    { name: 'Material', to: '/requests' },
    { name: 'Inventory', to: '/inventory' },
    { name: 'Announcements', to: '/announcements' },
    { name: 'Evaluations', to: '/evaluations' },
    { name: 'Audit Trail', to: '/audit' },
    { name: 'Notifications', to: '/notifications' },
    { name: 'Messaging', to: '/messaging' },
    { name: 'Reports', to: '/reports' },
    { name: 'Analytics', to: '/analytics' },
  ],
  mentor: [
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'Teams', to: '/incubators' },
    { name: 'Evaluations', to: '/evaluations' },
    { name: 'Messaging', to: '/messaging' },
    { name: 'Notifications', to: '/notifications' },
  ],
  incubator: [
    { name: 'Dashboard', to: '/dashboard' },
    { name: 'Manage Team', to: '/manage-team' },
    { name: 'My Project', to: '/incubators' },
    { name: 'Mentor', to: '/mentors' },
    { name: 'Material', to: '/requests' },
    { name: 'Messaging', to: '/messaging' },
    { name: 'Announcements', to: '/announcements' },
    { name: 'Evaluations', to: '/evaluations' },
    { name: 'Notifications', to: '/notifications' },
  ],
};

// Toast context for children to trigger notifications
type ToastContextType = (msg: string, type?: 'success' | 'error' | 'info') => void;
export const ToastContext = createContext<ToastContextType>(() => {});
export const useToast = () => useContext(ToastContext);

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const links = user ? sidebarLinksByRole[user.role] : [];

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    navigate('/login');
  };

  // Responsive sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <ToastContext.Provider value={showToast}>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar (responsive) */}
        {/* Mobile Hamburger */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-white rounded-full p-2 shadow border border-blue-100"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <span className="material-icons text-blue-700 text-2xl">menu</span>
        </button>
        {/* Sidebar Drawer for mobile */}
        <div
          className={`fixed inset-0 z-40 md:static md:translate-x-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:flex md:flex-col md:w-64 bg-white shadow-md`}
          style={{ minWidth: 0 }}
        >
          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <aside className="h-full flex flex-col relative z-40 md:z-auto">
            <div className="h-16 flex items-center justify-center border-b">
              <span className="text-xl font-bold text-blue-600">Incubation Hub</span>
              {/* Close button for mobile */}
              <button
                className="md:hidden absolute right-4 top-4 text-blue-700 text-2xl"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <nav className="flex-1 py-4 overflow-y-auto">
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
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 bg-white shadow flex items-center px-4 md:px-6 justify-between sticky top-0 z-30">
            <div className="text-lg font-semibold text-blue-900 truncate">
              {user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) + ' Dashboard' : 'Dashboard'}
            </div>
            <div className="flex items-center space-x-4">
              {/* Placeholder for notifications */}
              <button className="relative focus:outline-none">
                <span className="material-icons text-blue-700">notifications</span>
                {/* Notification badge (mock) */}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">2</span>
              </button>
              {/* User info */}
              {user && (
                <span className="text-blue-800 font-semibold hidden sm:inline">
                  {user.role === 'incubator' ? (user as any).teamName : user.name}
                </span>
              )}
              {user && (
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-700">
                  {(user.role === 'incubator' ? (user as any).teamName?.[0] : user.name?.[0]) || 'U'}
                </div>
              )}
              {/* Logout */}
              <button onClick={handleLogout} className="ml-2 px-3 py-1 bg-gray-200 text-blue-700 rounded hover:bg-gray-300 font-semibold">Logout</button>
            </div>
          </header>
          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <Outlet />
          </main>
        </div>
      </div>
    </ToastContext.Provider>
  );
} 