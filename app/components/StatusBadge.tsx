import React from "react";

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800 border-green-400",
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-400",
  Completed: "bg-blue-100 text-blue-800 border-blue-400",
};

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span className={`inline-block px-3 py-1 rounded-full border text-xs font-bold ${statusColors[status] || "bg-gray-100 text-gray-700 border-gray-300"}`}>
    {status}
  </span>
);

export default StatusBadge; 