import React from "react";
import { useAuth } from "../context/AuthContext";

interface RoleGuardProps {
  allowed: string[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowed, children }) => {
  const { user } = useAuth();
  if (!user || !allowed.includes(user.role)) return null;
  return <>{children}</>;
};

export default RoleGuard; 