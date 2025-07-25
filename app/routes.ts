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
      route("/calendar", "pages/Calendar.tsx"),
      route("/inventory", "pages/StockManagement.tsx"),
      route("/reports", "pages/Reports.tsx"),
      route("/announcements", "pages/Announcements.tsx"),
      route("/evaluations", "pages/Evaluation.tsx"),
      route("/audit", "pages/AuditTrail.tsx"),
      route("/notifications", "pages/Notifications.tsx"),
      route("/analytics", "pages/Analytics.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
