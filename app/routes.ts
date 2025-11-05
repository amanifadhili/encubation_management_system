import { type RouteConfig, route, layout } from "@react-router/dev/routes";

export default [
  // Public routes (no layout)
  route("/", "pages/Landing.tsx"),
  route("/login", "pages/Login.tsx"),

  // Protected/dashboard routes (with layout)
  route("/", "components/ProtectedRoute.tsx", {}, [
    layout("components/Layout.tsx", [
      route("/dashboard", "pages/Dashboard.tsx"),
      route("/incubators", "pages/IncubatorManagement.tsx"),
      route("/mentors", "pages/MentorManagement.tsx"),
      route("/requests", "pages/RequestHandling.tsx"),
      route("/messaging", "pages/Messaging.tsx"),
      route("/inventory", "pages/StockManagement.tsx"),
      route("/reports", "pages/Reports.tsx"),
      route("/projects", "pages/Projects.tsx"),
      route("/announcements", "pages/Announcements.tsx"),
      route("/notifications", "pages/Notifications.tsx"),
      route("/analytics", "pages/Analytics.tsx"),
      route("/users", "pages/UserManagement.tsx"),
      route("/manage-team", "pages/ManageTeam.tsx"),
      route("/director-dashboard", "pages/DirectorDashboard.tsx"),
      route("/email-preferences", "pages/EmailPreferences.tsx"),
      route("/profile", "pages/Profile.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
