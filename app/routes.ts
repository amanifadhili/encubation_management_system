import { type RouteConfig, route, layout } from "@react-router/dev/routes";

export default [
  // Public routes (no layout)
  route("/", "pages/Landing.tsx"),
  route("/login", "pages/Login.tsx"),

  // Protected/dashboard routes (with layout)
  route("/", "components/ProtectedRoute.tsx", {}, [
    route("/force-password-change", "pages/ForcePasswordChange.tsx"),
    layout("components/Layout.tsx", [
      route("/dashboard", "pages/Dashboard.tsx"),
      route("/teams", "pages/IncubatorManagement.tsx"),
      // Legacy alias for backwards compatibility (redirects to /teams)
      route("/incubators", "pages/IncubatorsRedirect.tsx"),
      // Quiet devtools probe path to avoid noisy 404s in dev
      route("/.well-known/appspecific/com.chrome.devtools.json", "pages/DevtoolsPlaceholder.tsx"),
      route("/mentors", "pages/MentorManagement.tsx"),
      route("/requests", "pages/RequestHandling.tsx"),
      route("/requests/create", "pages/CreateRequestPage.tsx"),
      route("/requests/:id", "pages/RequestDetailPage.tsx"),
      route("/requests/templates", "pages/RequestTemplatesPage.tsx"),
      route("/messaging", "pages/Messaging.tsx"),
      route("/inventory", "pages/StockManagement.tsx"),
      route("/inventory/assignments", "pages/InventoryAssignmentPage.tsx"),
      route("/inventory/locations", "pages/LocationsPage.tsx"),
      route("/inventory/suppliers", "pages/SuppliersPage.tsx"),
      route("/inventory/reservations", "pages/ReservationsPage.tsx"),
      route("/inventory/maintenance", "pages/MaintenancePage.tsx"),
      route("/inventory/barcode-scanner", "pages/BarcodeScannerPage.tsx"),
      route("/inventory/consumables", "pages/ConsumablesPage.tsx"),
      route("/reports", "pages/Reports.tsx"),
      route("/company-report/:id", "pages/CompanyReport.tsx"),
      route("/projects", "pages/Projects.tsx"),
      route("/projects/:id", "pages/ProjectDetails.tsx"),
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
