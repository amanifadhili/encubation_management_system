import React from "react";
import { Navigate } from "react-router-dom";

export default function IncubatorsRedirect() {
  return <Navigate to="/teams" replace />;
}

