import { type RouteConfig, route, layout, index } from "@react-router/dev/routes";

export default [
  // Public routes (no layout)
  route("/", "pages/Landing.tsx"),
  route("/login", "pages/Login.tsx"),

  // Protected/dashboard routes (with layout)
  layout("components/Layout.tsx", [
    route("/dashboard", "pages/Dashboard.tsx"),
    // Add more protected/role-based routes here later
  ]),
] satisfies RouteConfig;
