import React, { useState, createContext, useContext, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Toast from "./Toast";
import type { ToastType } from "./Toast";
import { getNotifications, getIncubator } from "../services/api";
import { useToastManager } from "../hooks/useToast";
import { OfflineBanner } from "./OfflineBanner";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { ButtonLoader } from "./loading";
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  FolderIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CubeIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type NavItem = { name: string; to?: string; children?: { name: string; to: string }[] };

// Icon mapping for navigation items
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Dashboard: HomeIcon,
  Users: UsersIcon,
  Reports: ChartBarIcon,
  Projects: FolderIcon,
  Mentors: AcademicCapIcon,
  Incubators: BuildingOfficeIcon,
  Teams: BuildingOfficeIcon,
  Inventory: CubeIcon,
  Announcements: MegaphoneIcon,
  Messaging: ChatBubbleLeftRightIcon,
  Notifications: BellIcon,
  Profile: UserCircleIcon,
  "Manage Team": UsersIcon,
  Mentor: AcademicCapIcon,
  Material: CubeIcon,
};

const sidebarLinksByRole: Record<string, NavItem[]> = {
  director: [
    { name: "Dashboard", to: "/dashboard" },
    { name: "Users", to: "/users" },
    {
      name: "Reports",
      children: [
        { name: "General", to: "/reports" },
        { name: "Mentors", to: "/mentors" },
        { name: "Projects", to: "/projects" },
        { name: "Material", to: "/requests" },
        { name: "Teams", to: "/teams" },
      ],
    },
    { name: "Projects", to: "/projects" },
    { name: "Mentors", to: "/mentors" },
    { name: "Teams", to: "/teams" },
    { name: "Material", to: "/requests" },
    { name: "Inventory", to: "/inventory" },
    { name: "Announcements", to: "/announcements" },
    { name: "Notifications", to: "/notifications" },
    { name: "Messaging", to: "/messaging" },
    { name: "Profile", to: "/profile" },
  ],
  manager: [
    { name: "Dashboard", to: "/dashboard" },
    { name: "Teams", to: "/teams" },
    { name: "Mentors", to: "/mentors" },
    { name: "Projects", to: "/projects" },
    { name: "Material", to: "/requests" },
    { name: "Inventory", to: "/inventory" },
    { name: "Announcements", to: "/announcements" },
    { name: "Notifications", to: "/notifications" },
    { name: "Messaging", to: "/messaging" },
    {
      name: "Reports",
      children: [
        { name: "General", to: "/reports" },
        { name: "Mentors", to: "/mentors" },
        { name: "Projects", to: "/projects" },
        { name: "Material", to: "/requests" },
        { name: "Teams", to: "/teams" },
      ],
    },
    { name: "Profile", to: "/profile" },
  ],
  mentor: [
    { name: "Dashboard", to: "/dashboard" },
    { name: "Teams", to: "/teams" },
    { name: "Projects", to: "/projects" },
    { name: "Messaging", to: "/messaging" },
    { name: "Profile", to: "/profile" },
  ],
  incubator: [
    { name: "Dashboard", to: "/dashboard" },
    { name: "Manage Team", to: "/manage-team" },
    { name: "Projects", to: "/projects" },
    { name: "Mentor", to: "/mentors" },
    { name: "Material", to: "/requests" },
    { name: "Messaging", to: "/messaging" },
    { name: "Announcements", to: "/announcements" },
    { name: "Notifications", to: "/notifications" },
    { name: "Profile", to: "/profile" },
  ],
};

// Toast context for children to trigger notifications
type ToastContextType = (
  message: string,
  type?: ToastType,
  options?: {
    duration?: number;
    action?: { label: string; onClick: () => void };
  }
) => void;
export const ToastContext = createContext<ToastContextType>(() => {});
export const useToast = () => useContext(ToastContext);

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const links = user ? sidebarLinksByRole[user.role] : [];
  const [teamName, setTeamName] = useState<string | null>(null);

  // Enhanced Toast system with multiple toasts
  const { toasts, showToast, removeToast } = useToastManager();

  // Online/offline status monitoring
  useOnlineStatus({
    onOnline: () => {
      showToast("Connection restored!", "success");
    },
    onOffline: () => {
      showToast("You are offline. Some features may be unavailable.", "error", {
        duration: 5000,
      });
    },
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Simulate logout delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));
      logout();
      showToast("Logged out successfully", "success");
      navigate("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  // Responsive sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notifications state for unread count
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Load notifications for unread count
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Load team name for incubators to show in navbar
  useEffect(() => {
    const loadTeamName = async () => {
      if (user?.role === "incubator" && (user as any).teamId) {
        try {
          const res = await getIncubator((user as any).teamId);
          const data = res?.data?.team || res?.data || res;
          setTeamName(data?.team_name || data?.teamName || null);
        } catch (error) {
          console.error("Failed to load team name:", error);
          setTeamName(null);
        }
      } else {
        setTeamName(null);
      }
    };
    loadTeamName();
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    }
  };

  // Unread notification badge logic
  const unreadCount = notifications.filter((n) => !n.read_status).length;

  const isActiveLink = (link: NavItem) => {
    if (link.to) {
      return location.pathname === link.to;
    }
    if (link.children) {
      return link.children.some((child) => location.pathname === child.to);
    }
    return false;
  };

  return (
    <ToastContext.Provider value={showToast}>
      {/* Offline Banner - Fixed at top */}
      <OfflineBanner
        position="top"
        showReconnected={true}
        reconnectedDuration={3000}
      />

      <div className="flex h-screen bg-gray-50">
        {/* Sidebar (responsive) */}
        {/* Mobile Hamburger */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-white rounded-xl p-2.5 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Bars3Icon className="w-6 h-6 text-gray-700" />
        </button>
        {/* Sidebar Drawer for mobile */}
        <div
          className={`fixed inset-0 z-40 md:static md:translate-x-0 transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:relative md:flex md:flex-col md:w-64 bg-white shadow-lg border-r border-gray-200`}
          style={{ minWidth: 0 }}
        >
          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <aside 
            id="sidebar-navigation"
            className="h-full flex flex-col relative z-40 md:z-auto"
            aria-label="Main navigation"
          >
            {/* Logo/Brand */}
            <div className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white text-lg font-bold">IH</span>
                </div>
                <span className="text-lg font-bold text-gray-900 hidden sm:block">
                  Incubation Hub
                </span>
              </div>
              {/* Close button for mobile */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
                aria-expanded={sidebarOpen}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto" aria-label="Main navigation">
              <ul className="space-y-1 px-2 sm:px-3" role="list">
                {links.map((link) => {
                  const active = isActiveLink(link);
                  const Icon = iconMap[link.name] || HomeIcon;

                  if (link.children && link.children.length > 0) {
                    const open = openDropdown === link.name;
                    return (
                      <li key={link.name}>
                        <button
                          type="button"
                          className={`
                            group relative flex items-center gap-3 w-full px-3 sm:px-4 py-2.5 rounded-xl
                            transition-all duration-200 text-sm sm:text-base font-medium
                            min-h-[44px]
                            ${active || open
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'
                            }
                          `}
                          onClick={() => setOpenDropdown(open ? null : link.name)}
                          aria-expanded={open}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${active || open ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
                          <span className="truncate">{link.name}</span>
                          <ChevronDownIcon
                            className={`w-4 h-4 ml-auto transition-transform ${open ? 'rotate-180' : ''} ${active || open ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`}
                          />
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 sm:h-8 bg-white rounded-r-full" />
                          )}
                        </button>
                        {open && (
                          <ul className="mt-1 ml-10 space-y-1">
                            {link.children.map((child) => {
                              const childActive = location.pathname === child.to;
                              return (
                                <li key={child.to}>
                                  <Link
                                    to={child.to}
                                    className={`
                                      block px-3 py-2 rounded-lg text-sm transition-colors
                                      ${childActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}
                                    `}
                                    onClick={() => {
                                      setSidebarOpen(false);
                                      setOpenDropdown(null);
                                    }}
                                  >
                                    {child.name}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  }

                  return (
                    <li key={link.to}>
                      <Link
                        to={link.to || "#"}
                        className={`
                          group relative flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-xl
                          transition-all duration-200 text-sm sm:text-base font-medium
                          min-h-[44px]
                          ${active 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'
                          }
                        `}
                        onClick={() => setSidebarOpen(false)}
                        aria-current={active ? "page" : undefined}
                        aria-label={`Navigate to ${link.name}`}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
                        <span className="truncate">{link.name}</span>
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 sm:h-8 bg-white rounded-r-full" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">© 2024 University</p>
            </div>
          </aside>
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 sm:px-6 h-full">
              {/* Title/Breadcrumbs */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {user
                    ? user.role.charAt(0).toUpperCase() +
                      user.role.slice(1) +
                      " Dashboard"
                    : "Dashboard"}
                </span>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                {/* Notifications */}
                <button
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  onClick={() => navigate("/notifications")}
                  aria-label="Notifications"
                >
                  <BellIcon className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                  )}
                  {unreadCount > 0 && unreadCount < 10 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                  {unreadCount > 9 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1 min-w-[18px] h-4 flex items-center justify-center">
                      9+
                    </span>
                  )}
                </button>
                
                {/* User menu */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {user && (
                    <div className="hidden sm:flex sm:items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                        {user.role === "incubator"
                          ? teamName || (user as any).teamName || user.name
                          : user.name}
                      </span>
                    </div>
                  )}
                  {user && (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {(user.role === "incubator"
                        ? (teamName || (user as any).teamName)?.[0]
                        : user.name?.[0]) || "U"}
                    </div>
                  )}
                </div>
                
                {/* Logout */}
                <ButtonLoader
                  loading={loggingOut}
                  onClick={handleLogout}
                  label="Logout"
                  loadingText="Logging out..."
                  variant="secondary"
                  size="sm"
                  className="hidden sm:inline-flex bg-gray-100 text-gray-700 hover:bg-gray-200"
                  icon={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                />
                {/* Mobile logout button */}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  aria-label="Logout"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>
          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
            <Outlet />
          </main>

          {/* Toast Container - Fixed position for multiple toasts */}
          <div className="fixed top-6 right-6 z-50 space-y-3 pointer-events-none">
            {toasts.map((toast) => (
              <div key={toast.id} className="pointer-events-auto">
                <Toast
                  message={toast.message}
                  type={toast.type}
                  onClose={() => removeToast(toast.id)}
                  action={toast.action}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToastContext.Provider>
  );
}
